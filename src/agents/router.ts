import { createTrackedLLM } from "../middleware/cost-tracking.js";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { AgentState } from "../lib/state.js";
import { HIVE_MEMBERS } from "../lib/prompts.js";
import { formatContributorContext, extractUserQuery } from "../lib/utils.js";
import { getPluginRouterContext, getPluginNames } from "../lib/plugins.js";
import { logger } from "../lib/logger.js";
import { checkTurnLimit, isCircuitOpen, SAFETY_CONFIG } from "../lib/safety.js";

// ============================================================================
// LLM FACTORY — lazy to ensure testability & fresh mock per call
// ============================================================================

function getRouterLLM() {
    return createTrackedLLM("Router", {
        modelName: "gpt-4o",
        temperature: 0,
    });
}

// ============================================================================
// FALLBACK METRICS
// ============================================================================

export const routerFallbackMetrics = {
    level0: 0, // GPT-4o structured output (primary)
    level1: 0, // GPT-4o text parse
    level2: 0, // Claude 3.5 Sonnet
    level3: 0, // Rule-based (no LLM)
    total: 0,
};

// ============================================================================
// RULE-BASED ROUTER (Level 3 — no LLM)
// ============================================================================

interface RuleBasedResult {
    next: string;
    reasoning: string;
}

const KEYWORD_RULES: Array<{ keywords: string[]; agent: string; reasoning: string }> = [
    {
        keywords: ["security", "vulnerability", "threat", "audit", "cve", "owasp", "penetration", "exploit", "xss", "injection"],
        agent: "Security",
        reasoning: "Request involves security analysis (rule-based fallback)",
    },
    {
        keywords: ["deploy", "production", "ship", "release", "ci/cd", "pipeline", "infrastructure", "devops", "kubernetes", "docker"],
        agent: "SRE",
        reasoning: "Request involves deployment or operations (rule-based fallback)",
    },
    {
        keywords: ["design", "ui", "ux", "wireframe", "layout", "mockup", "prototype", "interface"],
        agent: "Designer",
        reasoning: "Request involves visual or interaction design (rule-based fallback)",
    },
    {
        keywords: ["test", "qa", "bug", "regression", "coverage", "e2e", "unit test", "integration test"],
        agent: "Tester",
        reasoning: "Request involves testing or quality assurance (rule-based fallback)",
    },
    {
        keywords: ["review", "pr", "merge", "approve", "code review", "pull request"],
        agent: "Reviewer",
        reasoning: "Request involves code review (rule-based fallback)",
    },
    {
        keywords: ["docs", "document", "readme", "api docs", "documentation", "guide", "tutorial"],
        agent: "TechWriter",
        reasoning: "Request involves documentation (rule-based fallback)",
    },
    {
        keywords: ["plan", "architect", "system design", "tech spec", "architecture", "technical plan"],
        agent: "Planner",
        reasoning: "Request involves technical planning (rule-based fallback)",
    },
    {
        keywords: ["accessibility", "wcag", "a11y", "screen reader", "aria"],
        agent: "Accessibility",
        reasoning: "Request involves accessibility (rule-based fallback)",
    },
    {
        keywords: ["research", "user research", "survey", "interview", "persona"],
        agent: "UXResearcher",
        reasoning: "Request involves user research (rule-based fallback)",
    },
    {
        keywords: ["metrics", "analytics", "data", "dashboard", "measure", "kpi"],
        agent: "DataAnalyst",
        reasoning: "Request involves data analysis (rule-based fallback)",
    },
    {
        keywords: ["build", "code", "implement", "create", "scaffold", "write code", "program", "develop", "function", "component"],
        agent: "Builder",
        reasoning: "Request involves code implementation (rule-based fallback)",
    },
];

/**
 * Rule-based routing using keyword matching.
 * Used as the final fallback when all LLM providers are unavailable.
 *
 * Uses word-boundary regex to avoid false positives (e.g., "build" containing "ui").
 *
 * @param query - The user's message text
 * @returns The matched agent and reasoning
 */
