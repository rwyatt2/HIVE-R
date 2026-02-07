/**
 * Delegation Tool for Hierarchical Teams
 * 
 * Allows supervisors (PM, Planner) to delegate sub-tasks to worker agents.
 * Supports the Map-Reduce pattern for parallel execution.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HIVE_AGENTS } from "./handoff.js";
import { logger } from "../lib/logger.js";

// ============================================================================
// TYPES
// ============================================================================

export interface SubTask {
    id: string;
    worker: string;
    description: string;
    context?: string | undefined;
    status: "pending" | "in_progress" | "completed" | "failed";
    result?: string | undefined;
    createdAt: number;
    completedAt?: number;
}

export interface DelegationResult {
    delegate: true;
    worker: string;
    taskId: string;
    description: string;
    context?: string | undefined;
}

// ============================================================================
// WORKER ROLES
// ============================================================================

const WORKER_ROLES = ["Builder", "Designer", "Tester", "Security", "TechWriter"] as const;
type WorkerRole = typeof WORKER_ROLES[number];

// ============================================================================
// DELEGATION TOOL
// ============================================================================

let taskCounter = 0;

/**
 * Tool for supervisors to delegate sub-tasks to workers.
 * 
 * Usage:
 * - PM breaks "Create 3 components" into 3 sub-tasks
 * - Each sub-task is assigned to a Builder with context
 * - Workers execute in parallel
 */
export const delegateTool = tool(
    async ({ workerRole, taskDescription, context, priority }) => {
        const taskId = `task-${++taskCounter}-${Date.now()}`;

        const result: DelegationResult = {
            delegate: true,
            worker: workerRole,
            taskId,
            description: taskDescription,
            context,
        };

        logger.info({ taskId, workerRole, task: taskDescription.substring(0, 50) }, `Delegated: ${taskId} → ${workerRole}`);

        return JSON.stringify(result);
    },
    {
        name: "delegate_task",
        description: `Delegate a specific sub-task to a worker agent. Use this to break complex features into parallel implementations. Workers: ${WORKER_ROLES.join(", ")}`,
        schema: z.object({
            workerRole: z.enum(WORKER_ROLES).describe("The worker agent to assign this task to"),
            taskDescription: z.string().describe("Clear description of what the worker should build"),
            context: z.string().optional().describe("Additional context (requirements, constraints, related files)"),
            priority: z.enum(["high", "medium", "low"]).optional().describe("Task priority for ordering"),
        }),
    }
);

// ============================================================================
// DELEGATION DETECTION
// ============================================================================

/**
 * Parse tool call results to detect delegations
 */
export function detectDelegations(toolResults: string[]): DelegationResult[] {
    const delegations: DelegationResult[] = [];

    for (const result of toolResults) {
        try {
            const parsed = JSON.parse(result);
            if (parsed.delegate && parsed.worker && parsed.taskId) {
                delegations.push(parsed as DelegationResult);
            }
        } catch {
            // Not JSON or not a delegation, continue
        }
    }

    return delegations;
}

/**
 * Create a SubTask from a delegation result
 */
export function createSubTask(delegation: DelegationResult): SubTask {
    return {
        id: delegation.taskId,
        worker: delegation.worker,
        description: delegation.description,
        context: delegation.context,
        status: "pending",
        createdAt: Date.now(),
    };
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

/**
 * Check if all sub-tasks are complete
 */
export function allSubTasksComplete(subTasks: SubTask[]): boolean {
    return subTasks.length > 0 && subTasks.every(t =>
        t.status === "completed" || t.status === "failed"
    );
}

/**
 * Get pending sub-tasks
 */
export function getPendingSubTasks(subTasks: SubTask[]): SubTask[] {
    return subTasks.filter(t => t.status === "pending");
}

/**
 * Format sub-task results for synthesis
 */
export function formatSubTaskResults(subTasks: SubTask[]): string {
    const completed = subTasks.filter(t => t.status === "completed");
    const failed = subTasks.filter(t => t.status === "failed");

    let output = `## Sub-Task Results\n\n`;
    output += `✅ Completed: ${completed.length}/${subTasks.length}\n`;
    output += `❌ Failed: ${failed.length}/${subTasks.length}\n\n`;

    for (const task of completed) {
        output += `### ${task.id} (${task.worker})\n`;
        output += `**Task**: ${task.description}\n`;
        output += `**Result**:\n${task.result}\n\n`;
    }

    if (failed.length > 0) {
        output += `### Failed Tasks\n`;
        for (const task of failed) {
            output += `- ${task.id}: ${task.description}\n`;
        }
    }

    return output;
}
