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

    // ✅ NEW: Hierarchical Teams Support
    // Active sub-tasks delegated by supervisor
    subTasks: Annotation<SubTask[]>({
        reducer: (x, y) => {
            // Merge sub-tasks, update existing ones by ID
            const merged = [...x];
            for (const task of y) {
                const existing = merged.findIndex(t => t.id === task.id);
                if (existing >= 0) {
                    merged[existing] = task;
                } else {
                    merged.push(task);
                }
            }
            return merged;
        },
        default: () => [],
    }),

    // Results aggregated from parallel workers
    aggregatedResults: Annotation<string[]>({
        reducer: (x, y) => [...x, ...y],
        default: () => [],
    }),

    // Is the current agent acting as a supervisor?
    supervisorMode: Annotation<boolean>({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),

    // Parent task ID (for sub-task context)
    parentTaskId: Annotation<string | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
});

// Import SubTask type
import type { SubTask } from "../tools/delegate.js";

export type AgentStateType = typeof AgentState.State;

