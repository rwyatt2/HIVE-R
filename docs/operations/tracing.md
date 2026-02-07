# Distributed Tracing with OpenTelemetry

HIVE-R uses OpenTelemetry to trace requests end-to-end through all agent invocations, exported to Jaeger for visualization.

## Quick Start

```bash
# 1. Start Jaeger (included in monitoring stack)
docker compose -f docker-compose.monitoring.yml up -d jaeger

# 2. Enable tracing
echo "OTEL_ENABLED=true" >> .env

# 3. Start HIVE-R
npm run dev

# 4. Make a request
curl http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "build a button component"}'

# 5. View traces
open http://localhost:16686
# Service: "hive-r" → Find Traces
```

## Architecture

```
┌──────────────┐    OTLP/HTTP     ┌─────────────┐
│   HIVE-R     │ ───────────────► │   Jaeger    │
│   :3000      │    port 4318     │   :16686    │
└──────────────┘                  └─────────────┘

Request flow (visible as waterfall):
HTTP POST /chat
 └─ hive.agent.Router        (agent.model=gpt-4o, tokens_in=150, ...)
     ├─ hive.agent.Builder    (agent.model=gpt-4o, tokens_in=800, agent.cost=0.02)
     ├─ hive.agent.Reviewer   (agent.model=gpt-4o, tokens_in=600, ...)
     └─ hive.agent.Security   (agent.model=gpt-4o-mini, ...)
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OTEL_ENABLED` | `false` | Set to `"true"` to activate tracing |
| `OTEL_EXPORTER_URL` | `http://localhost:4318` | OTLP HTTP endpoint |
| `OTEL_SAMPLE_RATE` | `1.0` (dev) / `0.1` (prod) | Sampling ratio (0.0–1.0) |
| `OTEL_SERVICE_NAME` | `hive-r` | Service name in Jaeger |

## Span Attributes

Every agent span includes these attributes:

| Attribute | Type | Description |
|---|---|---|
| `agent.name` | string | Agent name (Router, Builder, …) |
| `agent.model` | string | LLM model used (gpt-4o, etc.) |
| `agent.tokens_in` | number | Input tokens consumed |
| `agent.tokens_out` | number | Output tokens generated |
| `agent.cost` | number | LLM cost in USD |
| `agent.duration_ms` | number | Agent execution time |

## What Gets Traced

### Automatic (via OTel HTTP instrumentation)
- All inbound HTTP requests (`POST /chat`, `GET /health`, etc.)
- Request/response status, timing, headers

### Manual (via `safeAgentCall` wrapper)
- Every agent invocation creates a child span: `hive.agent.<AgentName>`
- LLM callback handler (`handleLLMEnd`) enriches spans with model/token/cost data
- Parent-child hierarchy preserved: Router → Builder → Reviewer

## Sampling Configuration

| Environment | Rate | Traffic at 100 req/s |
|---|---|---|
| Development | 100% | All traces captured |
| Staging | 50% | ~50 req/s traced |
| Production | 10% | ~10 req/s traced |

> [!TIP]
> Start with 100% in dev and lower to 10% in production. Set via `OTEL_SAMPLE_RATE=0.1`.

## Jaeger UI Guide

1. Open **http://localhost:16686**
2. Select **Service**: `hive-r`
3. Click **Find Traces**
4. Click any trace to see the waterfall view
5. Expand spans to see per-agent attributes (model, tokens, cost)

### Useful queries
- **Longest traces**: Sort by duration (descending)
- **Error traces**: Filter by `error=true`
- **Specific agent**: Search tag `agent.name=Builder`
- **Expensive calls**: Search tag `agent.cost` > 0.01

## Performance Impact

- **When disabled** (`OTEL_ENABLED=false`): Zero overhead. The SDK is not loaded. Only no-op tracer functions are called.
- **When enabled**: ~1-2ms per request for span creation and OTLP batched export. Export is async and batched every 5 seconds.

## Troubleshooting

| Symptom | Fix |
|---|---|
| No traces in Jaeger | Check `OTEL_ENABLED=true` in `.env` |
| Connection refused | Ensure Jaeger is running, check `OTEL_EXPORTER_URL` |
| Missing agent spans | Verify agents use `safeAgentCall` wrapper |
| Missing token/cost attrs | Ensure agents use `createTrackedLLM` |
| Too many traces in prod | Lower `OTEL_SAMPLE_RATE` to `0.1` |
