# 🚨 HIVE-R Operations Runbook

> For on-call engineers and operators. Each scenario has copy-pasteable commands and clear escalation paths.

**Health endpoints:**

```bash
# Quick status check
curl http://localhost:3000/health/ready | jq .

# Liveness (should always be 200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health/live
```

---

## 1. OpenAI API Down

### Symptoms

- `/health/ready` shows `openai_api.circuit: "open"`
- Status changes to `degraded` or `unhealthy`
- Logs show `🔄 Retry exhausted` and `⚡ Circuit breaker OPEN for gpt-4o`
- Router falls back to lower-tier models

### Detection

| Signal | Where |
|---|---|
| Circuit breaker opens | `GET /health/ready` → `openai_api.status: "error"` |
| Retry exhaustion | Server logs: `🔄 LLM: All 3 retries exhausted` |
| Fallback activation | Server logs: `⚡ Router fallback level N` |

### Impact

- **Users still get responses** — system falls back through 4 levels:
  1. GPT-4o (primary)
  2. GPT-4o-mini (cheaper, faster)
  3. Claude 3.5 Sonnet (cross-provider)
  4. Keyword-based routing (no LLM, regex rules)
- Response quality degrades at each level
- Individual agents that call GPT-4o directly (non-router) will fail with `CircuitOpenError`

### Automatic Mitigation

- **Retry logic**: 3 attempts with exponential backoff (1s → 2s → 4s + jitter)
- **Circuit breaker**: Opens after 5 consecutive failures, blocks further calls for 60s
- **Fallback chain**: Router automatically tries next model tier
- **Half-open recovery**: After timeout, circuit allows 1 test request to check if API is back

### Manual Intervention

```bash
# 1. Check OpenAI status page
open https://status.openai.com

# 2. Verify API key is still valid
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data | length'

# 3. Check circuit breaker state
curl http://localhost:3000/health/ready | jq '.checks.openai_api'

# 4. If key is revoked, rotate it
# Update .env with new OPENAI_API_KEY, then restart:
pm2 restart hive-r
# OR
docker restart hive-r
```

### Prevention

- Set up OpenAI status page alerts (RSS or email)
- Always have `ANTHROPIC_API_KEY` configured as cross-provider fallback
- Monitor `GET /metrics` for `routerFallbackMetrics` to catch degradation early

---

## 2. Database Locked / Unavailable

### Symptoms

- `/health/ready` returns **503** with `database.status: "error"`
- Status is `unhealthy`
- Errors in logs: `SQLITE_BUSY: database is locked` or `SQLITE_CANTOPEN`
- Chat requests fail — conversation history cannot be loaded/saved

### Detection

| Signal | Where |
|---|---|
| Health check fails | `GET /health/ready` → HTTP 503, `database.status: "error"` |
| SQLite errors | Server logs: `SQLITE_BUSY` or `SQLITE_CANTOPEN` |

### Impact

- **Critical** — database down = system `unhealthy` (returns 503)
- New conversations cannot be created
- Existing conversation history lost for current session
- Cost tracking data may not be persisted

### Automatic Mitigation

- Health check caches results for 30s to avoid hammering a locked database
- Individual agent calls wrapped in `safeAgentCall` — agents return graceful error messages

### Manual Intervention

```bash
# 1. Check if database file exists and has correct permissions
ls -la ./data/hive.db

# 2. Check for lock files
ls -la ./data/hive.db-wal ./data/hive.db-shm

# 3. Check for processes holding the database
fuser ./data/hive.db        # Linux
lsof ./data/hive.db          # macOS

# 4. If locked by a zombie process, kill it
kill -9 <PID_FROM_ABOVE>

# 5. If database is corrupted, check integrity
sqlite3 ./data/hive.db "PRAGMA integrity_check;"

# 6. If corrupted beyond repair, restore from backup
cp ./data/backups/hive.db.latest ./data/hive.db

# 7. Restart the service
pm2 restart hive-r
```

### Prevention

