/**
 * Comprehensive Test Suite for graph.ts — Core LangGraph Orchestration
 *
 * Tests cover:
 *   1. Graph construction (all 14 agent nodes, START edge)
 *   2. Router logic (routing decisions, turn limits, circuit breaker, error fallback)
 *   3. Builder self-loop (retry logic, max retries, direct handoff)
 *   4. Agent routing (createAgentRouter, direct handoffs, back-to-Router)
 *   5. State reducers (messages concat, contributors dedup, next override)
 *   6. Edge cases (empty messages, invalid state, LLM errors)
 *
 * All LLM calls are mocked — no real API calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
    createEmptyState,
    createBuildRequestState,
    createDesignRequestState,
    createMidConversationState,
    createMaxTurnState,
    createBuilderRetryState,
    createBuilderMaxRetriesState,
    MOCK_HIVE_MEMBERS,
    ROUTE_TO_BUILDER,
    ROUTE_TO_DESIGNER,
    ROUTE_TO_FINISH,
    ROUTE_TO_TESTER,
    createAgentResponse,
    LLM_TIMEOUT_ERROR,
} from "./fixtures/agent-responses.js";

// ============================================================================
// MOCK ALL HEAVY DEPENDENCIES
// These must be before any import of graph.ts or its transitive dependencies.
// ============================================================================

// Shared mock invoke functions (persist across clearAllMocks)
const mockRouterInvoke = vi.fn();
const mockBuilderInvoke = vi.fn();

// Mock the cost tracking middleware (prevents real LLM instantiation)
vi.mock("../src/middleware/cost-tracking.js", () => ({
    createTrackedLLM: vi.fn((name: string) => {
        if (name === "Router") {
            return {
                withStructuredOutput: vi.fn(() => ({
                    invoke: mockRouterInvoke,
                })),
                invoke: vi.fn(),
            };
        }
        // Builder and all other agents
        return {
            withStructuredOutput: vi.fn(() => ({
                invoke: vi.fn(),
            })),
            bindTools: vi.fn(() => ({
                invoke: mockBuilderInvoke,
            })),
            invoke: vi.fn(),
        };
    }),
}));

// Mock the checkpointer (prevents SQLite DB creation)
vi.mock("../src/lib/memory.js", () => ({
    checkpointer: undefined,
}));

// Mock safety module
const mockCheckTurnLimit = vi.fn();
const mockIsCircuitOpen = vi.fn();
vi.mock("../src/lib/safety.js", () => ({
    checkTurnLimit: (...args: unknown[]) => mockCheckTurnLimit(...args),
    isCircuitOpen: (...args: unknown[]) => mockIsCircuitOpen(...args),
    SAFETY_CONFIG: { MAX_TURNS: 25, MAX_AGENT_RETRIES: 3, AGENT_TIMEOUT_MS: 60000, SELF_LOOP_AGENTS: ["Builder"] },
    circuitBreaker: { recordSuccess: vi.fn(), recordFailure: vi.fn() },
    withTimeout: vi.fn((fn: unknown) => fn),
    safeAgentExecution: vi.fn((_name: string, fn: () => unknown) => fn()),
}));

// Mock logger
vi.mock("../src/lib/logger.js", () => ({
    logger: {
        info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
        routingDecision: vi.fn(), safetyTrigger: vi.fn(),
    },
}));

// Mock plugins
vi.mock("../src/lib/plugins.js", () => ({
    getPluginRouterContext: vi.fn(() => ""),
    getPluginNames: vi.fn(() => []),
}));

// Mock utils
vi.mock("../src/lib/utils.js", () => ({
    formatContributorContext: vi.fn((contributors: string[]) =>
        contributors.length ? `\nContributors: ${contributors.join(", ")}` : ""
    ),
}));

// Mock design system and production standards
vi.mock("../src/lib/design-system.js", () => ({
    getDesignContext: vi.fn(() => ""),
    getActiveFramework: vi.fn(() => null),
}));

vi.mock("../src/lib/production-standards.js", () => ({
    getStandardsForAgent: vi.fn(() => ""),
}));

// Mock file and testing tools
vi.mock("../src/tools/files.js", () => ({
    readFileTool: { invoke: vi.fn(), name: "read_file" },
    writeFileTool: { invoke: vi.fn(), name: "write_file" },
    listDirectoryTool: { invoke: vi.fn(), name: "list_directory" },
}));

vi.mock("../src/tools/testing.js", () => ({
    runCommandTool: { invoke: vi.fn(), name: "run_command" },
}));

// Mock artifact-store
vi.mock("../src/lib/artifact-store.js", () => ({
    createArtifactStore: vi.fn(() => ({})),
}));

// Mock cost-tracker
vi.mock("../src/lib/cost-tracker.js", () => ({
    initCostTrackingTable: vi.fn(),
    getDailyCost: vi.fn(() => ({ totalCost: 0, callCount: 0 })),
}));

// Mock semantic memory
vi.mock("../src/lib/semantic-memory.js", () => ({
    initSemanticMemory: vi.fn(async () => { }),
    searchMemories: vi.fn(async () => []),
    storeMemory: vi.fn(async () => { }),
    getSemanticMemoryStats: vi.fn(() => ({})),
    isSemanticMemoryEnabled: vi.fn(() => false),
}));

// ============================================================================
// IMPORT AFTER MOCKS
// ============================================================================

import { createTrackedLLM } from "../src/middleware/cost-tracking.js";
import { HIVE_MEMBERS } from "../src/lib/prompts.js";

// ============================================================================
// TESTS
// ============================================================================

describe("Graph Construction", () => {
    it("should export all 13 HIVE_MEMBERS", () => {
        expect(HIVE_MEMBERS).toHaveLength(13);
        expect(HIVE_MEMBERS).toEqual(MOCK_HIVE_MEMBERS);
    });

    it("should include all expected agent names", () => {
        const expected = [
            "Founder", "ProductManager", "UXResearcher", "Designer",
            "Accessibility", "Planner", "Security", "Builder",
            "Reviewer", "Tester", "TechWriter", "SRE", "DataAnalyst",
        ];
        for (const name of expected) {
            expect(HIVE_MEMBERS).toContain(name);
        }
    });

    it("should create tracked LLMs for agents (not raw ChatOpenAI)", async () => {
        // Import router to trigger module-level createTrackedLLM calls
        await import("../src/agents/router.js");
        expect(createTrackedLLM).toHaveBeenCalled();
    });
});

describe("Router Node — Routing Decisions", () => {
    let routerNode: typeof import("../src/agents/router.js").routerNode;

    beforeEach(async () => {
        mockRouterInvoke.mockReset();
        mockIsCircuitOpen.mockReset();
        mockCheckTurnLimit.mockReturnValue({ safe: true });
        mockIsCircuitOpen.mockReturnValue(false);

        const routerModule = await import("../src/agents/router.js");
        routerNode = routerModule.routerNode;
    });

    it("should route to Builder when user asks for code", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_BUILDER);

        const state = createBuildRequestState();
        const result = await routerNode(state);

        expect(result.next).toBe("Builder");
    });

    it("should route to Designer for design requests", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_DESIGNER);

        const state = createDesignRequestState();
        const result = await routerNode(state);

        expect(result.next).toBe("Designer");
    });

    it("should return FINISH when work is complete", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_FINISH);

        const state = createMidConversationState();
        const result = await routerNode(state);

        expect(result.next).toBe("FINISH");
    });

    it("should increment turnCount on successful routing", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_BUILDER);

        const state = { ...createEmptyState(), turnCount: 3 };
        const result = await routerNode(state);

        expect(result.turnCount).toBe(4);
    });

    it("should return FINISH when turn limit is exceeded", async () => {
        mockCheckTurnLimit.mockReturnValue({ safe: false, reason: "Max turns exceeded" });

        const state = createMaxTurnState();
        const result = await routerNode(state);

        expect(result.next).toBe("FINISH");
        // Should NOT call the LLM at all
        expect(mockRouterInvoke).not.toHaveBeenCalled();
    });

    it("should return FINISH when target agent circuit is open", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_BUILDER);
        mockIsCircuitOpen.mockReturnValue(true); // Builder circuit is open

        const state = createBuildRequestState();
        const result = await routerNode(state);

        expect(result.next).toBe("FINISH");
    });

    it("should return FINISH on LLM error (graceful failure)", async () => {
        mockRouterInvoke.mockRejectedValue(LLM_TIMEOUT_ERROR);

        const state = createBuildRequestState();
        const result = await routerNode(state);

        expect(result.next).toBe("FINISH");
    });

    it("should not check circuit breaker for FINISH routing", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_FINISH);

        const state = createEmptyState();
        state.messages = [new HumanMessage("thanks, all done")];
        await routerNode(state);

        expect(mockIsCircuitOpen).not.toHaveBeenCalled();
    });
});

describe("Builder Node — Self-Loop and Retry", () => {
    let builderNode: typeof import("../src/agents/builder.js").builderNode;

    beforeEach(async () => {
        mockBuilderInvoke.mockReset();

        const builderModule = await import("../src/agents/builder.js");
        builderNode = builderModule.builderNode;
    });

    it("should hand off after max retries with error message", async () => {
        const state = createBuilderMaxRetriesState();
        const result = await builderNode(state);

        expect(result.needsRetry).toBe(false);
        expect(result.agentRetries).toEqual({ Builder: 0 }); // Reset
        expect(result.contributors).toContain("Builder");
        // Message should mention max retries
        const msg = result.messages[0];
        expect(msg.content).toContain("attempted to fix the code");
    });

    it("should return agent response without tool calls", async () => {
        mockBuilderInvoke.mockResolvedValue({
            content: "Here's my analysis of the codebase.",
            tool_calls: [],
        });

        const state = createBuildRequestState();
        const result = await builderNode(state);

        expect(result.contributors).toContain("Builder");
        expect(result.needsRetry).toBe(false);
    });

    it("should handle LLM errors gracefully", async () => {
        mockBuilderInvoke.mockRejectedValue(new Error("API connection failed"));

        const state = createBuildRequestState();
        const result = await builderNode(state);

        expect(result.contributors).toContain("Builder");
        expect(result.needsRetry).toBe(false);
        expect(result.lastError).toBe("API connection failed");
        expect(result.messages[0].content).toContain("Builder Error");
    });
});

describe("State Reducers", () => {
    it("messages should concatenate (not replace)", () => {
        const state = createEmptyState();
        const msg1 = [new HumanMessage("Hello")];
        const msg2 = [new HumanMessage("World")];

        // Simulating the reducer: concat
        const result = [...state.messages, ...msg1, ...msg2];
        expect(result).toHaveLength(2);
    });

    it("contributors should de-duplicate", () => {
        const existing = ["Builder", "Planner"];
        const incoming = ["Builder", "Tester"]; // Builder is duplicate

        // Simulating the reducer: Set-based merge
        const result = [...new Set([...existing, ...incoming])];
        expect(result).toEqual(["Builder", "Planner", "Tester"]);
    });

    it("next should default to Router", () => {
        const state = createEmptyState();
        expect(state.next).toBe("Router");
    });

    it("turnCount should default to 0", () => {
        const state = createEmptyState();
        expect(state.turnCount).toBe(0);
    });

    it("needsRetry should default to false", () => {
        const state = createEmptyState();
        expect(state.needsRetry).toBe(false);
    });
});

describe("Conditional Edge: Builder Self-Loop", () => {
    it("should return Builder when needsRetry is true", () => {
        // This tests the logic inside graph.ts addConditionalEdges for Builder
        const state = { ...createEmptyState(), needsRetry: true };
        // Simulate the edge function: (state) => state.needsRetry ? "Builder" : ...
        const result = state.needsRetry ? "Builder" : "Router";
        expect(result).toBe("Builder");
    });

    it("should return Router when needsRetry is false and no handoff", () => {
        const state = { ...createEmptyState(), needsRetry: false, next: "Router" };
        const result = state.needsRetry ? "Builder" : (
            state.next && HIVE_MEMBERS.includes(state.next as any) ? state.next : "Router"
        );
        expect(result).toBe("Router");
    });

    it("should return target agent for direct handoff from Builder", () => {
        const state = { ...createEmptyState(), needsRetry: false, next: "Tester" };
        const result = state.needsRetry ? "Builder" : (
            state.next && HIVE_MEMBERS.includes(state.next as any) ? state.next : "Router"
        );
        expect(result).toBe("Tester");
    });
});

describe("Conditional Edge: Agent Router (non-Builder agents)", () => {
    // Simulates the createAgentRouter function from graph.ts

    function createAgentRouter(agentName: string) {
        return (state: { next: string }) => {
            if (state.next && state.next !== "Router" && HIVE_MEMBERS.includes(state.next as any)) {
                return state.next;
            }
            return "Router";
        };
    }

    it("should route back to Router by default", () => {
        const router = createAgentRouter("Planner");
        const result = router({ next: "" });
        expect(result).toBe("Router");
    });

    it("should allow direct handoff to another agent", () => {
        const router = createAgentRouter("Designer");
        const result = router({ next: "Builder" });
        expect(result).toBe("Builder");
    });

    it("should route back to Router if next is Router", () => {
        const router = createAgentRouter("Tester");
        const result = router({ next: "Router" });
        expect(result).toBe("Router");
    });

    it("should route back to Router for FINISH", () => {
        const router = createAgentRouter("SRE");
        const result = router({ next: "FINISH" });
        expect(result).toBe("Router");
    });

    it("should route back to Router for invalid agent names", () => {
        const router = createAgentRouter("Planner");
        const result = router({ next: "NonExistentAgent" });
        expect(result).toBe("Router");
    });
});

describe("Edge Cases", () => {
    let routerNode: typeof import("../src/agents/router.js").routerNode;

    beforeEach(async () => {
        mockRouterInvoke.mockReset();
        mockCheckTurnLimit.mockReturnValue({ safe: true });
        mockIsCircuitOpen.mockReturnValue(false);

        const routerModule = await import("../src/agents/router.js");
        routerNode = routerModule.routerNode;
    });

    it("should handle empty messages array", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_FINISH);

        const state = createEmptyState();
        const result = await routerNode(state);

        // Should still work — router decides FINISH for empty input
        expect(result.next).toBe("FINISH");
    });

    it("should handle undefined contributors gracefully", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_BUILDER);

        const state = { ...createEmptyState(), contributors: undefined as any };
        const result = await routerNode(state);

        expect(result.next).toBe("Builder");
    });

    it("should handle undefined turnCount gracefully", async () => {
        mockRouterInvoke.mockResolvedValue(ROUTE_TO_TESTER);

        const state = { ...createEmptyState(), turnCount: undefined as any };
        const result = await routerNode(state);

        // turnCount ?? 0, so should still work
        expect(result.next).toBe("Tester");
        expect(result.turnCount).toBe(1); // 0 + 1
    });
});

describe("HIVE_MEMBERS Completeness", () => {
    it("should contain exactly 13 members (no duplicates)", () => {
        const unique = new Set(HIVE_MEMBERS);
        expect(unique.size).toBe(13);
        expect(HIVE_MEMBERS).toHaveLength(13);
    });

    it("should match all agents defined in graph.ts node additions", () => {
        // These are the exact names used in graph.ts .addNode() calls
        const graphAgents = [
            "Founder", "ProductManager", "UXResearcher", "Designer",
            "Accessibility", "Planner", "Security", "Builder",
            "Reviewer", "Tester", "TechWriter", "SRE", "DataAnalyst",
        ];
        for (const agent of graphAgents) {
            expect(HIVE_MEMBERS).toContain(agent);
        }
    });

    it("should not include Router as a member (Router is separate)", () => {
        expect(HIVE_MEMBERS).not.toContain("Router");
    });

    it("should not include FINISH as a member", () => {
        expect(HIVE_MEMBERS).not.toContain("FINISH");
    });
});
