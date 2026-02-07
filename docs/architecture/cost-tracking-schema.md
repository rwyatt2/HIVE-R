# LLM Cost Tracking Schema

**Date:** 2026-02-07  
**Designed by:** Data Analyst agent

---

## Table: `llm_usage`

Tracks every LLM API call for cost visibility, budget alerting, and agent performance analysis.

```sql
CREATE TABLE IF NOT EXISTS llm_usage (
    id            TEXT PRIMARY KEY,
    agent_name    TEXT NOT NULL,
    model         TEXT NOT NULL,
    tokens_in     INTEGER NOT NULL,
    tokens_out    INTEGER NOT NULL,
    cost_usd      REAL NOT NULL,
    latency_ms    INTEGER NOT NULL,
    thread_id     TEXT,
    user_id       TEXT,
    metadata      TEXT,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Column Details

| Column | Purpose |
|---|---|
| `id` | UUID v4, consistent with all HIVE-R tables |
| `agent_name` | HIVE agent: "Security", "Builder", "Router", etc. |
| `model` | LLM model: "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo" |
| `tokens_in` | Prompt tokens (input) |
| `tokens_out` | Completion tokens (output) |
| `cost_usd` | Computed cost: `(tokens_in * input_rate + tokens_out * output_rate)` |
| `latency_ms` | Wall-clock LLM call duration |
| `thread_id` | Links to conversation thread (nullable) |
| `user_id` | Who triggered the call (nullable) |
| `metadata` | JSON blob: function calls, error info, etc. |
| `created_at` | ISO 8601 timestamp |

---

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_llm_usage_agent     ON llm_usage(agent_name);
CREATE INDEX IF NOT EXISTS idx_llm_usage_model     ON llm_usage(model);
CREATE INDEX IF NOT EXISTS idx_llm_usage_created   ON llm_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_usage_user      ON llm_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_daily     ON llm_usage(created_at, agent_name);
```

| Index | Optimizes |
|---|---|
| `idx_llm_usage_agent` | `getAgentCosts()` — group by agent |
| `idx_llm_usage_model` | `getModelCosts()` — group by model |
| `idx_llm_usage_created` | `getDailyCost()` — date range scans |
| `idx_llm_usage_user` | Per-user cost tracking |
| `idx_llm_usage_daily` | Composite for daily agent aggregation |

---

## Aggregation Strategy

No materialized views. All aggregations use SQL date functions on the indexed `created_at` column:

```sql
-- Daily cost
SELECT date(created_at) as day, SUM(cost_usd)
FROM llm_usage
WHERE created_at >= date('now', '-7 days')
GROUP BY day;

-- Weekly by agent
SELECT agent_name, SUM(cost_usd), SUM(tokens_in + tokens_out) as total_tokens
FROM llm_usage
WHERE created_at >= date('now', '-7 days')
GROUP BY agent_name
ORDER BY SUM(cost_usd) DESC;
```

This approach stays efficient up to ~1M rows. Beyond that, consider nightly aggregation into a `llm_usage_daily` summary table.

---

## Model Pricing (used for cost calculation)

| Model | Input ($/1M tokens) | Output ($/1M tokens) |
|---|---|---|
| gpt-4o | $2.50 | $10.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4-turbo | $10.00 | $30.00 |
| gpt-3.5-turbo | $0.50 | $1.50 |

Pricing is maintained in `src/lib/cost-tracker.ts` and should be updated when OpenAI changes rates.