export function ruleBasedRoute(query: string): RuleBasedResult {
    const lowerQuery = query.toLowerCase();

    for (const rule of KEYWORD_RULES) {
        for (const keyword of rule.keywords) {
            // Use word boundary to avoid substring false positives
            const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (pattern.test(lowerQuery)) {
                return { next: rule.agent, reasoning: rule.reasoning };
            }
        }
    }

    // Default: ProductManager is the safest catch-all
    return {
        next: "ProductManager",
        reasoning: "No specific keyword match — routing to ProductManager as safe default (rule-based fallback)",
    };
}

// ============================================================================
// ROUTER PROMPT & SCHEMA
// ============================================================================

const ROUTER_PROMPT = `You are the Orchestrator for HIVE-R, a world-class team of AI specialists.

## Your Team
- **Founder**: Vision validation, strategic direction
- **ProductManager**: Requirements, PRDs, user stories
- **UXResearcher**: User validation, research design
- **Designer**: UX/UI design, interaction specs
- **Accessibility**: WCAG compliance, inclusive design
- **Planner**: Technical architecture, implementation plans
- **Security**: Threat modeling, security review
- **Builder**: Code implementation
- **Reviewer**: Code review, quality gates
- **Tester**: QA, test strategy, edge cases
- **TechWriter**: Documentation
- **SRE**: Deployment, operations, reliability
- **DataAnalyst**: Metrics, analytics, success measurement

## Your Job
Route tasks to the right specialist. Consider:
1. **Natural Workflow**: Strategy → Requirements → Research → Design → A11y → Planning → Security → Build → Review → Test → Docs → Deploy → Measure
2. **Skip When Appropriate**: Not every task needs every agent (e.g., a bug fix might skip to Builder → Reviewer → Tester)
3. **Go Back If Needed**: If Builder finds a spec issue, route back to Planner
4. **Don't Repeat**: Check which agents have already contributed and avoid routing back to them unless necessary

## Decision Criteria
- Look at who has already contributed (listed below)
- Determine what's the MOST valuable next step
- Route to FINISH when the user's original request is fully addressed

## Instructions
Analyze the conversation and decide:
- Which agent should act next?
- Why? (brief reasoning)

If the original request has been thoroughly addressed, respond with FINISH.`;

/**
 * Create route schema dynamically (includes plugins)
 */
function createRouteSchema() {
    const pluginNames = getPluginNames();
    const allAgents = [...HIVE_MEMBERS, ...pluginNames, "FINISH"] as const;

    return z.object({
        next: z.enum(allAgents as unknown as [string, ...string[]]),
        reasoning: z.string().describe("Why this agent was chosen (1-2 sentences)"),
    });
}

// ============================================================================
// FALLBACK CHAIN
// ============================================================================

/** Environment variable to force a specific fallback level (0-3). Debug only. */
const FORCE_FALLBACK_LEVEL = process.env.FORCE_FALLBACK_LEVEL
    ? parseInt(process.env.FORCE_FALLBACK_LEVEL, 10)
    : undefined;

/**
 * Level 0: GPT-4o with structured output (primary — current behavior).
 */
async function tryLevel0(
    enhancedPrompt: string,
    messages: any[],
    routeSchema: z.ZodObject<any>,
): Promise<{ next: string; reasoning: string }> {
    const llm = getRouterLLM();
    const chain = llm.withStructuredOutput(routeSchema);
    return await chain.invoke([
        new SystemMessage(enhancedPrompt),
        ...messages,
    ]) as { next: string; reasoning: string };
}

/**
 * Level 1: GPT-4o plain text invoke, then parse JSON from response.
 */
async function tryLevel1(
    enhancedPrompt: string,
    messages: any[],
): Promise<{ next: string; reasoning: string }> {
    const parsePrompt = enhancedPrompt + `\n\nRespond ONLY with JSON: {"next": "<AgentName>", "reasoning": "<why>"}`;

    const llm = getRouterLLM();
    const response = await llm.invoke([
        new SystemMessage(parsePrompt),
        ...messages,
    ]);

    const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*?"next"\s*:\s*"[^"]+[\s\S]*?\}/);
    if (!jsonMatch) {
        throw new Error("Level 1: Could not parse JSON from text response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.next || typeof parsed.next !== "string") {
        throw new Error("Level 1: Parsed JSON missing 'next' field");
    }

    return { next: parsed.next, reasoning: parsed.reasoning || "Parsed from text response" };
}

/**
 * Level 2: Claude 3.5 Sonnet with structured output.
 */
