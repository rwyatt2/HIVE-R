/**
 * Tester Agent — Unit Tests (meta: testing the tester!)
 *
 * The Tester agent produces structured TestPlan artifacts, with a fallback
 * path that invokes run_command / run_tests tools. Tests cover:
 *   - Structured TestPlan output (happy path)
 *   - Fallback to tool calls when structured output fails
 *   - Tool execution (run_command, run_tests)
 *   - Unknown tool handling
 *   - Tool error handling
 *   - Response without tool calls
 *   - Graceful LLM error handling
 *   - Response structure validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
    createEmptyState,
    LLM_TIMEOUT_ERROR,
} from "../fixtures/agent-responses.js";
import {
    MOCK_TEST_PLAN,
    MOCK_TESTER_WITH_TOOLS,
    MOCK_TESTER_WITH_COMMAND,
    MOCK_TESTER_NO_TOOLS,
} from "../fixtures/llm-responses.js";

// ============================================================================
// Persistent mock references — vi.hoisted() ensures availability during vi.mock
// ============================================================================
const {
    mockStructuredInvoke,
    mockToolsInvoke,
    mockRunCommandInvoke,
    mockRunTestsInvoke,
} = vi.hoisted(() => ({
    mockStructuredInvoke: vi.fn(),
    mockToolsInvoke: vi.fn(),
    mockRunCommandInvoke: vi.fn(),
    mockRunTestsInvoke: vi.fn(),
}));

// ============================================================================
// Mock all dependencies
// ============================================================================
vi.mock("../../src/middleware/cost-tracking.js", () => ({
    createTrackedLLM: vi.fn(() => ({
        withStructuredOutput: vi.fn(() => ({
            invoke: mockStructuredInvoke,
        })),
        bindTools: vi.fn(() => ({
            invoke: mockToolsInvoke,
        })),
        invoke: vi.fn(),
    })),
}));

vi.mock("../../src/lib/memory.js", () => ({
    checkpointer: undefined,
}));

vi.mock("../../src/lib/logger.js", () => ({
    logger: {
        info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
        routingDecision: vi.fn(), safetyTrigger: vi.fn(),
    },
}));

vi.mock("../../src/lib/safety.js", () => ({
    checkTurnLimit: vi.fn(() => ({ safe: true })),
    isCircuitOpen: vi.fn(() => false),
    SAFETY_CONFIG: { MAX_TURNS: 25, MAX_AGENT_RETRIES: 3, AGENT_TIMEOUT_MS: 60000, SELF_LOOP_AGENTS: ["Builder"] },
}));

vi.mock("../../src/lib/utils.js", () => ({
    formatContributorContext: vi.fn(() => ""),
}));

vi.mock("../../src/lib/plugins.js", () => ({
    getPluginNames: vi.fn(() => []),
    getPluginRouterContext: vi.fn(() => ""),
}));

vi.mock("../../src/lib/artifact-store.js", () => ({
    createArtifactStore: vi.fn(() => ({})),
}));

vi.mock("../../src/tools/files.js", () => ({
    writeFileTool: { invoke: vi.fn() },
    readFileTool: { invoke: vi.fn() },
    listDirectoryTool: { invoke: vi.fn() },
    fileTools: [],
}));

vi.mock("../../src/lib/design-system.js", () => ({
    getDesignContext: vi.fn(() => ""),
    getActiveFramework: vi.fn(() => null),
    getDesignSystemContext: vi.fn(() => ""),
}));

vi.mock("../../src/lib/production-standards.js", () => ({
    getStandardsForAgent: vi.fn(() => ""),
    getProductionStandards: vi.fn(() => ""),
}));

vi.mock("../../src/middleware/semantic-memory.js", () => ({
    createSemanticMemory: vi.fn(() => ({
        addMemory: vi.fn(),
        search: vi.fn(() => []),
    })),
}));

// Mock testing tools (used directly by tester)
vi.mock("../../src/tools/testing.js", () => ({
    runCommandTool: { invoke: (...args: unknown[]) => mockRunCommandInvoke(...args) },
    runTestsTool: { invoke: (...args: unknown[]) => mockRunTestsInvoke(...args) },
    testTools: [],
}));

// ============================================================================
// Import after mocks
// ============================================================================
import { testerNode } from "../../src/agents/tester.js";

// ============================================================================
// Helpers
// ============================================================================
function createTestRequestState() {
    return {
        ...createEmptyState(),
        messages: [
            new HumanMessage("Write a test plan for the authentication feature and run the existing tests"),
        ],
    };
}

// ============================================================================
// Tests
// ============================================================================

describe("Tester Agent", () => {
    beforeEach(() => {
        mockStructuredInvoke.mockReset();
        mockToolsInvoke.mockReset();
        mockRunCommandInvoke.mockReset();
        mockRunTestsInvoke.mockReset();

        mockRunCommandInvoke.mockResolvedValue("stdout:\nTests passed\n");
        mockRunTestsInvoke.mockResolvedValue("Test Results:\n15 tests passed, 0 failed");
    });

    // ====================================================================
    // Structured Output (Happy Path)
    // ====================================================================
    describe("Structured TestPlan Output", () => {
        it("should produce a TestPlan artifact", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);

            expect(result.artifacts).toHaveLength(1);
            expect(result.artifacts![0].type).toBe("TestPlan");
        });

        it("should include title in artifact", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);

            expect(result.artifacts![0].title).toBe("Test Plan: User Login Flow");
        });

        it("should include test cases in artifact", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);

            expect(result.artifacts![0].testCases).toHaveLength(3);
            expect(result.artifacts![0].testCases[0].id).toBe("TC-001");
        });

        it("should format test plan as markdown", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("# Test Plan: User Login Flow");
            expect(content).toContain("## Strategy");
            expect(content).toContain("## Test Cases");
            expect(content).toContain("TC-001");
        });

        it("should include edge cases in formatted output", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("## Edge Cases");
            expect(content).toContain("SQL injection");
        });

        it("should include automation plan in formatted output", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("## Automation Plan");
        });

        it("should include manual testing notes", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("## Manual Testing Notes");
        });

        it("should format test steps as numbered list", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("1.");
        });
    });

    // ====================================================================
    // Fallback to Tool Calls
    // ====================================================================
    describe("Fallback to Tool Calls", () => {
        it("should fall back to tools when structured output fails", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("Schema validation failed"));
            mockToolsInvoke.mockResolvedValue(MOCK_TESTER_WITH_TOOLS);

            const state = createTestRequestState();
            const result = await testerNode(state);

            expect(result.messages).toHaveLength(1);
            expect(result.contributors).toContain("Tester");
        });

        it("should execute run_tests tool on fallback", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("Schema fail"));
            mockToolsInvoke.mockResolvedValue(MOCK_TESTER_WITH_TOOLS);

            const state = createTestRequestState();
            await testerNode(state);

            expect(mockRunTestsInvoke).toHaveBeenCalledWith(
                expect.objectContaining({
                    testPath: "tests/auth.test.ts",
                    framework: "vitest",
                })
            );
        });

        it("should execute run_command tool on fallback", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("Schema fail"));
            mockToolsInvoke.mockResolvedValue(MOCK_TESTER_WITH_COMMAND);

            const state = createTestRequestState();
            await testerNode(state);

            expect(mockRunCommandInvoke).toHaveBeenCalledWith(
                expect.objectContaining({
                    command: "npx vitest run --coverage",
                })
            );
        });

        it("should include tool results in message on fallback", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("Schema fail"));
            mockToolsInvoke.mockResolvedValue(MOCK_TESTER_WITH_TOOLS);
            mockRunTestsInvoke.mockResolvedValue("15 tests passed, 0 failed");

            const state = createTestRequestState();
            const result = await testerNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("Test Results");
        });

        it("should handle fallback with no tool calls", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("Schema fail"));
            mockToolsInvoke.mockResolvedValue(MOCK_TESTER_NO_TOOLS);

            const state = createTestRequestState();
            const result = await testerNode(state);

            expect(result.messages[0].content).toBe("Here's my analysis of the test coverage gaps.");
        });
    });

    // ====================================================================
    // Tool Error Handling
    // ====================================================================
    describe("Tool Error Handling", () => {
        it("should handle tool execution error gracefully", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("Schema fail"));
            mockToolsInvoke.mockResolvedValue(MOCK_TESTER_WITH_TOOLS);
            mockRunTestsInvoke.mockRejectedValue(new Error("ENOENT: test file not found"));

            const state = createTestRequestState();
            const result = await testerNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("Tool error");
            expect(content).toContain("ENOENT");
        });

        it("should handle unknown tool name gracefully", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("Schema fail"));
            mockToolsInvoke.mockResolvedValue({
                content: "Trying unknown tool",
                tool_calls: [{ name: "deploy_to_cloud", args: {}, id: "call_unknown" }],
            });

            const state = createTestRequestState();
            const result = await testerNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("Unknown tool");
        });
    });

    // ====================================================================
    // LLM Error Handling
    // ====================================================================
    describe("LLM Error Handling", () => {
        it("should handle outer LLM failure gracefully", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("Schema fail"));
            mockToolsInvoke.mockRejectedValue(LLM_TIMEOUT_ERROR);

            const state = createTestRequestState();
            const result = await testerNode(state);

            const content = result.messages[0].content as string;
            expect(content).toContain("[Tester Error]");
        });

        it("should still return contributor on error", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("fail"));
            mockToolsInvoke.mockRejectedValue(new Error("also fail"));

            const state = createTestRequestState();
            const result = await testerNode(state);

            expect(result.contributors).toEqual(["Tester"]);
        });

        it("should not throw on any error", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("fail"));
            mockToolsInvoke.mockRejectedValue(new Error("also fail"));

            const state = createTestRequestState();

            await expect(testerNode(state)).resolves.toBeDefined();
        });

        it("should not emit artifact on error", async () => {
            mockStructuredInvoke.mockRejectedValue(new Error("fail"));
            mockToolsInvoke.mockRejectedValue(new Error("also fail"));

            const state = createTestRequestState();
            const result = await testerNode(state);

            expect(result.artifacts).toBeUndefined();
        });
    });

    // ====================================================================
    // Response Structure
    // ====================================================================
    describe("Response Structure", () => {
        it("should always return exactly one message", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);

            expect(result.messages).toHaveLength(1);
        });

        it("should always have Tester as contributor", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);

            expect(result.contributors).toEqual(["Tester"]);
        });

        it("should set message name to Tester", async () => {
            mockStructuredInvoke.mockResolvedValue(MOCK_TEST_PLAN);
            const state = createTestRequestState();

            const result = await testerNode(state);

            expect(result.messages[0].name).toBe("Tester");
        });
    });
});
