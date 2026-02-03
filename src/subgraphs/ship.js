import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
// Import agents
import { techWriterNode } from "../agents/tech-writer.js";
import { sreNode } from "../agents/sre.js";
import { dataAnalystNode } from "../agents/data-analyst.js";
/**
 * Ship Subgraph
 * Handles: TechWriter → SRE → DataAnalyst
 *
 * This subgraph handles documentation, deployment, and measurement.
 */
const ShipState = Annotation.Root({
    messages: Annotation({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
});
const shipWorkflow = new StateGraph(ShipState)
    .addNode("TechWriter", techWriterNode)
    .addNode("SRE", sreNode)
    .addNode("DataAnalyst", dataAnalystNode)
    .addEdge(START, "TechWriter")
    .addEdge("TechWriter", "SRE")
    .addEdge("SRE", "DataAnalyst")
    .addEdge("DataAnalyst", END);
export const shipSubgraph = shipWorkflow.compile();
export const runShipPhase = async (messages) => {
    const result = await shipSubgraph.invoke({ messages });
    return result.messages;
};
//# sourceMappingURL=ship.js.map