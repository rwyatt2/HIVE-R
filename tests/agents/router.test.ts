/**
 * Router Agent — Unit Tests
 *
 * The Router is the most critical agent: it reads conversation context and
 * decides which specialist goes next. Tests cover:
 *   - Routing to correct agents based on LLM structured output (Level 0)
 *   - Turn limit safety (prevents infinite loops)
 *   - Circuit breaker (skips agents that keep failing)
 *   - Contributor context injection
 *   - Plugin context injection
 *   - Graceful LLM error handling
 *   - Dynamic Zod schema creation (includes plugins)
 *   - Fallback chain (Level 0 → 1 → 2 → 3)
 *   - Rule-based routing (Level 3)
 *   - Fallback metrics tracking
 *   - FORCE_FALLBACK_LEVEL env var
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import {
    createEmptyState,
    createBuildRequestState,
    createMidConversationState,
    createMaxTurnState,
    ROUTE_TO_BUILDER,
    ROUTE_TO_FINISH,
    LLM_TIMEOUT_ERROR,
} from "../fixtures/agent-responses.js";
import {
    MOCK_ROUTE_TO_SECURITY,
    MOCK_ROUTE_TO_SRE,
    MOCK_ROUTE_TO_REVIEWER,
} from "../fixtures/llm-responses.js";

// ============================================================================
// Persistent mock references — vi.hoisted() ensures availability during vi.mock
// ============================================================================
const {
    mockStructuredInvoke,
    mockPlainInvoke,
    mockClaudeStructuredInvoke,
    mockCheckTurnLimit,
    mockIsCircuitOpen,
    mockLogger,
    mockFormatContributorContext,
    mockExtractUserQuery,
    mockGetPluginNames,
    mockGetPluginRouterContext,
    mockCreateTrackedLLM,
} = vi.hoisted(() => ({
    mockStructuredInvoke: vi.fn(),
    mockPlainInvoke: vi.fn(),
    mockClaudeStructuredInvoke: vi.fn(),
    mockCheckTurnLimit: vi.fn(),
    mockIsCircuitOpen: vi.fn(),
    mockLogger: {
        info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
        routingDecision: vi.fn(), safetyTrigger: vi.fn(),
    },
    mockFormatContributorContext: vi.fn((c: string[]) =>
        c.length ? `\nContributors: ${c.join(", ")}` : ""
    ),
    mockExtractUserQuery: vi.fn((messages: any[]) => {
        for (const msg of messages) {
            if (typeof msg?.content === "string") return msg.content;
        }
        return "";
    }),
    mockGetPluginNames: vi.fn(() => [] as string[]),
    mockGetPluginRouterContext: vi.fn(() => ""),
    mockCreateTrackedLLM: vi.fn(),
}));

// ============================================================================
// Mock all dependencies
// ============================================================================

// Track how many times createTrackedLLM is called to distinguish primary vs fallback
vi.mock("../../src/middleware/cost-tracking.js", () => ({
    createTrackedLLM: (...args: unknown[]) => mockCreateTrackedLLM(...args),
}));

vi.mock("../../src/lib/memory.js", () => ({
    checkpointer: undefined,
}));

vi.mock("../../src/lib/safety.js", () => ({
    checkTurnLimit: (...args: unknown[]) => mockCheckTurnLimit(...args),
    isCircuitOpen: (...args: unknown[]) => mockIsCircuitOpen(...args),
    SAFETY_CONFIG: { MAX_TURNS: 25, MAX_AGENT_RETRIES: 3, AGENT_TIMEOUT_MS: 60000, SELF_LOOP_AGENTS: ["Builder"] },
}));

vi.mock("../../src/lib/logger.js", () => ({
    logger: mockLogger,
}));

vi.mock("../../src/lib/utils.js", () => ({
    formatContributorContext: (...args: unknown[]) => mockFormatContributorContext(...(args as [string[]])),
    extractUserQuery: (...args: unknown[]) => mockExtractUserQuery(...(args as [any[]])),
}));

vi.mock("../../src/lib/plugins.js", () => ({
    getPluginNames: (...args: unknown[]) => mockGetPluginNames(...args),
    getPluginRouterContext: (...args: unknown[]) => mockGetPluginRouterContext(...args),
}));

vi.mock("../../src/lib/artifact-store.js", () => ({
    createArtifactStore: vi.fn(() => ({})),
}));

// ============================================================================
// Import after mocks
// ============================================================================
import { routerNode, ruleBasedRoute, routerFallbackMetrics } from "../../src/agents/router.js";

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Setup the primary LLM mock (GPT-4o) returned by the first createTrackedLLM call
 * (module-level `const llm = createTrackedLLM("Router", ...)`)
 * and optionally a Claude fallback mock.
 */
