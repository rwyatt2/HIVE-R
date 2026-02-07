-- ============================================================================
-- Migration 001: Add LLM Cost Tracking
-- Date: 2026-02-07
-- Description: Creates the llm_usage table for tracking LLM API call costs
-- ============================================================================

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

-- Index: agent breakdown queries
CREATE INDEX IF NOT EXISTS idx_llm_usage_agent ON llm_usage(agent_name);

-- Index: model breakdown queries
CREATE INDEX IF NOT EXISTS idx_llm_usage_model ON llm_usage(model);

-- Index: date range scans (daily/weekly/monthly)
CREATE INDEX IF NOT EXISTS idx_llm_usage_created ON llm_usage(created_at);

-- Index: per-user cost tracking
CREATE INDEX IF NOT EXISTS idx_llm_usage_user ON llm_usage(user_id);

-- Index: composite for daily agent aggregation
CREATE INDEX IF NOT EXISTS idx_llm_usage_daily ON llm_usage(created_at, agent_name);
