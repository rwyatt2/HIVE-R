
import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./lib/state.js";
import { checkpointer } from "./lib/memory.js";
import { routerNode, HIVE_MEMBERS } from "./agents/router.js";
import { logger } from "./lib/logger.js";

// Agents
import { founderNode } from "./agents/founder.js";
import { productManagerNode } from "./agents/product-manager.js";
import { uxResearcherNode } from "./agents/ux-researcher.js";
import { designerNode } from "./agents/designer.js";
import { accessibilityNode } from "./agents/accessibility.js";
import { plannerNode } from "./agents/planner.js";
import { securityNode } from "./agents/security.js";
import { builderNode } from "./agents/builder.js";
import { reviewerNode } from "./agents/reviewer.js";
import { testerNode } from "./agents/tester.js";
import { techWriterNode } from "./agents/tech-writer.js";
import { sreNode } from "./agents/sre.js";
import { dataAnalystNode } from "./agents/data-analyst.js";

// --- Graph Setup ---
const workflow = new StateGraph(AgentState)
    .addNode("Router", routerNode)
    .addNode("Founder", founderNode)
    .addNode("ProductManager", productManagerNode)
    .addNode("UXResearcher", uxResearcherNode)
    .addNode("Designer", designerNode)
    .addNode("Accessibility", accessibilityNode)
    .addNode("Planner", plannerNode)
    .addNode("Security", securityNode)
    .addNode("Builder", builderNode)
    .addNode("Reviewer", reviewerNode)
    .addNode("Tester", testerNode)
    .addNode("TechWriter", techWriterNode)
    .addNode("SRE", sreNode)
    .addNode("DataAnalyst", dataAnalystNode)
    .addEdge(START, "Router");

workflow.addConditionalEdges(
    "Router",
    (state) => state.next,
    {
        Founder: "Founder",
        ProductManager: "ProductManager",
        UXResearcher: "UXResearcher",
        Designer: "Designer",
        Accessibility: "Accessibility",
        Planner: "Planner",
        Security: "Security",
        Builder: "Builder",
        Reviewer: "Reviewer",
        Tester: "Tester",
        TechWriter: "TechWriter",
        SRE: "SRE",
        DataAnalyst: "DataAnalyst",
        FINISH: END,
    }
);

// ✅ Builder has self-loop capability for retry
workflow.addConditionalEdges(
    "Builder",
    (state) => {
        if (state.needsRetry) {
            logger.info({ event: 'self_loop', agentName: 'Builder' }, 'Builder self-loop triggered');
            return "Builder";
        }
        // Check for direct handoff
        if (state.next && HIVE_MEMBERS.includes(state.next as any)) {
            logger.info({ event: 'handoff', from: 'Builder', to: state.next }, `Direct handoff: Builder → ${state.next}`);
            return state.next;
        }
        return "Router";
    },
    {
        Builder: "Builder",
        Router: "Router",
        Tester: "Tester",
        Reviewer: "Reviewer",
    }
);

// ✅ Create routing function for direct handoffs
function createAgentRouter(agentName: string) {
    return (state: typeof AgentState.State) => {
        // Check for direct handoff via state.next
        if (state.next && state.next !== "Router" && HIVE_MEMBERS.includes(state.next as any)) {
            logger.info({ event: 'handoff', from: agentName, to: state.next }, `Direct handoff: ${agentName} → ${state.next}`);
            return state.next;
        }
        return "Router";
    };
}

// All other agents can route directly OR back to Router
for (const member of HIVE_MEMBERS) {
    if (member !== "Builder") {
        workflow.addConditionalEdges(
            member,
            createAgentRouter(member),
            {
                Router: "Router",
                // Add all possible direct handoff targets
                Founder: "Founder",
                ProductManager: "ProductManager",
                UXResearcher: "UXResearcher",
                Designer: "Designer",
                Accessibility: "Accessibility",
                Planner: "Planner",
                Security: "Security",
                Builder: "Builder",
                Reviewer: "Reviewer",
                Tester: "Tester",
                TechWriter: "TechWriter",
                SRE: "SRE",
                DataAnalyst: "DataAnalyst",
            }
        );
    }
}

export const graph = workflow.compile({
    checkpointer
});

export { workflow };
