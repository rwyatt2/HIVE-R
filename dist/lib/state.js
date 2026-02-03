import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
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
    // Typed artifacts produced by agents
    artifacts: Annotation({
        reducer: (x, y) => x.concat(y),
        default: () => [],
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
    // ✅ NEW: Turn counter (prevents infinite loops)
    turnCount: Annotation({
        reducer: (x, y) => y ?? x + 1,
        default: () => 0,
    }),
    // ✅ NEW: Per-agent retry counts
    agentRetries: Annotation({
        reducer: (x, y) => ({ ...x, ...y }),
        default: () => ({}),
    }),
    // ✅ NEW: Flag indicating current agent needs to retry
    needsRetry: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),
    // ✅ NEW: Last error message for retry context
    lastError: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
});
//# sourceMappingURL=state.js.map