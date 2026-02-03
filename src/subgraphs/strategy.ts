import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

// Import agents
import { founderNode } from "../agents/founder.js";
import { productManagerNode } from "../agents/product-manager.js";
import { uxResearcherNode } from "../agents/ux-researcher.js";

/**
 * Strategy Subgraph
 * Handles: Founder → PM → UX Researcher
 * 
 * This subgraph focuses on validating ideas and defining requirements
 * before any design or implementation work begins.
 */

// Subgraph-specific state
const StrategyState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    currentStep: Annotation<"founder" | "pm" | "ux" | "done">({
        reducer: (x, y) => y ?? x,
        default: () => "founder",
    }),
});

// Build the subgraph
const strategyWorkflow = new StateGraph(StrategyState)
    .addNode("Founder", founderNode)
    .addNode("ProductManager", productManagerNode)
    .addNode("UXResearcher", uxResearcherNode)
    .addEdge(START, "Founder")
    .addEdge("Founder", "ProductManager")
    .addEdge("ProductManager", "UXResearcher")
    .addEdge("UXResearcher", END);

export const strategySubgraph = strategyWorkflow.compile();

/**
 * Run the strategy subgraph
 * Returns messages from all strategy agents
 */
export const runStrategyPhase = async (messages: BaseMessage[]) => {
    const result = await strategySubgraph.invoke({
        messages,
        currentStep: "founder",
    });
    return result.messages;
};