function setupLLMMocks(opts?: {
    structuredResult?: any;
    structuredError?: Error;
    plainResult?: any;
    plainError?: Error;
    claudeResult?: any;
    claudeError?: Error;
}) {
    // Primary LLM (GPT-4o) — used at module import for `const llm`
    mockCreateTrackedLLM.mockImplementation((agentName: string) => {
        if (agentName === "Router-Fallback") {
            // Claude fallback (Level 2)
            return {
                withStructuredOutput: vi.fn(() => ({
                    invoke: opts?.claudeError
                        ? vi.fn().mockRejectedValue(opts.claudeError)
                        : vi.fn().mockResolvedValue(opts?.claudeResult ?? ROUTE_TO_BUILDER),
                })),
                invoke: vi.fn(),
            };
        }

        // Primary GPT-4o
        return {
            withStructuredOutput: vi.fn(() => ({
                invoke: opts?.structuredError
                    ? mockStructuredInvoke.mockRejectedValue(opts.structuredError)
                    : mockStructuredInvoke.mockResolvedValue(opts?.structuredResult ?? ROUTE_TO_BUILDER),
            })),
            invoke: opts?.plainError
                ? mockPlainInvoke.mockRejectedValue(opts.plainError)
                : mockPlainInvoke.mockResolvedValue(
                    opts?.plainResult ?? new AIMessage(JSON.stringify(ROUTE_TO_BUILDER))
                ),
        };
    });
}

function resetMetrics() {
    routerFallbackMetrics.level0 = 0;
    routerFallbackMetrics.level1 = 0;
    routerFallbackMetrics.level2 = 0;
    routerFallbackMetrics.level3 = 0;
    routerFallbackMetrics.total = 0;
}

// ============================================================================
// Tests
// ============================================================================

