# Logging Operations Guide

HIVE-R uses **Pino** for structured JSON logging across the entire application.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `production` → JSON, `development` → pretty-print |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | Pino log level: `debug`, `info`, `warn`, `error`, `fatal`, `silent` |
| `VITEST` | — | Set automatically; silences logs during tests |

## Logger Instance

```typescript
import { logger } from "./lib/logger.js";

// Basic usage (Pino signature: object first, message second)
logger.info({ userId, action }, "User performed action");
logger.error({ err: error }, "Operation failed");
logger.warn({ threshold: 80 }, "Approaching limit");
logger.debug({ query, results: rows.length }, "Database query completed");
```

## Custom Methods

The logger provides domain-specific helpers:

```typescript
logger.agentStart("Builder", { taskId });
logger.agentEnd("Builder", durationMs, { linesChanged: 42 });
logger.agentError("Tester", error, { testFile: "app.test.ts" });
logger.routingDecision("Router", "Builder", "Code changes needed");
logger.toolCall("web_search", "UXResearcher", { query: "..." });
logger.toolResult("web_search", "UXResearcher", true, 1200);
logger.safetyTrigger("profanity detected", { input: "[REDACTED]" });
```

## Child Loggers

Create loggers with pre-bound context:

```typescript
import { createAgentLogger } from "./lib/logger.js";

const log = createAgentLogger("Builder", { sessionId });
log.info("Starting build"); // automatically includes { agentName: "Builder", sessionId }
```

## Sensitive Data Redaction

The following fields are automatically redacted to `[REDACTED]`:

- `apiKey`, `password`, `secret`, `token`, `authorization`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `req.headers.authorization`

## Output Formats

### Development (pretty-printed)
```
14:32:15.123 INFO  Agent starting: Builder
    agentName: "Builder"
    event: "agent_start"
```

### Production (JSON)
```json
{"level":"info","time":"2026-02-07T14:32:15.123Z","agentName":"Builder","event":"agent_start","msg":"Agent starting: Builder"}
```

## Log Rotation (Production)

Use OS-level `logrotate` (Pino team recommendation for performance):

```bash
# /etc/logrotate.d/hive-r
/var/log/hive-r/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

Run HIVE-R with output piped to a log file:

```bash
node dist/index.js 2>&1 | tee -a /var/log/hive-r/app.log
```

## Intentional Console Usage

Two files intentionally use `console.*` instead of the logger:

| File | Reason |
|---|---|
| `src/cli.ts` | CLI user-facing output (stdout for humans) |
| `src/mcp-server.ts` | MCP protocol requires stderr for diagnostics (stdout is JSON-RPC) |

## Log Aggregation

Pino JSON output is compatible with:

- **ELK Stack** — pipe to Filebeat/Logstash
- **Datadog** — use Datadog agent with JSON log parsing
- **Grafana Loki** — use Promtail with JSON parser
- **CloudWatch** — JSON logs are automatically parsed

## Troubleshooting

| Symptom | Fix |
|---|---|
| No logs visible | Check `LOG_LEVEL` — may be set to `silent` |
| Logs not JSON | Set `NODE_ENV=production` |
| Too verbose | Set `LOG_LEVEL=warn` |
| MCP server corrupted | Ensure MCP server uses `console.error` (stderr), never stdout |
