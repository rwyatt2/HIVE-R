import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
/**
 * Enhanced Agent State with:
 * - Message history
 * - Routing decisions
 * - Typed artifacts
 * - Agent contribution tracking
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
});
//# sourceMappingURL=state.js.map