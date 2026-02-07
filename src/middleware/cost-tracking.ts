/**
 * LLM Cost Tracking Middleware
 *
 * LangChain callback handler that automatically captures token usage
 * from every LLM call, calculates cost, and logs it to the database.
 *
 * Includes daily budget enforcement — throws BudgetExceededError if
 * the DAILY_BUDGET limit is exceeded.
 *
 * Usage:
 *   import { createTrackedLLM } from "../middleware/cost-tracking.js";
 *
 *   const llm = createTrackedLLM("Builder", { modelName: "gpt-4o", temperature: 0.2 });
 *   // Use llm as usual — token tracking is automatic
 */

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { ChatOpenAI } from "@langchain/openai";
import type { LLMResult } from "@langchain/core/outputs";
import { logUsage, getDailyCost } from "../lib/cost-tracker.js";
import { logger } from "../lib/logger.js";
import { circuitBreakerRegistry, CircuitOpenError } from "../lib/circuit-breaker.js";
import { withRetry } from "../lib/retry.js";
import { recordTokenUsage, recordCost } from "../lib/metrics.js";
import { getActiveSpan } from "../lib/tracer.js";

// ============================================================================
// MODEL PRICING (per 1K tokens, USD) — user-specified rates
// ============================================================================

export const MODEL_PRICING_PER_1K: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 0.005, output: 0.015 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "claude-3-5-sonnet": { input: 0.003, output: 0.015 },
    "claude-3-haiku": { input: 0.00025, output: 0.00125 },
    "gpt-4-turbo": { input: 0.01, output: 0.03 },
    "gpt-4": { input: 0.03, output: 0.06 },
    "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
};

const DEFAULT_PRICING = { input: 0.005, output: 0.015 };

/** Daily budget in USD. Set via DAILY_BUDGET env var. */
export const DAILY_BUDGET = parseFloat(process.env.DAILY_BUDGET || "50");

// ============================================================================
// BUDGET ERROR
// ============================================================================

export class BudgetExceededError extends Error {
    public dailyCost: number;
    public budget: number;

    constructor(dailyCost: number, budget: number) {
        super(`Daily budget exceeded: $${dailyCost.toFixed(4)} / $${budget.toFixed(2)} limit`);
        this.name = "BudgetExceededError";
        this.dailyCost = dailyCost;
        this.budget = budget;
    }
}

// ============================================================================
// COST CALCULATION
// ============================================================================

/**
 * Calculate cost in USD from token counts using per-1K pricing.
 */
export function calculateCostPer1K(
    model: string,
    tokensIn: number,
    tokensOut: number
): number {
    const pricing = MODEL_PRICING_PER_1K[model] || DEFAULT_PRICING;
    const cost = (tokensIn / 1000) * pricing.input + (tokensOut / 1000) * pricing.output;
    return Math.round(cost * 1_000_000) / 1_000_000; // 6 decimal places
}

// ============================================================================
// BUDGET CHECK
// ============================================================================

/**
 * Check if the daily budget has been exceeded.
 * Returns the current daily cost and whether budget is exceeded.
 */
export function checkBudget(): { exceeded: boolean; dailyCost: number; budget: number } {
    try {
        const daily = getDailyCost();
        return {
            exceeded: daily.totalCost >= DAILY_BUDGET,
            dailyCost: daily.totalCost,
            budget: DAILY_BUDGET,
        };
    } catch (err) {
        // Graceful failure — don't block requests if budget check fails
        logger.error({ err }, 'Budget check failed');
        return { exceeded: false, dailyCost: 0, budget: DAILY_BUDGET };
    }
}

// ============================================================================
// LANGCHAIN CALLBACK HANDLER
// ============================================================================

/**
 * LangChain callback handler that captures token usage from every LLM call
 * and logs it to the cost tracking database.
 */
export class CostTrackingCallback extends BaseCallbackHandler {
    name = "CostTrackingCallback";

