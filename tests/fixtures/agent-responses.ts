/**
 * Test fixtures for graph and agent tests
 *
 * Provides realistic mock data for LLM responses, state objects,
 * tool calls, and agent outputs used across the test suite.
 */

import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

// ============================================================================
// HIVE Members (mirrors src/lib/prompts.ts)
// ============================================================================

export const MOCK_HIVE_MEMBERS = [
    "Founder", "ProductManager", "UXResearcher", "Designer",
    "Accessibility", "Planner", "Security", "Builder",
    "Reviewer", "Tester", "TechWriter", "SRE", "DataAnalyst",
] as const;

// ============================================================================
// State Fixtures
// ============================================================================

/** Clean initial state (equivalent to graph START) */
export function createEmptyState() {
    return {
        messages: [],
        next: "Router",
        contributors: [],
        artifacts: [],
        artifactStore: {},
        phase: "strategy" as const,
        requiresApproval: false,
        approvalStatus: null,
        turnCount: 0,
        agentRetries: {},
        needsRetry: false,
        lastError: null,
        subTasks: [],
        aggregatedResults: [],
        supervisorMode: false,
        parentTaskId: null,
    };
}

/** State with a user message asking for code */
export function createBuildRequestState() {
    return {
        ...createEmptyState(),
        messages: [
            new HumanMessage("Build me a REST API with Express and TypeScript"),
        ],
    };
}

/** State with a user message about UX */
export function createDesignRequestState() {
    return {
        ...createEmptyState(),
        messages: [
            new HumanMessage("Design a user onboarding flow for our mobile app"),
        ],
    };
}

/** State mid-conversation with contributors */
export function createMidConversationState() {
    return {
        ...createEmptyState(),
        messages: [
            new HumanMessage("Build a login page"),
            new HumanMessage({
                content: "**[Planner]**: Here's the architecture for the login page...",
                name: "Planner",
            }),
            new HumanMessage({
                content: "**[Designer]**: Here's the UI spec for the login form...",
                name: "Designer",
            }),
        ],
        contributors: ["Planner", "Designer"],
        turnCount: 2,
    };
}

/** State at max turn count (should trigger FINISH) */
export function createMaxTurnState() {
    return {
        ...createEmptyState(),
        messages: [new HumanMessage("Build something")],
        turnCount: 25, // Exceeds safety limit
    };
}

/** State where Builder needs retry */
export function createBuilderRetryState() {
    return {
        ...createEmptyState(),
        messages: [
            new HumanMessage("Fix the failing tests"),
            new HumanMessage({
                content: "**Tool Results:**\nTool run_command: FAIL - TypeError: Cannot read property 'foo' of undefined\n\n**STATUS: NEEDS_RETRY**",
                name: "Builder",
            }),
        ],
        contributors: ["Builder"],
        needsRetry: true,
        agentRetries: { Builder: 1 },
        lastError: "TypeError: Cannot read property 'foo' of undefined",
    };
}

/** State where Builder has exhausted retries */
export function createBuilderMaxRetriesState() {
    return {
        ...createEmptyState(),
        messages: [new HumanMessage("Fix the tests")],
        contributors: ["Builder"],
        needsRetry: false,
        agentRetries: { Builder: 3 },
        lastError: "Still failing after 3 attempts",
    };
}

// ============================================================================
// Router Response Fixtures
// ============================================================================

/** Router routes to Builder */
export const ROUTE_TO_BUILDER = { next: "Builder", reasoning: "User asked for code implementation" };

/** Router routes to Designer */
export const ROUTE_TO_DESIGNER = { next: "Designer", reasoning: "User is asking about UI/UX design" };

/** Router routes to Planner */
export const ROUTE_TO_PLANNER = { next: "Planner", reasoning: "Need architecture before building" };

/** Router decides work is done */
export const ROUTE_TO_FINISH = { next: "FINISH", reasoning: "All requested work has been addressed" };

/** Router routes to Tester */
export const ROUTE_TO_TESTER = { next: "Tester", reasoning: "Code needs testing" };

// ============================================================================
// Agent Response Fixtures
// ============================================================================

/** Mock Builder success with tool calls */
export const BUILDER_SUCCESS_RESPONSE = {
    content: "I've implemented the Express API with proper TypeScript types.",
    tool_calls: [
        {
            name: "write_file",
            args: { filePath: "src/index.ts", content: "console.log('hello');" },
            id: "call_1",
        },
        {
            name: "run_command",
            args: { command: "npm test" },
            id: "call_2",
        },
    ],
};

/** Mock Builder response without tool calls */
export const BUILDER_NO_TOOLS_RESPONSE = {
    content: "I've analyzed the codebase and here's my assessment of the code structure.",
    tool_calls: [],
};

/** Mock Agent simple response (Planner, Designer, etc.) */
export function createAgentResponse(agentName: string, content: string) {
    return {
        messages: [
            new HumanMessage({
                content: `**[${agentName}]**: ${content}`,
                name: agentName,
            }),
        ],
        contributors: [agentName],
    };
}

// ============================================================================
// Error Fixtures
// ============================================================================

export const LLM_TIMEOUT_ERROR = new Error("Request timeout after 30000ms");
export const LLM_RATE_LIMIT_ERROR = new Error("429: Rate limit exceeded");
export const LLM_AUTH_ERROR = new Error("401: Invalid API key");
export const TOOL_EXECUTION_ERROR = new Error("ENOENT: no such file or directory");
