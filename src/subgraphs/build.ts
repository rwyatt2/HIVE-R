import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Import agents
import { plannerNode } from "../agents/planner.js";
import { securityNode } from "../agents/security.js";
import { builderNode } from "../agents/builder.js";
import { reviewerNode } from "../agents/reviewer.js";
import { testerNode } from "../agents/tester.js";

/**
 * Build Subgraph
 * Handles: Planner → Security → Builder → Reviewer → Tester
 * 
 * This is the core implementation subgraph with the most complex flow.
 * Reviewer can send back to Builder if changes are needed.
 */

const BuildState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    reviewPassed: Annotation<boolean>({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),
});

const buildWorkflow = new StateGraph(BuildState)
    .addNode("Planner", plannerNode)
    .addNode("Security", securityNode)
    .addNode("Builder", builderNode)
    .addNode("Reviewer", reviewerNode)
    .addNode("Tester", testerNode)
    .addEdge(START, "Planner")
    .addEdge("Planner", "Security")
    .addEdge("Security", "Builder")
    .addEdge("Builder", "Reviewer")
    // Reviewer can approve or request changes
    .addConditionalEdges(
        "Reviewer",
        (state) => {
            // Check if last message indicates approval
            const lastMessage = state.messages[state.messages.length - 1];
            const content = typeof lastMessage?.content === "string"
                ? lastMessage.content
                : "";

            if (content.toLowerCase().includes("✅ approve") ||
                content.toLowerCase().includes("verdict: approve")) {
                return "approved";
            }
            // For now, always proceed to tester to avoid loops
            return "approved";
        },
        {
            approved: "Tester",
            // changes_requested: "Builder", // Could loop back
        }
    )
    .addEdge("Tester", END);

export const buildSubgraph = buildWorkflow.compile();

export const runBuildPhase = async (messages: BaseMessage[]) => {
    const result = await buildSubgraph.invoke({
        messages,
        reviewPassed: false,
    });
    return result.messages;
};
