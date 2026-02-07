# Monitoring Setup Guide

HIVE-R ships with a pre-configured Prometheus + Grafana monitoring stack.

## Quick Start

```bash
# Start the monitoring stack (Prometheus + Grafana)
docker compose -f docker-compose.monitoring.yml up -d

# Start HIVE-R (if not already running)
npm run dev

# Verify
curl http://localhost:3000/metrics   # HIVE-R metrics
curl http://localhost:9090/-/healthy  # Prometheus
open http://localhost:3001            # Grafana (admin/admin)
```

## Architecture

```
┌─────────────────┐     scrape /metrics     ┌──────────────┐
│   HIVE-R :3000  │ ◄──────────────────────  │  Prometheus  │
│   (your app)    │         every 15s        │    :9090     │
└─────────────────┘                          └──────┬───────┘
                                                    │ query
                                             ┌──────▼───────┐
                                             │   Grafana    │
                                             │    :3001     │
                                             └──────────────┘
```

## What's Included

| File | Purpose |
|---|---|
| `docker-compose.monitoring.yml` | Prometheus + Grafana containers |
| `prometheus.yml` | Scrape config for HIVE-R |
| `prometheus-alerts.yml` | Alert rules (error rate, cost, latency, memory) |
| `grafana/dashboards/hive-overview.json` | 11-panel operations dashboard |
| `grafana/provisioning/datasources/` | Auto-configures Prometheus data source |
| `grafana/provisioning/dashboards/` | Auto-loads dashboard on startup |

## Dashboard Panels

### Row 1 — Key Indicators (above the fold)
| Panel | Type | Description |
|---|---|---|
| Request Rate | Line chart | HTTP req/s by endpoint (last 1h) |
| Response Latency | Line chart | p50/p95/p99 with threshold colors |
| Error Rate | Gauge | % of 5xx responses (green/yellow/red) |
| Circuit Breaker | Status | Per-model state (CLOSED ✓ / OPEN ✗) |

### Row 2 — Usage & Cost
| Panel | Type | Description |
|---|---|---|
| Agent Invocations | Bar chart | Invocations per agent (filterable) |
| Token Usage | Stacked area | Input/output tokens by model over time |
| Cost Burn Rate | Line chart | $/hour LLM spend |
| Daily Spend | Stat | Current day total in USD |

### Row 3 — System Health
| Panel | Type | Description |
|---|---|---|
| Memory | Line chart | Heap used, heap total, RSS |
| Event Loop Lag | Line chart | Node.js event loop delay |
| Active Handles | Line chart | libuv handles and requests |

## Template Variables

The dashboard includes two filter variables at the top:

- **`$agent`** — Filter agent-related panels (multi-select, default: All)
- **`$model`** — Filter model-related panels (multi-select, default: All)

## Alert Rules

| Alert | Condition | Severity | For |
|---|---|---|---|
| `HighErrorRate` | Error rate > 5% | Critical | 2m |
| `HighCostBurnRate` | Cost > $10/hr | Warning | 5m |
| `CircuitBreakerOpen` | Any model circuit open | Critical | 1m |
| `HighLatency` | p99 > 10s | Warning | 5m |
| `HighMemoryUsage` | Heap > 1.5 GB | Warning | 5m |

## Configuration

### Change scrape interval

Edit `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: "hive-r"
    scrape_interval: 5s  # default: 15s
```

### Change HIVE-R target

If HIVE-R runs on a different host/port:
```yaml
static_configs:
  - targets: ["your-host:3000"]
```

### Change Grafana password

Edit `docker-compose.monitoring.yml`:
```yaml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=your-secure-password
```

### Running with the main app container

```bash
# Run everything together
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

When running inside Docker, update `prometheus.yml` to target the app container:
```yaml
static_configs:
  - targets: ["hive:3000"]  # service name from docker-compose.yml
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Grafana empty panels | Wait 30s for first scrape, check Prometheus targets at `:9090/targets` |
| Prometheus can't reach HIVE-R | Ensure `host.docker.internal` resolves (Docker Desktop), or use container networking |
| Alert rules not showing | Check `prometheus-alerts.yml` YAML syntax, then `http://localhost:9090/rules` |
| Dashboard not auto-loading | Verify provisioning volume mounts in `docker-compose.monitoring.yml` |
| "No data" on agent/cost panels | These populate only after LLM calls are made |

## Stopping the Stack

```bash
docker compose -f docker-compose.monitoring.yml down

# To also remove persisted data
docker compose -f docker-compose.monitoring.yml down -v
```
