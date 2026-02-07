/**
 * Intelligent Model Router
 *
 * Estimates query complexity and selects the cheapest model that can handle it.
 * Uses zero-cost keyword heuristics (no embeddings or ML calls).
 *
 * Usage:
 *   import { selectModelForQuery } from "./model-router.js";
 *   const { model, tier } = selectModelForQuery("Security", "what is XSS?");
 *   // → { model: "gpt-4o-mini", tier: "SIMPLE" }
 */

import { logger } from "./logger.js";
import {
    recordModelRouting,
    recordRoutingSavings,
    recordModelUpgrade,
} from "./metrics.js";
import { MODEL_PRICING_PER_1K } from "../middleware/cost-tracking.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComplexityTier = "SIMPLE" | "MEDIUM" | "COMPLEX";

export interface RoutingDecision {
    model: string;
    tier: ComplexityTier;
    reason: string;
    pinned: boolean;         // true if agent is always pinned to a model
    estimatedSavings: number; // USD saved vs always using gpt-4o
}

// ---------------------------------------------------------------------------
// Model tiers
// ---------------------------------------------------------------------------

const TIER_MODELS: Record<ComplexityTier, string> = {
    SIMPLE: "gpt-4o-mini",
    MEDIUM: "gpt-4o",
    COMPLEX: "gpt-4o",
};

const EXPENSIVE_MODEL = "gpt-4o";

// ---------------------------------------------------------------------------
// Agent pinning — these agents ALWAYS use a specific tier
// ---------------------------------------------------------------------------

const PINNED_AGENTS: Record<string, { model: string; reason: string }> = {
    Security: { model: "gpt-4o", reason: "security reviews require strongest reasoning" },
    Builder: { model: "gpt-4o", reason: "tool-calling loops require strong model" },
    Planner: { model: "gpt-4o", reason: "structured output needs capable model" },
    Tester: { model: "gpt-4o", reason: "test generation requires strong reasoning" },
    Router: { model: "gpt-4o-mini", reason: "fast classification task" },
    "Router-Fallback": { model: "gpt-4o", reason: "router fallback needs strong model" },
};

// ---------------------------------------------------------------------------
// Complexity heuristics (zero-cost, keyword-based)
// ---------------------------------------------------------------------------

const SIMPLE_PATTERNS = [
    /\b(what is|what are|explain|describe|define|tell me about|list|how does|who is|when was)\b/i,
    /\b(summarize|overview|brief|quick|simple|basic)\b/i,
    /^.{0,200}$/,  // Very short queries are usually simple
];