    private agentName: string;
    private modelName: string;
    private startTime: number = 0;
    private threadId?: string;
    private userId?: string;

    constructor(agentName: string, modelName: string, opts?: { threadId?: string; userId?: string }) {
        super();
        this.agentName = agentName;
        this.modelName = modelName;
        this.threadId = opts?.threadId;
        this.userId = opts?.userId;
    }

    /**
     * Called at the start of an LLM run — capture start time for latency.
     */
    async handleLLMStart(): Promise<void> {
        this.startTime = Date.now();
    }

    /**
     * Called at the end of an LLM run — extract tokens and log usage.
     */
    async handleLLMEnd(output: LLMResult): Promise<void> {
        const latencyMs = Date.now() - this.startTime;

        try {
            // Extract token usage from LangChain response
            const tokenUsage = output.llmOutput?.tokenUsage || output.llmOutput?.estimatedTokenUsage;

            if (!tokenUsage) {
                logger.warn({ agent: this.agentName, model: this.modelName }, 'Cost tracking: no token usage in LLM response');
                return;
            }

            const tokensIn = tokenUsage.promptTokens || tokenUsage.totalTokens || 0;
            const tokensOut = tokenUsage.completionTokens || 0;

            // Log usage to database
            logUsage({
                agentName: this.agentName,
                model: this.modelName,
                tokensIn,
                tokensOut,
                latencyMs,
                threadId: this.threadId,
                userId: this.userId,
            });

            logger.info({
                agent: this.agentName,
                model: this.modelName,
                tokensIn,
                tokensOut,
                cost: `$${calculateCostPer1K(this.modelName, tokensIn, tokensOut).toFixed(6)}`,
                latencyMs,
            }, 'LLM call tracked');

            // Record success for circuit breaker
            circuitBreakerRegistry.get(this.modelName).recordSuccess();

            // Record Prometheus metrics
            const costUsd = calculateCostPer1K(this.modelName, tokensIn, tokensOut);
            recordTokenUsage(this.modelName, this.agentName, tokensIn, tokensOut);
            recordCost(this.modelName, this.agentName, costUsd);

            // Enrich active OTel span with LLM attributes
            const span = getActiveSpan();
            if (span) {
                span.setAttribute("agent.model", this.modelName);
                span.setAttribute("agent.tokens_in", tokensIn);
                span.setAttribute("agent.tokens_out", tokensOut);
                span.setAttribute("agent.cost", costUsd);
            }
        } catch (err) {
            // Graceful failure — log error but don't break the request
            logger.error({ agent: this.agentName, err }, 'Cost tracking failed');
        }
    }

    /**
     * Called on LLM error — log it but don't interfere.
     */
    async handleLLMError(err: Error): Promise<void> {
        logger.warn({ agent: this.agentName, err: err.message }, 'LLM error occurred');

        // Record failure for circuit breaker
        circuitBreakerRegistry.get(this.modelName).recordFailure();
    }
}

// ============================================================================
// FACTORY: CREATE TRACKED LLM
// ============================================================================

interface TrackedLLMOptions {
    modelName?: string;
    temperature?: number;
    threadId?: string;
    userId?: string;
    /** Set to true to enable intelligent model routing for this agent. */
    enableRouting?: boolean;
    [key: string]: unknown;
}

/**
 * Create a ChatOpenAI instance with cost tracking and optional model routing.
 *
 * When `enableRouting` is true, the LLM is wrapped in a proxy that:
 * 1. At invoke() time, extracts the user query from messages
 * 2. Estimates query complexity using keyword heuristics
 * 3. Selects the cheapest model that can handle the task
 * 4. Creates the actual ChatOpenAI with the selected model
 *
 * When `enableRouting` is false (default), uses the hardcoded modelName as before.
 *
 * @param agentName - The HIVE agent name (e.g., "Builder", "Security")
 * @param opts - ChatOpenAI options + optional threadId/userId + enableRouting
 */