describe("Router Agent", () => {
    beforeEach(() => {
        mockStructuredInvoke.mockReset();
        mockPlainInvoke.mockReset();
        mockClaudeStructuredInvoke.mockReset();
        mockCheckTurnLimit.mockReset();
        mockIsCircuitOpen.mockReset();
        mockCreateTrackedLLM.mockReset();
        mockLogger.routingDecision.mockClear();
        mockLogger.safetyTrigger.mockClear();
        mockLogger.warn.mockClear();
        mockLogger.error.mockClear();
        mockFormatContributorContext.mockClear();
        mockExtractUserQuery.mockClear();
        mockGetPluginNames.mockReturnValue([]);
        mockGetPluginRouterContext.mockReturnValue("");

        mockCheckTurnLimit.mockReturnValue({ safe: true });
        mockIsCircuitOpen.mockReturnValue(false);

        // Default: Level 0 succeeds
        setupLLMMocks();

        resetMetrics();
    });

    // ====================================================================
    // Core Routing (Level 0 — primary path)
    // ====================================================================
    describe("Core Routing", () => {
        it("should route to Builder for code tasks", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = createBuildRequestState();

            const result = await routerNode(state);

            expect(result.next).toBe("Builder");
            expect(result.turnCount).toBe(1);
        });

        it("should route to Security for security reviews", async () => {
            setupLLMMocks({ structuredResult: MOCK_ROUTE_TO_SECURITY });
            const state = {
                ...createEmptyState(),
                messages: [new HumanMessage("Review the authentication system for vulnerabilities")],
            };

            const result = await routerNode(state);

            expect(result.next).toBe("Security");
        });

        it("should route to SRE for deployment tasks", async () => {
            setupLLMMocks({ structuredResult: MOCK_ROUTE_TO_SRE });
            const state = {
                ...createEmptyState(),
                messages: [new HumanMessage("Deploy the app to production")],
            };

            const result = await routerNode(state);

            expect(result.next).toBe("SRE");
        });

        it("should route to Reviewer after build", async () => {
            setupLLMMocks({ structuredResult: MOCK_ROUTE_TO_REVIEWER });
            const state = createMidConversationState();

            const result = await routerNode(state);

            expect(result.next).toBe("Reviewer");
        });

        it("should route to FINISH when work is complete", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_FINISH });
            const state = createMidConversationState();

            const result = await routerNode(state);

            expect(result.next).toBe("FINISH");
        });

        it("should increment turnCount on each routing", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });

            const state = { ...createEmptyState(), turnCount: 5 };
            const result = await routerNode(state);

            expect(result.turnCount).toBe(6);
        });

        it("should handle turnCount of 0 correctly", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });

            const state = createEmptyState();
            const result = await routerNode(state);

            expect(result.turnCount).toBe(1);
        });
    });

    // ====================================================================
    // Safety: Turn Limit
    // ====================================================================
    describe("Turn Limit Safety", () => {
        it("should return FINISH immediately when turn limit exceeded", async () => {
            mockCheckTurnLimit.mockReturnValue({ safe: false, reason: "Max turns exceeded" });

            const state = createMaxTurnState();
            const result = await routerNode(state);

            expect(result.next).toBe("FINISH");
            expect(mockStructuredInvoke).not.toHaveBeenCalled(); // No LLM call
        });

        it("should log safety trigger on turn limit", async () => {
            mockCheckTurnLimit.mockReturnValue({ safe: false, reason: "Max turns exceeded" });

            const state = createMaxTurnState();
            await routerNode(state);

            expect(mockLogger.safetyTrigger).toHaveBeenCalledWith(
                "MAX_TURNS exceeded",
                expect.objectContaining({ turnCount: 25 })
            );
        });

        it("should pass turnCount to checkTurnLimit", async () => {
            mockCheckTurnLimit.mockReturnValue({ safe: true });
            setupLLMMocks({ structuredResult: ROUTE_TO_FINISH });

            const state = { ...createEmptyState(), turnCount: 10 };
            await routerNode(state);

            expect(mockCheckTurnLimit).toHaveBeenCalledWith(10);
        });

        it("should handle undefined turnCount as 0", async () => {
            mockCheckTurnLimit.mockReturnValue({ safe: true });
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });

            const state = { ...createEmptyState(), turnCount: undefined as any };
            const result = await routerNode(state);

            expect(mockCheckTurnLimit).toHaveBeenCalledWith(0);
            expect(result.turnCount).toBe(1);
        });
    });

    // ====================================================================
    // Safety: Circuit Breaker
    // ====================================================================
    describe("Circuit Breaker", () => {
        it("should skip agent with open circuit and return FINISH", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            mockIsCircuitOpen.mockReturnValue(true);

            const state = createBuildRequestState();
            const result = await routerNode(state);

            expect(result.next).toBe("FINISH");
        });

        it("should log warning when circuit is open", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            mockIsCircuitOpen.mockReturnValue(true);

            const state = createBuildRequestState();
            await routerNode(state);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Circuit open for Builder")
            );
        });

        it("should NOT check circuit breaker for FINISH", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_FINISH });

            const state = createEmptyState();
            state.messages = [new HumanMessage("done")];
            await routerNode(state);

            expect(mockIsCircuitOpen).not.toHaveBeenCalled();
        });

        it("should check circuit for non-FINISH agent", async () => {
            setupLLMMocks({ structuredResult: MOCK_ROUTE_TO_SECURITY });

            const state = {
                ...createEmptyState(),
                messages: [new HumanMessage("security review")],
            };
            await routerNode(state);

            expect(mockIsCircuitOpen).toHaveBeenCalledWith("Security");
        });
    });

    // ====================================================================
    // Context Injection
    // ====================================================================
    describe("Context Injection", () => {
        it("should call formatContributorContext with contributors", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = createMidConversationState(); // has Planner, Designer

            await routerNode(state);

            expect(mockFormatContributorContext).toHaveBeenCalledWith(
                ["Planner", "Designer"]
            );
        });

        it("should handle empty contributors", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = createBuildRequestState(); // no contributors

            await routerNode(state);

            expect(mockFormatContributorContext).toHaveBeenCalledWith([]);
        });

        it("should handle undefined contributors as empty", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = { ...createEmptyState(), contributors: undefined as any };
            state.messages = [new HumanMessage("test")];

            await routerNode(state);

            expect(mockFormatContributorContext).toHaveBeenCalledWith([]);
        });

        it("should call getPluginRouterContext", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = createBuildRequestState();

            await routerNode(state);

            expect(mockGetPluginRouterContext).toHaveBeenCalled();
        });
    });

    // ====================================================================
    // Structured Logging
    // ====================================================================
    describe("Logging", () => {
        it("should log routing decisions", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = createBuildRequestState();

            await routerNode(state);

            expect(mockLogger.routingDecision).toHaveBeenCalledWith(
                "Router",
                "Builder",
                "User asked for code implementation"
            );
        });
    });

    // ====================================================================
    // Error Handling (with fallback chain)
    // ====================================================================
    describe("Error Handling", () => {
        it("should NOT crash when all LLMs fail — falls back to rule-based", async () => {
            const error = new Error("500: Internal Server Error");
            setupLLMMocks({
                structuredError: error,
                plainError: error,
                claudeError: error,
            });

            mockExtractUserQuery.mockReturnValue("build me a login page");
            const state = createBuildRequestState();

            // Should NOT throw — rule-based catches it
            const result = await routerNode(state);
            expect(result.next).toBeDefined();
            expect(result.next).not.toBe("FINISH");
        });

        it("should log error as warning for each failed level", async () => {
            const error = new Error("API key expired");
            setupLLMMocks({
                structuredError: error,
                plainError: error,
                claudeError: error,
            });
            mockExtractUserQuery.mockReturnValue("test something");

            const state = createBuildRequestState();
            await routerNode(state);

            // Should have warnings for Level 0, 1, 2
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Level 0 failed"),
                expect.any(Object)
            );
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Level 1 failed"),
                expect.any(Object)
            );
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Level 2 failed"),
                expect.any(Object)
            );
        });

        it("should not throw on error (always graceful)", async () => {
            const error = new Error("Catastrophic failure");
            setupLLMMocks({
                structuredError: error,
                plainError: error,
                claudeError: error,
            });
            mockExtractUserQuery.mockReturnValue("anything");

            const state = createBuildRequestState();

            // Should NOT throw — rule-based catches it
            await expect(routerNode(state)).resolves.toBeDefined();
        });
    });

    // ====================================================================
    // Plugin Integration
    // ====================================================================
    describe("Plugin Integration", () => {
        it("should include plugin names in route schema", async () => {
            mockGetPluginNames.mockReturnValue(["CustomPlugin"]);
            setupLLMMocks({ structuredResult: { next: "CustomPlugin", reasoning: "Plugin handles this" } });

            const state = {
                ...createEmptyState(),
                messages: [new HumanMessage("Run custom analysis")],
            };
            const result = await routerNode(state);

            expect(result.next).toBe("CustomPlugin");
        });
    });

    // ====================================================================
    // FALLBACK CHAIN
    // ====================================================================
    describe("Fallback Chain", () => {
        it("Level 0 → success: should use primary GPT-4o structured output", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = createBuildRequestState();

            const result = await routerNode(state);

            expect(result.next).toBe("Builder");
            expect(routerFallbackMetrics.level0).toBe(1);
            expect(routerFallbackMetrics.total).toBe(1);
        });

        it("Level 0 fails → Level 1 succeeds: should parse text response", async () => {
            setupLLMMocks({
                structuredError: new Error("structured output failed"),
                plainResult: new AIMessage(JSON.stringify({ next: "Security", reasoning: "text parse" })),
            });

            const state = {
                ...createEmptyState(),
                messages: [new HumanMessage("Check for vulnerabilities")],
            };

            const result = await routerNode(state);

            expect(result.next).toBe("Security");
            expect(routerFallbackMetrics.level1).toBe(1);
        });

        it("Level 0,1 fail → Level 2 succeeds: should use Claude", async () => {
            const error = new Error("OpenAI is down");
            setupLLMMocks({
                structuredError: error,
                plainError: error,
                claudeResult: { next: "Builder", reasoning: "Claude routing" },
            });

            const state = createBuildRequestState();
            const result = await routerNode(state);

            expect(result.next).toBe("Builder");
            expect(routerFallbackMetrics.level2).toBe(1);
        });

        it("Level 0,1,2 all fail → Level 3: should use rule-based routing", async () => {
            const error = new Error("All LLMs down");
            setupLLMMocks({
                structuredError: error,
                plainError: error,
                claudeError: error,
            });
            mockExtractUserQuery.mockReturnValue("deploy to production now");

            const state = {
                ...createEmptyState(),
                messages: [new HumanMessage("deploy to production now")],
            };

            const result = await routerNode(state);

            expect(result.next).toBe("SRE");
            expect(routerFallbackMetrics.level3).toBe(1);
        });

        it("should log fallback level when not primary", async () => {
            const error = new Error("OpenAI is down");
            setupLLMMocks({
                structuredError: error,
                plainError: error,
                claudeResult: { next: "Builder", reasoning: "Claude routing" },
            });

            const state = createBuildRequestState();
            await routerNode(state);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Router fallback level 2"),
                expect.objectContaining({ fallbackLevel: 2 })
            );
        });

        it("should NOT log fallback when primary succeeds", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = createBuildRequestState();

            await routerNode(state);

            // The only warn calls should NOT be about fallback levels
            const fallbackWarnCalls = mockLogger.warn.mock.calls.filter(
                (call: any) => String(call[0]).includes("Router fallback level")
            );
            expect(fallbackWarnCalls).toHaveLength(0);
        });

        it("should track cumulative metrics", async () => {
            setupLLMMocks({ structuredResult: ROUTE_TO_BUILDER });
            const state = createBuildRequestState();

            await routerNode(state);
            await routerNode(state);
            await routerNode(state);

            expect(routerFallbackMetrics.level0).toBe(3);
            expect(routerFallbackMetrics.total).toBe(3);
        });

        it("Level 1 should parse JSON from markdown code block", async () => {
            setupLLMMocks({
                structuredError: new Error("structured failed"),
                plainResult: new AIMessage('```json\n{"next": "Planner", "reasoning": "needs architecture"}\n```'),
            });

            const state = {
                ...createEmptyState(),
                messages: [new HumanMessage("plan the system architecture")],
            };

            const result = await routerNode(state);

            expect(result.next).toBe("Planner");
            expect(routerFallbackMetrics.level1).toBe(1);
        });

        it("Level 1 should fail gracefully on invalid JSON", async () => {
            setupLLMMocks({
                structuredError: new Error("structured failed"),
                plainResult: new AIMessage("I think you should use the Builder agent"),
                claudeResult: { next: "Builder", reasoning: "Claude to the rescue" },
            });

            const state = createBuildRequestState();
            const result = await routerNode(state);

            // Should fall through to Level 2 (Claude)
            expect(result.next).toBe("Builder");
            expect(routerFallbackMetrics.level2).toBe(1);
        });
    });

    // ====================================================================
    // RULE-BASED ROUTING (Level 3)
    // ====================================================================
    describe("Rule-Based Routing", () => {
        it("should route 'build' keywords to Builder", () => {
            expect(ruleBasedRoute("build me a login page").next).toBe("Builder");
            expect(ruleBasedRoute("implement the auth system").next).toBe("Builder");
            expect(ruleBasedRoute("create a new component").next).toBe("Builder");
            expect(ruleBasedRoute("scaffold the project").next).toBe("Builder");
        });

        it("should route 'design' keywords to Designer", () => {
            expect(ruleBasedRoute("design the landing page").next).toBe("Designer");
            expect(ruleBasedRoute("create a UI mockup").next).toBe("Designer");
            expect(ruleBasedRoute("improve the UX flow").next).toBe("Designer");
        });

        it("should route 'security' keywords to Security", () => {
            expect(ruleBasedRoute("check for security vulnerabilities").next).toBe("Security");
            expect(ruleBasedRoute("run a threat model analysis").next).toBe("Security");
            expect(ruleBasedRoute("audit the codebase").next).toBe("Security");
        });

        it("should route 'deploy' keywords to SRE", () => {
            expect(ruleBasedRoute("deploy to production").next).toBe("SRE");
            expect(ruleBasedRoute("ship this release").next).toBe("SRE");
            expect(ruleBasedRoute("set up the CI/CD pipeline").next).toBe("SRE");
        });

        it("should route 'test' keywords to Tester", () => {
            expect(ruleBasedRoute("test the login flow").next).toBe("Tester");
            expect(ruleBasedRoute("write QA test cases").next).toBe("Tester");
            expect(ruleBasedRoute("check for regression bugs").next).toBe("Tester");
        });

        it("should route 'review' keywords to Reviewer", () => {
            expect(ruleBasedRoute("review my PR").next).toBe("Reviewer");
            expect(ruleBasedRoute("do a code review").next).toBe("Reviewer");
        });

        it("should route 'docs' keywords to TechWriter", () => {
            expect(ruleBasedRoute("write the documentation").next).toBe("TechWriter");
            expect(ruleBasedRoute("update the README").next).toBe("TechWriter");
        });

        it("should route 'plan' keywords to Planner", () => {
            expect(ruleBasedRoute("plan the system architecture").next).toBe("Planner");
            expect(ruleBasedRoute("write a tech spec").next).toBe("Planner");
        });

        it("should default to ProductManager for unknown queries", () => {
            const result = ruleBasedRoute("I need help with something");
            expect(result.next).toBe("ProductManager");
            expect(result.reasoning).toContain("safe default");
        });

        it("should be case-insensitive", () => {
            expect(ruleBasedRoute("BUILD a React App").next).toBe("Builder");
            expect(ruleBasedRoute("DEPLOY to PRODUCTION").next).toBe("SRE");
            expect(ruleBasedRoute("Security AUDIT").next).toBe("Security");
        });

        it("should include reasoning in every result", () => {
            const result = ruleBasedRoute("build something");
            expect(result.reasoning).toBeDefined();
            expect(result.reasoning.length).toBeGreaterThan(0);
            expect(result.reasoning).toContain("rule-based fallback");
        });
    });

    // ====================================================================
    // FALLBACK METRICS
    // ====================================================================
    describe("Fallback Metrics", () => {
        it("should expose metrics object with all levels", () => {
            expect(routerFallbackMetrics).toHaveProperty("level0");
            expect(routerFallbackMetrics).toHaveProperty("level1");
            expect(routerFallbackMetrics).toHaveProperty("level2");
            expect(routerFallbackMetrics).toHaveProperty("level3");
            expect(routerFallbackMetrics).toHaveProperty("total");
        });

        it("should start at zero", () => {
            expect(routerFallbackMetrics.level0).toBe(0);
            expect(routerFallbackMetrics.level1).toBe(0);
            expect(routerFallbackMetrics.level2).toBe(0);
            expect(routerFallbackMetrics.level3).toBe(0);
            expect(routerFallbackMetrics.total).toBe(0);
        });
    });
});