- Set `journal_mode=WAL` in SQLite for better concurrency: `PRAGMA journal_mode=WAL;`
- Ensure only one HIVE-R process accesses the database (don't run multiple instances)
- Configure regular backups: `cp ./data/hive.db ./data/backups/hive.db.$(date +%Y%m%d)`
- Monitor disk space — SQLite fails silently when disk is full

---

## 3. Memory Leak / High Memory Usage

### Symptoms

- `/health/ready` shows `memory.status: "warning"` with `usage_pct > 90`
- Status changes to `degraded`
- Node.js process RSS grows steadily over time
- Eventual `ENOMEM` errors or OOM kills

### Detection

| Signal | Where |
|---|---|
| Health check warning | `GET /health/ready` → `memory.usage_pct > 90` |
| OOM kill | `dmesg | grep -i oom` (Linux) |
| Process monitoring | `pm2 monit` or container metrics |

### Impact

- **Degraded** service — responses slow down as GC pressure increases
- If unchecked, Node.js crashes or container gets OOM-killed
- K8s liveness probe will restart the pod automatically

### Automatic Mitigation

- Health check reports `memory.status: "warning"` when usage > 90%
- K8s readiness probe returns 200 (degraded, not unhealthy) — traffic keeps flowing
- K8s restarts container if liveness probe fails after OOM crash

### Manual Intervention

```bash
# 1. Check current memory usage
curl http://localhost:3000/health/ready | jq '.checks.memory'

# 2. Get detailed Node.js memory breakdown
node -e "console.log(JSON.stringify(process.memoryUsage(), null, 2))"

# 3. Take a heap snapshot (if running locally)
kill -USR2 $(pgrep -f "node.*hive")  # Triggers heapdump if configured

# 4. Quick fix: restart the process
pm2 restart hive-r
# OR
docker restart hive-r

# 5. If recurring, set memory limit and auto-restart
pm2 start ecosystem.config.js --max-memory-restart 1024M
```

### Prevention

- Set `MEMORY_THRESHOLD_MB=1024` in `.env` to define warning threshold
- Configure PM2 or K8s with `--max-memory-restart` for auto-restart
- Profile with `--inspect` flag and Chrome DevTools during development
- K8s: set `resources.limits.memory` to prevent unbounded growth

```yaml
# K8s deployment snippet
resources:
  requests:
    memory: "512Mi"
  limits:
    memory: "1Gi"
```

---

## 4. Budget Exceeded

### Symptoms

- All LLM calls fail with `BudgetExceededError`
- Logs show: `💰 Daily budget exceeded: $X.XX / $Y.YY`
- Users get error responses from all agents
- `/health/ready` still returns `healthy` (budget is a business rule, not infrastructure)

### Detection

| Signal | Where |
|---|---|
| Budget error in logs | Server logs: `BudgetExceededError` |
| Cost dashboard | `GET /admin/costs` shows daily spend |
| All agents failing | Multiple `[AgentName Error]` responses |

### Impact

- **All LLM-dependent features stop** — agents cannot process requests
- Non-LLM features (health checks, metrics, static pages) continue working
- Retry logic does **not** retry budget errors (by design — prevents runaway costs)

### Automatic Mitigation

- `BudgetExceededError` is thrown before any API call is made (pre-check)
- Retry logic classifies it as non-retryable — prevents infinite cost loops
- Cost is tracked per-agent for granular visibility

### Manual Intervention

```bash
# 1. Check current daily spend
curl http://localhost:3000/admin/costs | jq .

# 2. Check which agent is consuming the most
curl http://localhost:3000/metrics | jq '.costs'

# 3. Option A: Increase the daily budget
# Edit .env:
#   DAILY_BUDGET=50.00
# Then restart:
pm2 restart hive-r

# 4. Option B: Wait for daily reset (midnight UTC)
# Budget resets automatically at 00:00 UTC

# 5. Option C: Reduce cost by switching to cheaper models
# Edit .env:
#   DEFAULT_MODEL=gpt-4o-mini
# Then restart
```

### Prevention

- Set conservative budget with headroom: `DAILY_BUDGET=20.00`
- Configure cost alerts in `docs/operations/cost-alerts.md`
- Use GPT-4o-mini for lower-value tasks (routing, simple queries)
- Review per-agent cost breakdown weekly via `/admin/costs`

---

## 5. Agent Stuck in Loop

### Symptoms

- Builder agent logs show `🔄 Builder: Detected failure, retry N/3` repeating
- Single request consuming many sequential LLM calls
- Cost for one thread spikes
- User sees no response (request hangs)

### Detection

| Signal | Where |
|---|---|
| Builder retry logs | Server logs: `🔄 Builder: retry N/3` |
| Thread cost spike | `GET /admin/costs` shows one thread with high cost |
| Request timeout | Client receives 504 or hangs |

### Impact

- **Single user affected** — other conversations continue normally
- Builder agent consumes budget with repeated failing attempts
- After `MAX_RETRIES` (3), Builder gives up and returns error to user

### Automatic Mitigation

- **Builder loop guard**: `MAX_RETRIES = 3` — after 3 tool execution attempts, Builder returns error message to user with the last error context
- **Circuit breaker**: If the LLM itself is failing, circuit opens after 5 failures
- **Budget enforcement**: If loop drives cost too high, `BudgetExceededError` stops it
- **safeAgentCall**: Wraps all agent executions with try/catch — never crashes the server

### Manual Intervention

```bash
# 1. Identify the stuck thread
curl http://localhost:3000/traces | jq '.traces | sort_by(.startTime) | last'

# 2. Check if it's still running (look for active LangGraph runs)
curl http://localhost:3000/metrics | jq '.activeRuns'

# 3. If the server is overloaded, restart it
pm2 restart hive-r

# 4. If a specific model is causing loops (bad structured output)
# Temporarily force a different model:
export FORCE_FALLBACK_LEVEL=1  # Skip GPT-4o, use GPT-4o-mini
pm2 restart hive-r

# 5. Review the failing prompt in traces
curl http://localhost:3000/traces/<trace-id> | jq '.messages'
```

### Prevention

- Keep `MAX_RETRIES` at 3 (default) — don't increase without good reason
- Monitor builder retry rate via metrics
- Test tool definitions locally before deploying changes
- Use `FORCE_FALLBACK_LEVEL=1` in staging for cheaper testing

---

## Escalation Path

If manual steps don't resolve the issue:

| Severity | Action | Timeline |
|---|---|---|
| P1 (system down) | Restart service, check health endpoint | Immediate |
| P2 (degraded) | Check specific failing component | 15 minutes |
| P3 (single user) | Review traces, restart if needed | 1 hour |
| P4 (monitoring) | Review metrics in next business day | Next day |

**Recovery priority order:**
1. Database → everything depends on it
2. LLM APIs → core functionality
3. Memory/Disk → infrastructure health
4. Budget → business constraint
5. Agent loops → isolated impact

---

## Quick Reference

```bash
# Health check (full)
curl http://localhost:3000/health/ready | jq .

# Cost check
curl http://localhost:3000/admin/costs | jq .

# Metrics
curl http://localhost:3000/metrics | jq .

# Traces (recent)
curl http://localhost:3000/traces | jq '.traces[-5:]'

# Restart
pm2 restart hive-r
# OR
docker restart hive-r
```