export function createTrackedLLM(agentName: string, opts: TrackedLLMOptions = {}): ChatOpenAI {
    const defaultModelName = opts.modelName || "gpt-4o";
    const { threadId, userId, enableRouting, ...llmOpts } = opts;

    // If routing is not enabled, use the original static behavior
    if (!enableRouting) {
        return createStaticLLM(agentName, defaultModelName, llmOpts, { threadId, userId });
    }

    // Routing enabled: create a lazy proxy that selects model at invoke() time
    return createRoutedLLM(agentName, defaultModelName, llmOpts, { threadId, userId });
}

/**
 * Original static LLM factory (no routing).
 */
function createStaticLLM(
    agentName: string,
    modelName: string,
    llmOpts: Record<string, unknown>,
    context: { threadId?: string; userId?: string },
): ChatOpenAI {
    // Circuit breaker check
    const cb = circuitBreakerRegistry.get(modelName);
    if (!cb.canExecute()) {
        throw new CircuitOpenError(modelName, cb.remainingTimeoutMs);
    }

    // Budget check
    const budget = checkBudget();
    if (budget.exceeded) {
        throw new BudgetExceededError(budget.dailyCost, budget.budget);
    }

    const callback = new CostTrackingCallback(agentName, modelName, context);
    const baseLLM = new ChatOpenAI({
        ...llmOpts,
        modelName,
        callbacks: [callback],
    });

    return wrapWithRetry(baseLLM, agentName);
}

/**
 * Routing-aware LLM factory.
 * Returns a proxy that dynamically selects the model based on query complexity.
 */
function createRoutedLLM(
    agentName: string,
    fallbackModelName: string,
    llmOpts: Record<string, unknown>,
    context: { threadId?: string; userId?: string },
): ChatOpenAI {
    // Import model router lazily to avoid circular deps at module init
    let selectModelForQuery: typeof import("../lib/model-router.js").selectModelForQuery;
    let recordRoutingSuccess: typeof import("../lib/model-router.js").recordRoutingSuccess;
    let recordRoutingFailure: typeof import("../lib/model-router.js").recordRoutingFailure;

    const loadRouter = async () => {
        if (!selectModelForQuery) {
            const mod = await import("../lib/model-router.js");
            selectModelForQuery = mod.selectModelForQuery;
            recordRoutingSuccess = mod.recordRoutingSuccess;
            recordRoutingFailure = mod.recordRoutingFailure;
        }
    };

    // Create a placeholder LLM with the fallback model (needed for proxy target)
    const placeholderLLM = new ChatOpenAI({
        ...llmOpts,
        modelName: fallbackModelName,
    });

    return new Proxy(placeholderLLM, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            // Intercept .invoke() to route dynamically
            if (prop === "invoke" && typeof value === "function") {
                return async (...args: any[]) => {
                    await loadRouter();

                    // Extract query text from messages
                    const messages = args[0] as any[];
                    const query = extractQueryFromMessages(messages);

                    // Route to optimal model
                    const decision = selectModelForQuery(agentName, query);

                    // Budget + circuit breaker checks for selected model
                    const budget = checkBudget();
                    if (budget.exceeded) {
                        throw new BudgetExceededError(budget.dailyCost, budget.budget);
                    }
                    const cb = circuitBreakerRegistry.get(decision.model);
                    if (!cb.canExecute()) {
                        throw new CircuitOpenError(decision.model, cb.remainingTimeoutMs);
                    }

                    // Create LLM with routed model
                    const callback = new CostTrackingCallback(agentName, decision.model, context);
                    const routedLLM = new ChatOpenAI({
                        ...llmOpts,
                        modelName: decision.model,
                        callbacks: [callback],
                    });

                    try {
                        const result = await withRetry(
                            () => routedLLM.invoke(args[0] as any, args[1] as any),
                            { label: agentName },
                        );
                        recordRoutingSuccess(agentName, decision.tier);
                        return result;
                    } catch (err) {
                        recordRoutingFailure(agentName, decision.tier);
                        throw err;
                    }
                };
            }

            // For .withStructuredOutput() and .bindTools(), delegate to the fallback model
            // (these are complex chains and not easily routed at invoke-time)
            if (prop === "withStructuredOutput" && typeof value === "function") {
                return (...args: any[]) => {
                    const callback = new CostTrackingCallback(agentName, fallbackModelName, context);
                    const staticLLM = new ChatOpenAI({
                        ...llmOpts,
                        modelName: fallbackModelName,
                        callbacks: [callback],
                    });
                    return wrapWithRetry(staticLLM, agentName).withStructuredOutput(args[0] as any, args[1] as any);
                };
            }

            if (prop === "bindTools" && typeof value === "function") {
                return (...args: any[]) => {
                    const callback = new CostTrackingCallback(agentName, fallbackModelName, context);
                    const staticLLM = new ChatOpenAI({
                        ...llmOpts,
                        modelName: fallbackModelName,
                        callbacks: [callback],
                    });
                    return wrapWithRetry(staticLLM, agentName).bindTools(args[0] as any, args[1] as any);
                };
            }

            return value;
        },
    }) as ChatOpenAI;
}

