# Database Optimization

## Overview

HIVE-R uses SQLite (via `better-sqlite3`) for all persistence: LLM usage tracking, chat history, user auth, billing, organizations, and vector memory. All databases use WAL mode and optimized PRAGMA settings.

## WAL Mode & PRAGMA Tuning

Every database connection calls `optimizeDatabase()` from `src/lib/db-init.ts`:

| PRAGMA | Value | Effect |
|---|---|---|
| `journal_mode` | WAL | Concurrent reads during writes |
| `synchronous` | NORMAL | ~2x faster writes (safe with WAL) |
| `cache_size` | -8000 (8MB) | Larger page cache |
| `busy_timeout` | 5000 | 5s lock wait instead of immediate fail |
| `temp_store` | MEMORY | Temp tables in RAM |

## Index Strategy

### llm_usage (heavy writes, frequent aggregations)

| Index | Columns | Purpose |
|---|---|---|
| `idx_llm_usage_agent` | `agent_name` | Filter by agent |
| `idx_llm_usage_model` | `model` | Filter by model |
| `idx_llm_usage_created` | `created_at` | Date range queries |
| `idx_llm_usage_user` | `user_id` | Per-user queries |
| `idx_llm_usage_daily` | `created_at, agent_name` | Daily breakdowns |
| `idx_llm_usage_covering` | `created_at, agent_name, cost_usd, tokens_in, tokens_out` | **Covering index** — avoids table lookups for aggregation |
| `idx_llm_usage_thread` | `thread_id` | Thread cost queries |
| `idx_llm_usage_model_date` | `model, created_at` | Model cost over time |

### chat_messages / chat_sessions

| Index | Columns | Purpose |
|---|---|---|
| `idx_messages_session` | `session_id` | FK lookups |
| `idx_messages_session_ts` | `session_id, timestamp` | Ordered message retrieval |
| `idx_sessions_user` | `user_id` | User's sessions |
| `idx_sessions_updated` | `updated_at` | Recent sessions |
| `idx_sessions_user_updated` | `user_id, updated_at` | User's recent sessions |

### Other Tables

- `usage_records(customer_id, timestamp)` — billing period queries
- `organizations(owner_id)` — FK index
- `refresh_tokens(expires_at)` — cleanup query

## Query Optimization: getDailyCost()

This function is called on **every LLM request** (budget check). Before:

```sql
-- FULL TABLE SCAN: date() function prevents index usage
WHERE date(created_at) = '2026-02-07'
```

After:

```sql
-- USES INDEX: range query on created_at column
WHERE created_at >= '2026-02-07T00:00:00.000Z'
  AND created_at <= '2026-02-07T23:59:59.999Z'
```

The prepared statement is also cached at module level to avoid re-compilation overhead.

## Validation

```bash
# Check WAL mode is active
sqlite3 data/hive.db "PRAGMA journal_mode;"
# → wal

# Verify index usage on aggregation query
sqlite3 data/hive.db "EXPLAIN QUERY PLAN SELECT SUM(cost_usd) FROM llm_usage WHERE created_at >= '2026-02-07T00:00:00Z' AND created_at <= '2026-02-07T23:59:59Z' GROUP BY agent_name;"
# → SEARCH llm_usage USING INDEX idx_llm_usage_covering
```
