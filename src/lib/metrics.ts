/**
 * Prometheus Metrics Registry for HIVE-R
 *
 * Centralised metric definitions backed by prom-client.
 * All custom metrics are prefixed with `hive_`.
 *
 * Usage:
 *   import { register, recordAgentInvocation } from "../lib/metrics.js";
 *   recordAgentInvocation("Builder");
 */

import client from "prom-client";

// ============================================================================
// REGISTRY
// ============================================================================

export const register = new client.Registry();

// Collect default Node.js metrics (GC, event loop lag, memory, etc.)
client.collectDefaultMetrics({ register, prefix: "hive_" });

// ============================================================================
// HTTP METRICS
// ============================================================================

/** Total HTTP requests by method, normalised path, and status code. */
export const httpRequestsTotal = new client.Counter({
    name: "hive_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "path", "status"] as const,
    registers: [register],
});

/** HTTP request duration in seconds (histogram with percentile buckets). */
export const httpRequestDuration = new client.Histogram({
    name: "hive_http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "path", "status"] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
});

// ============================================================================
// AGENT METRICS
// ============================================================================

/** Total agent invocations by agent name. */
export const agentInvocationsTotal = new client.Counter({
    name: "hive_agent_invocations_total",
    help: "Total number of agent invocations",
    labelNames: ["agent"] as const,
    registers: [register],
});

// ============================================================================
// LLM / TOKEN METRICS
// ============================================================================

/** Total tokens consumed, split by model, agent, and direction (input/output). */
export const tokenUsageTotal = new client.Counter({
    name: "hive_token_usage_total",
    help: "Total token usage by model and direction",
    labelNames: ["model", "agent", "direction"] as const,
    registers: [register],
});

/** Cumulative LLM cost in USD by model and agent. */
export const llmCostTotal = new client.Counter({
    name: "hive_llm_call_cost_dollars_total",
    help: "Cumulative LLM API cost in USD",
    labelNames: ["model", "agent"] as const,
    registers: [register],
});

/** Current daily spend in USD (gauge, reset daily by the budget alert service). */
export const dailyCostGauge = new client.Gauge({
    name: "hive_cost_dollars",
    help: "Current daily spend in USD",
    registers: [register],
});

// ============================================================================
// CIRCUIT BREAKER METRICS
// ============================================================================

/** Circuit breaker state per model: 0 = closed, 0.5 = half_open, 1 = open. */
export const circuitBreakerState = new client.Gauge({
    name: "hive_circuit_breaker_state",
    help: "Circuit breaker state (0=closed, 0.5=half_open, 1=open)",
    labelNames: ["model"] as const,
    registers: [register],
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Record an agent invocation.
 */
export function recordAgentInvocation(agent: string): void {
    agentInvocationsTotal.inc({ agent });
}

/**
 * Record token usage from an LLM call.
 */
export function recordTokenUsage(
    model: string,
    agent: string,
    tokensIn: number,
    tokensOut: number,
): void {
    tokenUsageTotal.inc({ model, agent, direction: "input" }, tokensIn);
    tokenUsageTotal.inc({ model, agent, direction: "output" }, tokensOut);
}

/**
 * Record LLM call cost and update the daily spend gauge.
 */
export function recordCost(model: string, agent: string, costUsd: number): void {
    llmCostTotal.inc({ model, agent }, costUsd);
    dailyCostGauge.inc(costUsd);
}

/**
 * Set the daily cost gauge to an absolute value (e.g. from database query).
 */
export function updateDailyCost(costUsd: number): void {
    dailyCostGauge.set(costUsd);
}

/**
 * Set circuit breaker state for a model.
 * @param stateValue 0 = closed, 0.5 = half_open, 1 = open
 */
export function setCircuitBreakerState(model: string, stateValue: number): void {
    circuitBreakerState.set({ model }, stateValue);
}

/**
 * Map CircuitState enum string to numeric gauge value.
 */
export function circuitStateToNumber(state: string): number {
    switch (state) {
        case "CLOSED":
            return 0;
        case "HALF_OPEN":
            return 0.5;
        case "OPEN":
            return 1;
        default:
            return 0;
    }
}

// ============================================================================
// CACHE METRICS
// ============================================================================

/** Total cache hits by agent name. */
export const cacheHitsTotal = new client.Counter({
    name: "hive_cache_hits_total",
    help: "Total semantic cache hits",
    labelNames: ["agent"] as const,
    registers: [register],
});

/** Total cache misses by agent name. */
export const cacheMissesTotal = new client.Counter({
    name: "hive_cache_misses_total",
    help: "Total semantic cache misses",
    labelNames: ["agent"] as const,
    registers: [register],
});

/** Cache operation latency in seconds. */
export const cacheLatency = new client.Histogram({
    name: "hive_cache_latency_seconds",
    help: "Semantic cache operation latency",
    labelNames: ["operation"] as const,
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [register],
});

/**
 * Record a cache hit.
 */
export function recordCacheHit(agent: string): void {
    cacheHitsTotal.inc({ agent });
}

/**
 * Record a cache miss.
 */
export function recordCacheMiss(agent: string): void {
    cacheMissesTotal.inc({ agent });
}

/**
 * Observe cache operation latency.
 */
export function observeCacheLatency(operation: string, durationSec: number): void {
    cacheLatency.observe({ operation }, durationSec);
}
