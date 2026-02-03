import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import type { Artifact } from "./artifacts.js";

/**
 * Enhanced Agent State with:
 * - Message history
 * - Routing decisions
 * - Typed artifacts
 * - Agent contribution tracking
 */
export const AgentState = Annotation.Root({
    // Conversation messages
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    // Next agent to route to
    next: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "Router",
    }),

    // Track which agents have contributed
    contributors: Annotation<string[]>({
        reducer: (x, y) => [...new Set([...x, ...y])],
        default: () => [],
    }),

    // Typed artifacts produced by agents
    artifacts: Annotation<Artifact[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    // Current phase of the workflow
    phase: Annotation<"strategy" | "design" | "build" | "ship">({
        reducer: (x, y) => y ?? x,
        default: () => "strategy",
    }),

    // Human-in-the-loop: should we pause for approval?
    requiresApproval: Annotation<boolean>({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),

    // Approval status (if paused)
    approvalStatus: Annotation<"pending" | "approved" | "rejected" | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
});

export type AgentStateType = typeof AgentState.State;
