/**
 * Agent Handoff Tool
 * 
 * Allows agents to directly transfer control to another agent,
 * bypassing the Router when the next step is obvious.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

// ============================================================================
// HIVE MEMBERS (must match router.ts)
// ============================================================================

export const HIVE_AGENTS = [
    "Founder",
    "ProductManager",
    "UXResearcher",
    "Designer",
    "Accessibility",
    "Planner",
    "Security",
    "Builder",
    "Reviewer",
    "Tester",
    "TechWriter",
    "SRE",
    "DataAnalyst",
] as const;

export type HiveAgent = typeof HIVE_AGENTS[number];

// ============================================================================
// HANDOFF TOOL
// ============================================================================

/**
 * Tool for agents to directly hand off control to another agent.
 * 
 * Usage in agent:
 * - Designer finishes spec → handoff to Builder
 * - PM finishes PRD → handoff to Designer
 * - Tester finds bug → handoff to Builder
 */
export const handoffTool = tool(
    async ({ targetAgent, reason, context }) => {
        // This tool's return value isn't used directly.
        // The state update happens in the agent node wrapper.
        return JSON.stringify({
            handoff: true,
            targetAgent,
            reason,
            context: context || null,
        });
    },
    {
        name: "handoff_to_agent",
        description: `Transfer control directly to another specialist agent. Use this when you know exactly who should handle the next step. Available agents: ${HIVE_AGENTS.join(", ")}`,
        schema: z.object({
            targetAgent: z.enum(HIVE_AGENTS).describe("The agent to hand off to"),
            reason: z.string().describe("Brief explanation of why this agent should take over"),
            context: z.string().optional().describe("Optional additional context for the target agent"),
        }),
    }
);

// ============================================================================
// HANDOFF DETECTION
// ============================================================================

interface HandoffResult {
    isHandoff: boolean;
    targetAgent?: HiveAgent;
    reason?: string;
    context?: string;
}

/**
 * Parse tool call results to detect if a handoff was requested
 */
export function detectHandoff(toolResults: string[]): HandoffResult {
    for (const result of toolResults) {
        try {
            const parsed = JSON.parse(result);
            if (parsed.handoff && parsed.targetAgent) {
                return {
                    isHandoff: true,
                    targetAgent: parsed.targetAgent,
                    reason: parsed.reason,
                    context: parsed.context,
                };
            }
        } catch {
            // Not JSON or not a handoff, continue
        }
    }
    return { isHandoff: false };
}

/**
 * Common handoff patterns for reference
 */
export const COMMON_HANDOFFS: Record<HiveAgent, HiveAgent[]> = {
    Founder: ["ProductManager"],
    ProductManager: ["Designer", "UXResearcher"],
    UXResearcher: ["ProductManager", "Designer"],
    Designer: ["Builder", "Accessibility"],
    Accessibility: ["Builder"],
    Planner: ["Builder", "Security"],
    Security: ["Builder"],
    Builder: ["Tester", "Reviewer"],
    Reviewer: ["Builder", "Tester"],
    Tester: ["Builder"],
    TechWriter: ["SRE"],
    SRE: ["DataAnalyst"],
    DataAnalyst: [],
};
