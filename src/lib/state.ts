import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import type { Artifact } from "./artifacts.js";
import type { ArtifactStore } from "./artifact-store.js";
import { createArtifactStore } from "./artifact-store.js";

/**
 * Enhanced Agent State with:
 * - Message history
 * - Routing decisions
 * - Typed artifacts
 * - Agent contribution tracking
 * - Turn counting & retry logic
 * - Shared Artifact Store (Phase 2)
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

    // Typed artifacts produced by agents (legacy array)
    artifacts: Annotation<Artifact[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    // ✅ NEW: Shared Artifact Store (typed access by artifact type)
    artifactStore: Annotation<ArtifactStore>({
        reducer: (x, y) => ({ ...x, ...y }),
        default: () => createArtifactStore(),
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

    // Turn counter (prevents infinite loops)
    turnCount: Annotation<number>({
        reducer: (x, y) => y ?? x + 1,
        default: () => 0,
    }),

    // Per-agent retry counts
    agentRetries: Annotation<Record<string, number>>({
        reducer: (x, y) => ({ ...x, ...y }),
        default: () => ({}),
    }),

    // Flag indicating current agent needs to retry
    needsRetry: Annotation<boolean>({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),

    // Last error message for retry context
    lastError: Annotation<string | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
});

export type AgentStateType = typeof AgentState.State;