const COMPLEX_PATTERNS = [
    /\b(build|implement|create|develop|refactor|rewrite|migrate|architect)\b/i,
    /\b(full system|end-to-end|production|deploy|scale|enterprise)\b/i,
    /\b(authentication|authorization|security audit|penetration|vulnerability)\b/i,
    /```[\s\S]{50,}/,  // Contains code blocks >50 chars
    /\b(step by step|detailed plan|comprehensive|complete solution)\b/i,
];

const MEDIUM_PATTERNS = [
    /\b(review|analyze|compare|evaluate|assess|audit|check|inspect)\b/i,
    /\b(improve|optimize|enhance|fix|debug|troubleshoot)\b/i,
    /\b(design|prototype|wireframe|mockup|sketch)\b/i,
];

/**
 * Estimate the complexity tier of a user query.
 * Pure heuristic — zero API calls.
 */
export function estimateComplexity(query: string): { tier: ComplexityTier; reason: string } {
    // Length-based fast paths
    if (query.length > 1000) {
        return { tier: "COMPLEX", reason: "long query (>1000 chars)" };
    }

    // Check COMPLEX patterns first (they override SIMPLE)
    for (const pattern of COMPLEX_PATTERNS) {
        if (pattern.test(query)) {
            return { tier: "COMPLEX", reason: `matches complex pattern: ${pattern.source.slice(0, 40)}` };
        }
    }

    // Check MEDIUM patterns
    for (const pattern of MEDIUM_PATTERNS) {
        if (pattern.test(query)) {
            return { tier: "MEDIUM", reason: `matches medium pattern: ${pattern.source.slice(0, 40)}` };
        }
    }

    // Check SIMPLE patterns
    for (const pattern of SIMPLE_PATTERNS) {
        if (pattern.test(query)) {
            return { tier: "SIMPLE", reason: `matches simple pattern: ${pattern.source.slice(0, 40)}` };
        }
    }

    // Default to MEDIUM for unclassified queries
    return { tier: "MEDIUM", reason: "default (no pattern matched)" };
}

// ---------------------------------------------------------------------------
// Auto-upgrade tracker
// ---------------------------------------------------------------------------

interface UpgradeState {
    failures: number;
    upgradedUntil: number; // timestamp, 0 = not upgraded
}

const upgradeTracker = new Map<string, UpgradeState>();

const MAX_FAILURES_BEFORE_UPGRADE = 3;
const UPGRADE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Record a failure for an agent at a given tier.
 * After MAX_FAILURES_BEFORE_UPGRADE consecutive failures, auto-upgrade for 1 hour.
 */
export function recordRoutingFailure(agentName: string, tier: ComplexityTier): void {
    if (tier === "COMPLEX") return; // Already at highest tier

    const key = `${agentName}:${tier}`;
    const state = upgradeTracker.get(key) ?? { failures: 0, upgradedUntil: 0 };
    state.failures++;

    if (state.failures >= MAX_FAILURES_BEFORE_UPGRADE) {
        state.upgradedUntil = Date.now() + UPGRADE_DURATION_MS;
        state.failures = 0;
        logger.warn(
            { agentName, tier, upgradeUntil: new Date(state.upgradedUntil).toISOString() },
            `Auto-upgrading ${agentName} from ${tier} for 1h after ${MAX_FAILURES_BEFORE_UPGRADE} failures`,
        );
        recordModelUpgrade(agentName);
    }

    upgradeTracker.set(key, state);
}

/**
 * Record a success — reset the failure counter.
 */
export function recordRoutingSuccess(agentName: string, tier: ComplexityTier): void {
    const key = `${agentName}:${tier}`;
    const state = upgradeTracker.get(key);
    if (state) {
        state.failures = 0;
    }
}

/**
 * Check if an agent has been auto-upgraded from a given tier.
 */
function isAutoUpgraded(agentName: string, tier: ComplexityTier): boolean {
    const key = `${agentName}:${tier}`;
    const state = upgradeTracker.get(key);
    if (!state) return false;
    if (state.upgradedUntil > Date.now()) return true;
    // Expired — reset
    state.upgradedUntil = 0;
    return false;
}

// ---------------------------------------------------------------------------
// Model selection
// ---------------------------------------------------------------------------

/**
 * Select the optimal model for an agent + query combination.
 *
 * @param agentName - The HIVE agent name
 * @param query - The user's raw query text
 * @returns Routing decision with model, tier, reason, and estimated savings
 */
export function selectModelForQuery(agentName: string, query: string): RoutingDecision {
    // 1. Check agent pinning
    const pinned = PINNED_AGENTS[agentName];
    if (pinned) {
        return {
            model: pinned.model,
            tier: "COMPLEX",
            reason: pinned.reason,
            pinned: true,
            estimatedSavings: 0,
        };
    }

    // 2. Estimate complexity
    const { tier, reason } = estimateComplexity(query);

    // 3. Check auto-upgrade
    let effectiveTier = tier;
    if (tier === "SIMPLE" && isAutoUpgraded(agentName, "SIMPLE")) {
        effectiveTier = "MEDIUM";
    } else if (tier === "MEDIUM" && isAutoUpgraded(agentName, "MEDIUM")) {
        effectiveTier = "COMPLEX";
    }

    const selectedModel = TIER_MODELS[effectiveTier];

    // 4. Calculate estimated savings
    const expensivePricing = MODEL_PRICING_PER_1K[EXPENSIVE_MODEL] ?? { input: 0.005, output: 0.015 };
    const selectedPricing = MODEL_PRICING_PER_1K[selectedModel] ?? expensivePricing;

    // Rough estimate: assume 500 input tokens + 300 output tokens average
    const avgTokensIn = 500;
    const avgTokensOut = 300;
    const expensiveCost = (avgTokensIn / 1000) * expensivePricing.input + (avgTokensOut / 1000) * expensivePricing.output;
    const selectedCost = (avgTokensIn / 1000) * selectedPricing.input + (avgTokensOut / 1000) * selectedPricing.output;
    const savings = Math.max(0, expensiveCost - selectedCost);

    // 5. Record metrics
    recordModelRouting(agentName, effectiveTier, selectedModel);
    if (savings > 0) {
        recordRoutingSavings(savings);
    }

    const decision: RoutingDecision = {
        model: selectedModel,
        tier: effectiveTier,
        reason: effectiveTier !== tier
            ? `auto-upgraded from ${tier}: ${reason}`
            : reason,
        pinned: false,
        estimatedSavings: savings,
    };

    logger.info(
        {
            agentName,
            model: decision.model,
            tier: decision.tier,
            pinned: false,
            reason: decision.reason,
        },
        `Model selected: ${decision.model} for ${agentName}`,
    );

    return decision;
}
