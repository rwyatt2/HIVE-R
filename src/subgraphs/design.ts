import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Import agents
import { designerNode } from "../agents/designer.js";
import { accessibilityNode } from "../agents/accessibility.js";

/**
 * Design Subgraph
 * Handles: Designer → Accessibility
 * 
 * This subgraph focuses on user experience and inclusive design
 * before technical planning begins.
 */

const DesignState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
});

const designWorkflow = new StateGraph(DesignState)
    .addNode("Designer", designerNode)
    .addNode("Accessibility", accessibilityNode)
    .addEdge(START, "Designer")
    .addEdge("Designer", "Accessibility")
    .addEdge("Accessibility", END);

export const designSubgraph = designWorkflow.compile();

export const runDesignPhase = async (messages: BaseMessage[]) => {
    const result = await designSubgraph.invoke({ messages });
    return result.messages;
};
