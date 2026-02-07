# Semantic Caching Architecture

HIVE-R uses semantic caching to avoid redundant LLM calls for similar queries, reducing latency and cost.

## How It Works

```
User Query ──▶ safeAgentCall
                  │
                  ├── 1. Exact hash match? ──▶ Cache HIT (instant)
                  │
                  ├── 2. Cosine similarity ≥ 0.95? ──▶ Cache HIT (fast)
                  │
                  └── 3. Cache MISS ──▶ LLM call ──▶ Store result
```

### Dual-Path Lookup

1. **Exact match** — SHA-256 hash of normalized query text. Fastest path (~1ms).
2. **Semantic match** — OpenAI `text-embedding-3-small` embeddings with cosine similarity. Catches paraphrased queries ("build login form" ≈ "create sign-in page").

### Cacheable Agents

| Agent | TTL | Rationale |
|---|---|---|
| Planner, Founder, PM, UX Researcher | 24h | Strategic advice is stable |
| Designer, Security, Reviewer, A11y, TechWriter, SRE, DataAnalyst | 1h | Context-sensitive |
| **Builder**, **Tester** | ❌ Never | Side effects (file writes, commands) |

## Configuration

```bash
CACHE_ENABLED=true                    # Enable/disable globally
CACHE_REDIS_URL=redis://localhost:6379 # Leave empty for in-memory fallback
CACHE_SIMILARITY_THRESHOLD=0.95       # 0.0–1.0 (higher = stricter matching)
CACHE_DEFAULT_TTL_HOURS=1             # Default for agents not in TTL map
```

## Storage Backends

| Backend | When Used | Persistence |
|---|---|---|
| **Redis** | `CACHE_REDIS_URL` is set | Yes (survives restart) |
| **In-memory** | No Redis URL | No (process-bound) |

Redis Stack is included in `docker-compose.yml`. RedisInsight UI available at `:8001`.

## Admin API

| Endpoint | Method | Description |
|---|---|---|
| `/admin/cache/stats` | GET | Hit rate, entry count, per-agent breakdown |
| `/admin/cache/clear` | DELETE | Clear all or `?agent=Planner` |

## Prometheus Metrics

| Metric | Type | Labels |
|---|---|---|
| `hive_cache_hits_total` | Counter | `agent` |
| `hive_cache_misses_total` | Counter | `agent` |
| `hive_cache_latency_seconds` | Histogram | `operation` (get/set) |

## Cache Bypass

Agents with side effects (Builder, Tester) are automatically excluded via `NON_CACHEABLE_AGENTS` set. No manual configuration needed.

## Tuning

- **Threshold too low** (< 0.90): False positives — wrong cached answers served
- **Threshold too high** (> 0.98): Low hit rate — cache rarely matches
- **Recommended**: Start at 0.95, monitor `hive_cache_hits_total` / `hive_cache_misses_total` ratio, adjust