/**
 * Extract the user query text from LangChain messages for routing.
 */
function extractQueryFromMessages(messages: any[]): string {
    // Find the last HumanMessage without a name (the user's actual query)
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg && typeof msg === "object") {
            // Check for SystemMessage — skip those
            const type = msg._getType?.() ?? msg.constructor?.name;
            if (type === "system" || type === "SystemMessage") continue;

            // Check for HumanMessage from actual user (not agent outputs)
            if (type === "human" || type === "HumanMessage") {
                const name = msg.name ?? msg.additional_kwargs?.name;
                if (!name) {
                    return typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
                }
            }
        }
    }

    // Fallback: use last message content
    const last = messages[messages.length - 1];
    return typeof last?.content === "string" ? last.content : "";
}

// ============================================================================
// RETRY PROXY
// ============================================================================

/**
 * Wrap a ChatOpenAI instance so that `invoke()` and `withStructuredOutput().invoke()`
 * calls automatically retry on transient errors.
 *
 * Retries happen BEFORE the circuit breaker sees failures — only the final
 * failure (after exhausting retries) triggers `recordFailure` via the callback.
 */
function wrapWithRetry(llm: ChatOpenAI, agentName: string): ChatOpenAI {
    const retryOpts = { label: agentName };

    return new Proxy(llm, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            // Wrap .invoke() with retry
            if (prop === "invoke" && typeof value === "function") {
                return (...args: any[]) =>
                    withRetry(() => value.apply(target, args), retryOpts);
            }

            // Wrap .withStructuredOutput() to return a proxy whose .invoke() retries
            if (prop === "withStructuredOutput" && typeof value === "function") {
                return (...args: any[]) => {
                    const structured = value.apply(target, args);
                    return new Proxy(structured, {
                        get(sTarget, sProp, sReceiver) {
                            const sValue = Reflect.get(sTarget, sProp, sReceiver);
                            if (sProp === "invoke" && typeof sValue === "function") {
                                return (...invokeArgs: any[]) =>
                                    withRetry(() => sValue.apply(sTarget, invokeArgs), retryOpts);
                            }
                            return sValue;
                        },
                    });
                };
            }

            // Wrap .bindTools() to return a retry-wrapped proxy for its .invoke()
            if (prop === "bindTools" && typeof value === "function") {
                return (...args: any[]) => {
                    const bound = value.apply(target, args);
                    return new Proxy(bound, {
                        get(bTarget, bProp, bReceiver) {
                            const bValue = Reflect.get(bTarget, bProp, bReceiver);
                            if (bProp === "invoke" && typeof bValue === "function") {
                                return (...invokeArgs: any[]) =>
                                    withRetry(() => bValue.apply(bTarget, invokeArgs), retryOpts);
                            }
                            return bValue;
                        },
                    });
                };
            }

            return value;
        },
    }) as ChatOpenAI;
}
