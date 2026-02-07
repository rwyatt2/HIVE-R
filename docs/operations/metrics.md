# Metrics Operations Guide

HIVE-R exposes Prometheus metrics at **`GET /metrics`** (no auth required).

## Quick Start

```bash
# Start HIVE-R
npm run dev

# Verify metrics endpoint
curl http://localhost:3000/metrics
```

## Metrics Reference

| Metric | Type | Labels | Description |
|---|---|---|---|
| `hive_http_requests_total` | Counter | `method`, `path`, `status` | HTTP request count |
| `hive_http_request_duration_seconds` | Histogram | `method`, `path`, `status` | Latency (p50/p95/p99) |
| `hive_agent_invocations_total` | Counter | `agent` | Agent call count |
| `hive_token_usage_total` | Counter | `model`, `agent`, `direction` | Token consumption |
| `hive_llm_call_cost_dollars_total` | Counter | `model`, `agent` | Cumulative cost |
| `hive_cost_dollars` | Gauge | — | Current daily spend |
| `hive_circuit_breaker_state` | Gauge | `model` | 0=closed, 0.5=half_open, 1=open |

Default Node.js metrics (GC, event loop, memory) are also collected with `hive_` prefix.

## Histogram Buckets

Latency histogram uses these bucket boundaries (seconds):

```
0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10
```

## Prometheus Scrape Config

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'hive-r'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: /metrics
```

## Grafana Dashboard

Import the dashboard from `grafana/hive-dashboard.json`:

1. Open Grafana → **Dashboards** → **Import**
2. Upload `grafana/hive-dashboard.json`
3. Select your Prometheus data source
4. Dashboard includes 7 panels: request rate, error rate, latency percentiles, agent invocations, token usage, daily cost, circuit breaker state

## Adding Custom Metrics

```typescript
import client from "prom-client";
import { register } from "../lib/metrics.js";

// Define a new metric
const myCounter = new client.Counter({
    name: "hive_my_custom_total",
    help: "Description of metric",
    labelNames: ["label1"] as const,
    registers: [register],
});

// Increment it
myCounter.inc({ label1: "value" });
```

### Naming Conventions

- Prefix: `hive_`
- Suffix by type: `_total` (counter), `_seconds` (histogram), `_bytes` (gauge)
- Snake case: `hive_http_request_duration_seconds`
- Labels: lowercase, short (`agent`, `model`, `status`)

## Path Normalisation

Dynamic URL segments are normalised to prevent label cardinality explosion:

| Raw Path | Normalised |
|---|---|
| `/chat/abc-123-def` | `/chat/:id` |
| `/thread/thread_abc123` | `/thread/:id` |
| `/users/42/profile` | `/users/:id/profile` |

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/metrics` returns 401 | Endpoint must be mounted before auth middleware — check `index.ts` |
| Missing agent metrics | Ensure agent uses `safeAgentCall` wrapper |
| No token metrics | Verify `createTrackedLLM` is used (not raw `ChatOpenAI`) |
| Circuit breaker always 0 | Normal — 0 = CLOSED (healthy) |
