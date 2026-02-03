/**
 * Hierarchical Subgraph
 * 
 * Implements the Map-Reduce pattern for parallel agent execution.
 * Supervisor (PM) delegates tasks → Workers execute in parallel → Results aggregated.
 */

import { StateGraph, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { productManagerNode } from "../agents/product-manager.js";
import { builderNode } from "../agents/builder.js";
import { designerNode } from "../agents/designer.js";
import { testerNode } from "../agents/tester.js";
import type { SubTask } from "../tools/delegate.js";
import {
    getPendingSubTasks,
    allSubTasksComplete,
    formatSubTaskResults
} from "../tools/delegate.js";

// ============================================================================
// SUPERVISOR NODE
// ============================================================================

/**
 * Supervisor (PM) analyzes request and delegates sub-tasks
 */
const supervisorNode = async (state: typeof AgentState.State) => {
    // Enable supervisor mode
    const result = await productManagerNode({
        ...state,
        supervisorMode: true,
    });

    return {
        ...result,
        supervisorMode: true,
    };
};

// ============================================================================
// WORKER DISPATCHER
// ============================================================================

/**
 * Dispatches work to the appropriate worker based on sub-task
 */
const workerDispatchNode = async (state: typeof AgentState.State) => {
    const pendingTasks = getPendingSubTasks(state.subTasks);

    if (pendingTasks.length === 0) {
        return { subTasks: state.subTasks };
    }

    // Process first pending task (in production, use Send() for true parallelism)
    const task = pendingTasks[0]!;
    const updatedTask: SubTask = { ...task, status: "in_progress" };

    // Create context for worker
    const workerContext = new HumanMessage({
        content: `[SUB-TASK: ${task.id}]\n\n${task.description}\n\n${task.context || ""}`,
        name: "Supervisor",
    });

    // Get worker result based on role
    let workerResult;
    const workerState = {
        ...state,
        messages: [...state.messages, workerContext],
        parentTaskId: task.id,
    };

    switch (task.worker) {
        case "Builder":
            workerResult = await builderNode(workerState);
            break;
        case "Designer":
            workerResult = await designerNode(workerState);
            break;
        case "Tester":
            workerResult = await testerNode(workerState);
            break;
        default:
            workerResult = await builderNode(workerState);
    }

    // Mark task as completed
    const completedTask: SubTask = {
        ...updatedTask,
        status: "completed",
        result: workerResult.messages[0]?.content as string || "No output",
        completedAt: Date.now(),
    };

    return {
        subTasks: [completedTask],
        messages: workerResult.messages,
        aggregatedResults: [completedTask.result || ""],
    };
};

// ============================================================================
// SYNTHESIZER NODE
// ============================================================================

/**
 * Aggregates results from all workers into final output
 */
const synthesizerNode = async (state: typeof AgentState.State) => {
    const summary = formatSubTaskResults(state.subTasks);

    return {
        messages: [
            new HumanMessage({
                content: `## Hierarchical Execution Complete\n\n${summary}`,
                name: "Synthesizer",
            }),
        ],
        supervisorMode: false,
    };
};

// ============================================================================
// ROUTING LOGIC
// ============================================================================

function routeAfterSupervisor(state: typeof AgentState.State): string {
    // If sub-tasks were created, start dispatching
    if (state.subTasks.length > 0) {
        return "WorkerDispatch";
    }
    // No delegation, go directly to end
    return "End";
}

function routeAfterWorker(state: typeof AgentState.State): string {
    // If all tasks complete, synthesize
    if (allSubTasksComplete(state.subTasks)) {
        return "Synthesizer";
    }
    // More tasks pending, continue dispatching
    return "WorkerDispatch";
}

// ============================================================================
// HIERARCHICAL SUBGRAPH
// ============================================================================

const hierarchicalWorkflow = new StateGraph(AgentState)
    .addNode("Supervisor", supervisorNode)
    .addNode("WorkerDispatch", workerDispatchNode)
    .addNode("Synthesizer", synthesizerNode)
    .addEdge("__start__", "Supervisor")
    .addConditionalEdges("Supervisor", routeAfterSupervisor, {
        WorkerDispatch: "WorkerDispatch",
        End: "__end__",
    })
    .addConditionalEdges("WorkerDispatch", routeAfterWorker, {
        WorkerDispatch: "WorkerDispatch",
        Synthesizer: "Synthesizer",
    })
    .addEdge("Synthesizer", "__end__");

export const hierarchicalSubgraph = hierarchicalWorkflow.compile();

// ============================================================================
// HELPER EXPORTS
// ============================================================================

export { supervisorNode, workerDispatchNode, synthesizerNode };
