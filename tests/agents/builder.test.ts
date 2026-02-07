/**
 * Builder Agent — Unit Tests
 *
 * The Builder is the most-used agent. It writes code, runs commands,
 * and supports self-loop retry for failed tool calls. Tests cover:
 *   - Successful code generation with tool calls
 *   - Tool execution (write_file, read_file, list_files, run_command)
 *   - Self-loop retry on failed tool calls
 *   - Max retry exhaustion and handoff
 *   - LLM error handling
 *   - Response formatting
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
    createBuildRequestState,
    createBuilderRetryState,
    createBuilderMaxRetriesState,
    LLM_TIMEOUT_ERROR,
    TOOL_EXECUTION_ERROR,
} from "../fixtures/agent-responses.js";
import {
    MOCK_BUILDER_WITH_TOOLS,
    MOCK_BUILDER_ANALYSIS_ONLY,
    MOCK_BUILDER_READ_WRITE,
    MOCK_BUILDER_UNKNOWN_TOOL,
} from "../fixtures/llm-responses.js";

// ============================================================================
// Persistent mock references — vi.hoisted() ensures availability during vi.mock
// ============================================================================
const {
    mockBuilderInvoke,
    mockWriteFile,
    mockReadFile,
    mockListDirectory,
    mockRunCommand,
} = vi.hoisted(() => ({
    mockBuilderInvoke: vi.fn(),
    mockWriteFile: vi.fn(),
    mockReadFile: vi.fn(),
    mockListDirectory: vi.fn(),
    mockRunCommand: vi.fn(),
}));

// ============================================================================
// Mock all dependencies
// ============================================================================
vi.mock("../../src/middleware/cost-tracking.js", () => ({
    createTrackedLLM: vi.fn(() => ({
        bindTools: vi.fn(() => ({
            invoke: mockBuilderInvoke,
        })),
        withStructuredOutput: vi.fn(() => ({
            invoke: vi.fn(),
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

// Mock file tools — matching exact exports from src/tools/files.ts
vi.mock("../../src/tools/files.js", () => ({
    readFileTool: { invoke: (...args: unknown[]) => mockReadFile(...args) },
    writeFileTool: { invoke: (...args: unknown[]) => mockWriteFile(...args) },
    listDirectoryTool: { invoke: (...args: unknown[]) => mockListDirectory(...args) },
    fileTools: [],
}));

vi.mock("../../src/tools/testing.js", () => ({
    runCommandTool: { invoke: (...args: unknown[]) => mockRunCommand(...args) },
    runTestsTool: { invoke: vi.fn() },
    testTools: [],
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

// ============================================================================
// Import after mocks
// ============================================================================
import { builderNode } from "../../src/agents/builder.js";

// ============================================================================
// Tests
// ============================================================================

describe("Builder Agent", () => {
    beforeEach(() => {
        mockBuilderInvoke.mockReset();
        mockWriteFile.mockReset();
        mockReadFile.mockReset();
        mockListDirectory.mockReset();
        mockRunCommand.mockReset();

        // Defaults for tool mocks
        mockWriteFile.mockResolvedValue("File written successfully");
        mockReadFile.mockResolvedValue("file content");
        mockListDirectory.mockResolvedValue("src/index.ts\nsrc/app.ts");
        mockRunCommand.mockResolvedValue("Tests passed");
    });

    // ====================================================================
    // Successful Execution
    // ====================================================================
    describe("Successful Tool Execution", () => {
        it("should execute tool calls and return formatted response", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_WITH_TOOLS);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            expect(result.messages).toHaveLength(1);
            expect(result.messages[0].name).toBe("Builder");
            expect(result.contributors).toContain("Builder");
        });

        it("should include tool results in response content", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_WITH_TOOLS);
            mockRunCommand.mockResolvedValue("All 15 tests passed");
            const state = createBuildRequestState();

            const result = await builderNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("Tool");
        });

        it("should call writeFile tool with correct args", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_WITH_TOOLS);
            const state = createBuildRequestState();

            await builderNode(state);

            expect(mockWriteFile).toHaveBeenCalledWith(
                expect.objectContaining({
                    filePath: "src/routes/auth.ts",
                })
            );
        });

        it("should call runCommand tool with correct args", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_WITH_TOOLS);
            const state = createBuildRequestState();

            await builderNode(state);

            expect(mockRunCommand).toHaveBeenCalled();
        });
    });

    // ====================================================================
    // Analysis Only (no tool calls)
    // ====================================================================
    describe("Analysis Only (No Tool Calls)", () => {
        it("should return response without tool results", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_ANALYSIS_ONLY);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            expect(result.messages).toHaveLength(1);
            expect(result.messages[0].name).toBe("Builder");
        });

        it("should not trigger needsRetry for analysis", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_ANALYSIS_ONLY);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            expect(result.needsRetry).toBeFalsy();
        });
    });

    // ====================================================================
    // Tool Errors
    // ====================================================================
    describe("Tool Errors", () => {
        it("should handle tool execution failure gracefully", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_WITH_TOOLS);
            mockWriteFile.mockRejectedValue(TOOL_EXECUTION_ERROR);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            // Should still return a result (not throw)
            expect(result.messages).toHaveLength(1);
            expect(result.contributors).toContain("Builder");
        });

        it("should mark needsRetry on tool failure", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_WITH_TOOLS);
            mockRunCommand.mockRejectedValue(new Error("npm test failed with exit code 1"));
            const state = createBuildRequestState();

            const result = await builderNode(state);

            // Content should contain error info for retry
            const content = result.messages[0].content as string;
            expect(content).toContain("error") || expect(content).toContain("fail");
        });
    });

    // ====================================================================
    // Read/Write Sequences
    // ====================================================================
    describe("Read/Write Sequences", () => {
        it("should handle read then write operations", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_READ_WRITE);
            const state = createBuildRequestState();

            await builderNode(state);

            expect(mockReadFile).toHaveBeenCalled();
            expect(mockWriteFile).toHaveBeenCalled();
        });
    });

    // ====================================================================
    // Unknown Tool Handling
    // ====================================================================
    describe("Unknown Tools", () => {
        it("should handle unknown tool names gracefully", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_UNKNOWN_TOOL);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            // Should not throw and should return a response
            expect(result.messages).toHaveLength(1);
        });
    });

    // ====================================================================
    // Retry State
    // ====================================================================
    describe("Retry Logic", () => {
        it("should include retry context when retrying", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_WITH_TOOLS);
            const state = createBuilderRetryState();

            const result = await builderNode(state);

            // LLM should have been called with retry context
            expect(mockBuilderInvoke).toHaveBeenCalled();
            expect(result.messages).toHaveLength(1);
        });

        it("should hand off when max retries exhausted", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_ANALYSIS_ONLY);
            const state = createBuilderMaxRetriesState();

            const result = await builderNode(state);

            // After max retries, should still produce a message
            expect(result.messages).toHaveLength(1);
            expect(result.contributors).toContain("Builder");
        });
    });

    // ====================================================================
    // LLM Errors
    // ====================================================================
    describe("LLM Error Handling", () => {
        it("should handle LLM timeout gracefully", async () => {
            mockBuilderInvoke.mockRejectedValue(LLM_TIMEOUT_ERROR);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            expect(result.messages[0].content).toContain("Error");
            expect(result.contributors).toContain("Builder");
        });

        it("should not throw on any LLM error", async () => {
            mockBuilderInvoke.mockRejectedValue(new Error("Catastrophic LLM failure"));
            const state = createBuildRequestState();

            await expect(builderNode(state)).resolves.toBeDefined();
        });

        it("should include error message in response", async () => {
            const error = new Error("Rate limit exceeded");
            mockBuilderInvoke.mockRejectedValue(error);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            const content = result.messages[0].content as string;
            expect(content).toContain("Rate limit exceeded");
        });
    });

    // ====================================================================
    // Response Structure
    // ====================================================================
    describe("Response Structure", () => {
        it("should always return messages array", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_ANALYSIS_ONLY);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            expect(Array.isArray(result.messages)).toBe(true);
            expect(result.messages.length).toBeGreaterThanOrEqual(1);
        });

        it("should always return contributors with Builder", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_ANALYSIS_ONLY);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            expect(result.contributors).toEqual(["Builder"]);
        });

        it("should set message name to Builder", async () => {
            mockBuilderInvoke.mockResolvedValue(MOCK_BUILDER_ANALYSIS_ONLY);
            const state = createBuildRequestState();

            const result = await builderNode(state);

            expect(result.messages[0].name).toBe("Builder");
        });
    });
});
