import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import type { Artifact } from "./artifacts.js";

/**
 * Enhanced Agent State with:
 * - Message history
 * - Routing decisions
 * - Typed artifacts
 * - Agent contribution tracking
 * - Turn counting & retry logic
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

    // ✅ NEW: Turn counter (prevents infinite loops)
    turnCount: Annotation<number>({
        reducer: (x, y) => y ?? x + 1,
        default: () => 0,
    }),

    // ✅ NEW: Per-agent retry counts
    agentRetries: Annotation<Record<string, number>>({
        reducer: (x, y) => ({ ...x, ...y }),
        default: () => ({}),
    }),

    // ✅ NEW: Flag indicating current agent needs to retry
    needsRetry: Annotation<boolean>({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),

    // ✅ NEW: Last error message for retry context
    lastError: Annotation<string | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
});

export type AgentStateType = typeof AgentState.State;
