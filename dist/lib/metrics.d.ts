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
export declare const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
/** Total HTTP requests by method, normalised path, and status code. */
export declare const httpRequestsTotal: client.Counter<"method" | "path" | "status">;
/** HTTP request duration in seconds (histogram with percentile buckets). */
export declare const httpRequestDuration: client.Histogram<"method" | "path" | "status">;
/** Total agent invocations by agent name. */
export declare const agentInvocationsTotal: client.Counter<"agent">;
/** Total tokens consumed, split by model, agent, and direction (input/output). */
export declare const tokenUsageTotal: client.Counter<"agent" | "model" | "direction">;
/** Cumulative LLM cost in USD by model and agent. */
export declare const llmCostTotal: client.Counter<"agent" | "model">;
/** Current daily spend in USD (gauge, reset daily by the budget alert service). */
export declare const dailyCostGauge: client.Gauge<string>;
/** Circuit breaker state per model: 0 = closed, 0.5 = half_open, 1 = open. */
export declare const circuitBreakerState: client.Gauge<"model">;
/**
 * Record an agent invocation.
 */
export declare function recordAgentInvocation(agent: string): void;
/**
 * Record token usage from an LLM call.
 */
export declare function recordTokenUsage(model: string, agent: string, tokensIn: number, tokensOut: number): void;
/**
 * Record LLM call cost and update the daily spend gauge.
 */
export declare function recordCost(model: string, agent: string, costUsd: number): void;
/**
 * Set the daily cost gauge to an absolute value (e.g. from database query).
 */
export declare function updateDailyCost(costUsd: number): void;
/**
 * Set circuit breaker state for a model.
 * @param stateValue 0 = closed, 0.5 = half_open, 1 = open
 */
export declare function setCircuitBreakerState(model: string, stateValue: number): void;
/**
 * Map CircuitState enum string to numeric gauge value.
 */
export declare function circuitStateToNumber(state: string): number;
/** Total cache hits by agent name. */
export declare const cacheHitsTotal: client.Counter<"agent">;
/** Total cache misses by agent name. */
export declare const cacheMissesTotal: client.Counter<"agent">;
/** Cache operation latency in seconds. */
export declare const cacheLatency: client.Histogram<"operation">;
/**
 * Record a cache hit.
 */
export declare function recordCacheHit(agent: string): void;
/**
 * Record a cache miss.
 */
export declare function recordCacheMiss(agent: string): void;
/**
 * Observe cache operation latency.
 */
export declare function observeCacheLatency(operation: string, durationSec: number): void;
/** Model routing decisions by agent, tier, and selected model. */
export declare const modelRoutingTotal: client.Counter<"agent" | "model" | "tier">;
/** Estimated cost savings from routing to cheaper models (USD). */
export declare const routingSavingsTotal: client.Counter<string>;
/** Auto-upgrade events when cheap models fail repeatedly. */
export declare const modelUpgradesTotal: client.Counter<"agent">;
/**
 * Record a model routing decision.
 */
export declare function recordModelRouting(agent: string, tier: string, model: string): void;
/**
 * Record estimated savings from routing to a cheaper model.
 */
export declare function recordRoutingSavings(savingsUsd: number): void;
/**
 * Record an auto-upgrade event.
 */
export declare function recordModelUpgrade(agent: string): void;
//# sourceMappingURL=metrics.d.ts.map