async function tryLevel2(
    enhancedPrompt: string,
    messages: any[],
    routeSchema: z.ZodObject<any>,
): Promise<{ next: string; reasoning: string }> {
    const claudeLLM = createTrackedLLM("Router-Fallback", {
        modelName: "claude-3-5-sonnet",
        temperature: 0,
    });

    const chain = claudeLLM.withStructuredOutput(routeSchema);
    return await chain.invoke([
        new SystemMessage(enhancedPrompt),
        ...messages,
    ]) as { next: string; reasoning: string };
}

/**
 * Level 3: Rule-based keyword matching (no LLM).
 */
function tryLevel3(messages: any[]): { next: string; reasoning: string } {
    const query = extractUserQuery(messages);
    return ruleBasedRoute(query);
}

// ============================================================================
// ROUTER NODE
// ============================================================================

export const routerNode = async (state: typeof AgentState.State) => {
    const messages = state.messages;
    const contributors = state.contributors || [];
    const turnCount = state.turnCount ?? 0;

    // ✅ Safety: Check turn limit
    const turnCheck = checkTurnLimit(turnCount);
    if (!turnCheck.safe) {
        logger.safetyTrigger("MAX_TURNS exceeded", { turnCount });
        return { next: "FINISH" };
    }

    // ✅ Inject contributor context and plugin context into router
    const contributorContext = formatContributorContext(contributors);
    const pluginContext = getPluginRouterContext();
    const enhancedPrompt = ROUTER_PROMPT + contributorContext + pluginContext;

    const routeSchema = createRouteSchema();

    // Determine starting level
    const startLevel = FORCE_FALLBACK_LEVEL ?? 0;

    let response: { next: string; reasoning: string } | undefined;
    let usedLevel = startLevel;

    // ---- Level 0: GPT-4o Structured Output ----
    if (startLevel <= 0) {
        try {
            response = await tryLevel0(enhancedPrompt, messages, routeSchema);
            usedLevel = 0;
        } catch (error) {
            logger.warn("🔄 Router Level 0 failed (GPT-4o structured), trying Level 1", {
                error: (error as Error).message,
            } as any);
        }
    }

    // ---- Level 1: GPT-4o Text Parse ----
    if (!response && startLevel <= 1) {
        try {
            response = await tryLevel1(enhancedPrompt, messages);
            usedLevel = 1;
        } catch (error) {
            logger.warn("🔄 Router Level 1 failed (GPT-4o text), trying Level 2", {
                error: (error as Error).message,
            } as any);
        }
    }

    // ---- Level 2: Claude 3.5 Sonnet ----
    if (!response && startLevel <= 2) {
        try {
            response = await tryLevel2(enhancedPrompt, messages, routeSchema);
            usedLevel = 2;
        } catch (error) {
            logger.warn("🔄 Router Level 2 failed (Claude), falling back to rule-based", {
                error: (error as Error).message,
            } as any);
        }
    }

    // ---- Level 3: Rule-based (always succeeds) ----
    if (!response) {
        response = tryLevel3(messages);
        usedLevel = 3;
    }

    // ✅ Track metrics
    routerFallbackMetrics.total++;
    switch (usedLevel) {
        case 0: routerFallbackMetrics.level0++; break;
        case 1: routerFallbackMetrics.level1++; break;
        case 2: routerFallbackMetrics.level2++; break;
        case 3: routerFallbackMetrics.level3++; break;
    }

    // ✅ Log which fallback was used
    if (usedLevel > 0) {
        const levelNames = ["GPT-4o structured", "GPT-4o text", "Claude 3.5", "rule-based"];
        logger.warn(`⚡ Router fallback level ${usedLevel} (${levelNames[usedLevel]}) used`, {
            fallbackLevel: usedLevel,
            target: response.next,
        } as any);
    }

    // ✅ Safety: Check if target agent's circuit is open
    if (response.next !== "FINISH" && isCircuitOpen(response.next)) {
        logger.warn(`Circuit open for ${response.next}, skipping`);
        return { next: "FINISH" };
    }

    // ✅ Structured logging
    logger.routingDecision("Router", response.next, response.reasoning);

    return {
        next: response.next,
        turnCount: turnCount + 1,
    };
};

// Re-export for backward compatibility
export { HIVE_MEMBERS } from "../lib/prompts.js";
