import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
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
    messages: Annotation({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    // Next agent to route to
    next: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => "Router",
    }),
    // Track which agents have contributed
    contributors: Annotation({
        reducer: (x, y) => [...new Set([...x, ...y])],
        default: () => [],
    }),
    // Typed artifacts produced by agents (legacy array)
    artifacts: Annotation({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    // ✅ NEW: Shared Artifact Store (typed access by artifact type)
    artifactStore: Annotation({
        reducer: (x, y) => ({ ...x, ...y }),
        default: () => createArtifactStore(),
    }),
    // Current phase of the workflow
    phase: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => "strategy",
    }),
    // Human-in-the-loop: should we pause for approval?
    requiresApproval: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),
    // Approval status (if paused)
    approvalStatus: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    // Turn counter (prevents infinite loops)
    turnCount: Annotation({
        reducer: (x, y) => y ?? x + 1,
        default: () => 0,
    }),
    // Per-agent retry counts
    agentRetries: Annotation({
        reducer: (x, y) => ({ ...x, ...y }),
        default: () => ({}),
    }),
    // Flag indicating current agent needs to retry
    needsRetry: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),
    // Last error message for retry context
    lastError: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    // ✅ NEW: Hierarchical Teams Support
    // Active sub-tasks delegated by supervisor
    subTasks: Annotation({
        reducer: (x, y) => {
            // Merge sub-tasks, update existing ones by ID
            const merged = [...x];
            for (const task of y) {
                const existing = merged.findIndex(t => t.id === task.id);
                if (existing >= 0) {
                    merged[existing] = task;
                }
                else {
                    merged.push(task);
                }
            }
            return merged;
        },
        default: () => [],
    }),
    // Results aggregated from parallel workers
    aggregatedResults: Annotation({
        reducer: (x, y) => [...x, ...y],
        default: () => [],
    }),
    // Is the current agent acting as a supervisor?
    supervisorMode: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),
    // Parent task ID (for sub-task context)
    parentTaskId: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
});
//# sourceMappingURL=state.js.map