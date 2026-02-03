import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { AgentState } from "../lib/state.js";
import { HIVE_MEMBERS } from "../lib/prompts.js";
import { formatContributorContext } from "../lib/utils.js";
import { getPluginRouterContext, getPluginNames } from "../lib/plugins.js";

const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
});

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

import { logger } from "../lib/logger.js";
import { checkTurnLimit, isCircuitOpen, SAFETY_CONFIG } from "../lib/safety.js";

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

    try {
        const routeSchema = createRouteSchema();
        const chain = llm.withStructuredOutput(routeSchema);

        const response = await chain.invoke([
            new SystemMessage(enhancedPrompt),
            ...messages,
        ]);

        // ✅ Safety: Check if target agent's circuit is open
        if (response.next !== "FINISH" && isCircuitOpen(response.next)) {
            logger.warn(`Circuit open for ${response.next}, skipping`);
            // Try to find alternative or finish
            return { next: "FINISH" };
        }

        // ✅ Structured logging
        logger.routingDecision("Router", response.next, response.reasoning);

        return {
            next: response.next,
            turnCount: turnCount + 1,
        };
    } catch (error) {
        logger.error("Router failed", { error: (error as Error).message });
        return { next: "FINISH" };
    }
};

// Re-export for backward compatibility
export { HIVE_MEMBERS } from "../lib/prompts.js";
