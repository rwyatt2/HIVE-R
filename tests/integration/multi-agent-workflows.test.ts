/**
 * Integration Tests: Multi-Agent Workflows
 *
 * Tests complete user journeys through the real StateGraph, mocking agent
 * node functions and LLM calls. Each test starts from a user message and
 * traces through multiple agent handoffs, verifying context flow between agents.
 *
 * Strategy:
 *   - Use the real graph topology (StateGraph with conditional edges)
 *   - Mock each agent's node function to return controlled state updates
 *   - Mock the Router's LLM to drive deterministic routing sequences
 *   - Verify: contributors, message ordering, artifacts, turn counts
 *
 * Workflows:
 *   1. "Build a simple React app" — Founder → PM → Planner → Builder
 *   2. "Review this code for security issues" — Security → Reviewer
 *   3. "Deploy this to production" — SRE → Security
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Workflow fixtures
import * as BuildReactApp from "../fixtures/workflows/build-react-app.js";
import * as SecurityReview from "../fixtures/workflows/security-review.js";
import * as DeployToProd from "../fixtures/workflows/deploy-to-production.js";

// ============================================================================
// MOCK INFRASTRUCTURE
// ============================================================================

const mocks = vi.hoisted(() => {
    // Router structured output mock
    const routerInvoke = vi.fn();

    // Per-agent node function mocks
    const founderNode = vi.fn();
    const productManagerNode = vi.fn();
    const plannerNode = vi.fn();
    const builderNode = vi.fn();
    const securityNode = vi.fn();
    const reviewerNode = vi.fn();
    const sreNode = vi.fn();

    // Generic fallback agents
    const uxResearcherNode = vi.fn();
    const designerNode = vi.fn();
    const accessibilityNode = vi.fn();
    const testerNode = vi.fn();
    const techWriterNode = vi.fn();
    const dataAnalystNode = vi.fn();

    return {
        routerInvoke,
        founderNode,
        productManagerNode,
        plannerNode,
        builderNode,
        securityNode,
        reviewerNode,
        sreNode,
        uxResearcherNode,
        designerNode,
        accessibilityNode,
        testerNode,
        techWriterNode,
        dataAnalystNode,
    };
});

// --- Mock Agent Modules ---
// Each agent module is mocked so we control exactly what state updates they return.
// Crucially, every agent returns `next: "Router"` to prevent stale routing loops.

vi.mock("../../src/agents/founder.js", () => ({
    founderNode: (...args: unknown[]) => mocks.founderNode(...args),
}));

vi.mock("../../src/agents/product-manager.js", () => ({
    productManagerNode: (...args: unknown[]) => mocks.productManagerNode(...args),
}));

vi.mock("../../src/agents/planner.js", () => ({
    plannerNode: (...args: unknown[]) => mocks.plannerNode(...args),
}));

vi.mock("../../src/agents/builder.js", () => ({
    builderNode: (...args: unknown[]) => mocks.builderNode(...args),
}));

vi.mock("../../src/agents/security.js", () => ({
    securityNode: (...args: unknown[]) => mocks.securityNode(...args),
}));

vi.mock("../../src/agents/reviewer.js", () => ({
    reviewerNode: (...args: unknown[]) => mocks.reviewerNode(...args),
}));

vi.mock("../../src/agents/sre.js", () => ({
    sreNode: (...args: unknown[]) => mocks.sreNode(...args),
}));

vi.mock("../../src/agents/tester.js", () => ({
    testerNode: (...args: unknown[]) => mocks.testerNode(...args),
}));

vi.mock("../../src/agents/ux-researcher.js", () => ({
    uxResearcherNode: (...args: unknown[]) => mocks.uxResearcherNode(...args),
}));

vi.mock("../../src/agents/designer.js", () => ({
    designerNode: (...args: unknown[]) => mocks.designerNode(...args),
}));

vi.mock("../../src/agents/accessibility.js", () => ({
    accessibilityNode: (...args: unknown[]) => mocks.accessibilityNode(...args),
}));

vi.mock("../../src/agents/tech-writer.js", () => ({
    techWriterNode: (...args: unknown[]) => mocks.techWriterNode(...args),
}));

vi.mock("../../src/agents/data-analyst.js", () => ({
    dataAnalystNode: (...args: unknown[]) => mocks.dataAnalystNode(...args),
}));

// --- Mock Router ---
// The router uses createTrackedLLM to get an LLM and calls withStructuredOutput
vi.mock("../../src/middleware/cost-tracking.js", () => ({
    createTrackedLLM: vi.fn(() => ({
        withStructuredOutput: vi.fn(() => ({
            invoke: mocks.routerInvoke,
        })),
        invoke: vi.fn(),
    })),
}));

// --- Mock Supporting Modules ---

vi.mock("../../src/lib/memory.js", () => ({
    checkpointer: undefined,
}));

vi.mock("../../src/lib/safety.js", () => ({
    checkTurnLimit: vi.fn(() => ({ safe: true })),
    isCircuitOpen: vi.fn(() => false),
    SAFETY_CONFIG: { MAX_TURNS: 25, MAX_AGENT_RETRIES: 3, AGENT_TIMEOUT_MS: 60000, SELF_LOOP_AGENTS: ["Builder"] },
    circuitBreaker: { recordSuccess: vi.fn(), recordFailure: vi.fn() },
}));

vi.mock("../../src/lib/logger.js", () => ({
    logger: {
        info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
        routingDecision: vi.fn(), safetyTrigger: vi.fn(),
    },
}));

vi.mock("../../src/lib/plugins.js", () => ({
    getPluginRouterContext: vi.fn(() => ""),
    getPluginNames: vi.fn(() => []),
}));

vi.mock("../../src/lib/utils.js", () => ({
    formatContributorContext: vi.fn((contributors: string[]) =>
        contributors.length ? `\nContributors: ${contributors.join(", ")}` : ""
    ),
    safeAgentCall: vi.fn(async (fn: () => Promise<unknown>) => fn()),
    createAgentResponse: vi.fn(),
    extractUserQuery: vi.fn((messages: unknown[]) => "user query"),
}));

vi.mock("../../src/lib/design-system.js", () => ({
    getDesignContext: vi.fn(() => ""),
    getActiveFramework: vi.fn(() => null),
}));

vi.mock("../../src/lib/production-standards.js", () => ({
    getStandardsForAgent: vi.fn(() => ""),
}));

vi.mock("../../src/lib/artifact-store.js", () => ({
    createArtifactStore: vi.fn(() => ({
        prd: null, designSpec: null, techPlan: null,
        securityReview: null, testPlan: null, codeReview: null,
        producers: {}, timestamps: {},
    })),
}));

vi.mock("../../src/lib/cost-tracker.js", () => ({
    initCostTrackingTable: vi.fn(),
    getDailyCost: vi.fn(() => ({ totalCost: 0, callCount: 0 })),
}));

vi.mock("../../src/lib/semantic-memory.js", () => ({
    initSemanticMemory: vi.fn(async () => { }),
    searchMemories: vi.fn(async () => []),
    storeMemory: vi.fn(async () => { }),
    getSemanticMemoryStats: vi.fn(() => ({})),
    isSemanticMemoryEnabled: vi.fn(() => false),
}));

vi.mock("../../src/tools/delegate.js", () => ({
    delegateTask: vi.fn(),
}));

vi.mock("../../src/tools/files.js", () => ({
    readFileTool: { invoke: vi.fn(), name: "read_file" },
    writeFileTool: { invoke: vi.fn(), name: "write_file" },
    listDirectoryTool: { invoke: vi.fn(), name: "list_directory" },
    fileTools: [],
}));

vi.mock("../../src/tools/testing.js", () => ({
    runCommandTool: { invoke: vi.fn(), name: "run_command" },
    runTestsTool: { invoke: vi.fn(), name: "run_tests" },
}));

vi.mock("../../src/tools/github.js", () => ({
    githubTools: [],
    createBranchTool: { invoke: vi.fn(), name: "create_branch" },
    commitAndPushTool: { invoke: vi.fn(), name: "commit_and_push" },
    gitStatusTool: { invoke: vi.fn(), name: "git_status" },
    createPullRequestTool: { invoke: vi.fn(), name: "create_pull_request" },
    listPullRequestsTool: { invoke: vi.fn(), name: "list_pull_requests" },
}));

// ============================================================================
// IMPORT GRAPH AFTER MOCKS
// ============================================================================

import { workflow } from "../../src/graph.js";

const testGraph = workflow.compile({ checkpointer: undefined });
const INVOKE_CONFIG = { recursionLimit: 50 };

// ============================================================================
// HELPERS
// ============================================================================

function createInitialState(userMessage: string) {
    return { messages: [new HumanMessage(userMessage)] };
}

function setupRouterSequence(decisions: Array<{ next: string; reasoning: string }>) {
    for (const decision of decisions) {
        mocks.routerInvoke.mockResolvedValueOnce(decision);
    }
}

/**
 * Create a mock agent response that explicitly resets `next` to "Router".
 * This prevents the stale-next routing loop in createAgentRouter.
 */
function agentResponse(agentName: string, content: string, extras?: Record<string, unknown>) {
    return {
        messages: [new HumanMessage({ content, name: agentName })],
        contributors: [agentName],
        next: "Router",
        ...extras,
    };
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Multi-Agent Workflow Integration Tests", () => {

    beforeEach(() => {
        Object.values(mocks).forEach(mock => mock.mockReset());

        // Set default generic responses for agents not in current workflow
        const genericAgents = [
            "uxResearcherNode", "designerNode", "accessibilityNode",
            "testerNode", "techWriterNode", "dataAnalystNode",
        ] as const;
        for (const agent of genericAgents) {
            mocks[agent].mockResolvedValue(
                agentResponse(agent.replace("Node", ""), "Generic response")
            );
        }
    });

    // ========================================================================
    // WORKFLOW 1: Build a React App
    // ========================================================================

    describe("Workflow: Build a Simple React App", () => {

        function setupBuildWorkflow() {
            setupRouterSequence(BuildReactApp.ROUTER_DECISIONS);

            mocks.founderNode.mockResolvedValue(
                agentResponse("Founder", BuildReactApp.FOUNDER_RESPONSE.content)
            );

            mocks.productManagerNode.mockResolvedValue(
                agentResponse("ProductManager", JSON.stringify(BuildReactApp.PM_PRD_ARTIFACT), {
                    artifacts: [BuildReactApp.PM_PRD_ARTIFACT],
                })
            );

            mocks.plannerNode.mockResolvedValue(
                agentResponse("Planner", JSON.stringify(BuildReactApp.PLANNER_TECHPLAN_ARTIFACT), {
                    artifacts: [BuildReactApp.PLANNER_TECHPLAN_ARTIFACT],
                })
            );

            mocks.builderNode.mockResolvedValue(
                agentResponse("Builder", "React app scaffolded: App.tsx, Nav.tsx created. Build succeeded.", {
                    needsRetry: false,
                })
            );
        }

        it("should route through Founder → PM → Planner → Builder → FINISH", async () => {
            setupBuildWorkflow();

            const result = await testGraph.invoke(
                createInitialState(BuildReactApp.USER_MESSAGE),
                { configurable: { thread_id: "test-build-1" }, ...INVOKE_CONFIG }
            );

            expect(mocks.routerInvoke).toHaveBeenCalledTimes(BuildReactApp.EXPECTED_ROUTER_CALLS);
            expect(mocks.founderNode).toHaveBeenCalledTimes(1);
            expect(mocks.productManagerNode).toHaveBeenCalledTimes(1);
            expect(mocks.plannerNode).toHaveBeenCalledTimes(1);
            expect(mocks.builderNode).toHaveBeenCalledTimes(1);
        }, 30000);

        it("should accumulate all expected contributors", async () => {
            setupBuildWorkflow();

            const result = await testGraph.invoke(
                createInitialState(BuildReactApp.USER_MESSAGE),
                { configurable: { thread_id: "test-build-2" }, ...INVOKE_CONFIG }
            );

            for (const agent of BuildReactApp.EXPECTED_CONTRIBUTORS) {
                expect(result.contributors).toContain(agent);
            }
        }, 30000);

        it("should have messages from each contributing agent", async () => {
            setupBuildWorkflow();

            const result = await testGraph.invoke(
                createInitialState(BuildReactApp.USER_MESSAGE),
                { configurable: { thread_id: "test-build-3" }, ...INVOKE_CONFIG }
            );

            // Original user message + at least one per agent
            expect(result.messages.length).toBeGreaterThanOrEqual(1 + BuildReactApp.EXPECTED_AGENT_COUNT);

            const messageNames = result.messages
                .filter((m: any) => m.name)
                .map((m: any) => m.name);

            for (const agent of BuildReactApp.EXPECTED_CONTRIBUTORS) {
                expect(messageNames).toContain(agent);
            }
        }, 30000);

        it("should produce structured artifacts from PM and Planner", async () => {
            setupBuildWorkflow();

            const result = await testGraph.invoke(
                createInitialState(BuildReactApp.USER_MESSAGE),
                { configurable: { thread_id: "test-build-4" }, ...INVOKE_CONFIG }
            );

            const artifactTypes = result.artifacts.map((a: any) => a.type);
            expect(artifactTypes).toContain("PRD");
            expect(artifactTypes).toContain("TechPlan");
        }, 30000);

        it("should increment turn count across agent hops", async () => {
            setupBuildWorkflow();

            const result = await testGraph.invoke(
                createInitialState(BuildReactApp.USER_MESSAGE),
                { configurable: { thread_id: "test-build-5" }, ...INVOKE_CONFIG }
            );

            expect(result.turnCount).toBeGreaterThanOrEqual(BuildReactApp.EXPECTED_ROUTER_CALLS);
        }, 30000);
    });

    // ========================================================================
    // WORKFLOW 2: Security Review
    // ========================================================================

    describe("Workflow: Security Code Review", () => {

        function setupSecurityWorkflow() {
            setupRouterSequence(SecurityReview.ROUTER_DECISIONS);

            // Security returns formatted content + artifact
            const formatted = `# ${SecurityReview.SECURITY_REVIEW_ARTIFACT.title}\n\n## Threat Model\n${SecurityReview.SECURITY_REVIEW_ARTIFACT.threatModel.map(t => `### ${t.threat}\n- **Attack Vector**: ${t.attackVector}\n- **Impact**: ${t.impact.toUpperCase()}\n`).join("")}\n\n## Vulnerabilities\n${SecurityReview.SECURITY_REVIEW_ARTIFACT.vulnerabilities.map(v => `### ${v.id}: ${v.description} [${v.severity.toUpperCase()}]\n**Recommendation**: ${v.recommendation}\n`).join("")}`;

            mocks.securityNode.mockResolvedValue(
                agentResponse("Security", formatted, {
                    artifacts: [SecurityReview.SECURITY_REVIEW_ARTIFACT],
                })
            );

            const reviewFormatted = `# Code Review\n\n**Verdict**: ${SecurityReview.CODE_REVIEW_ARTIFACT.verdict.toUpperCase().replace("_", " ")}\n\n${SecurityReview.CODE_REVIEW_ARTIFACT.summary}\n\n## Must Fix\n${SecurityReview.CODE_REVIEW_ARTIFACT.mustFix.map(f => `- **${f.location}**: ${f.issue}`).join("\n")}`;

            mocks.reviewerNode.mockResolvedValue(
                agentResponse("Reviewer", reviewFormatted, {
                    artifacts: [SecurityReview.CODE_REVIEW_ARTIFACT],
                })
            );
        }

        it("should route through Security → Reviewer → FINISH", async () => {
            setupSecurityWorkflow();

            const result = await testGraph.invoke(
                createInitialState(SecurityReview.USER_MESSAGE),
                { configurable: { thread_id: "test-sec-1" }, ...INVOKE_CONFIG }
            );

            expect(mocks.routerInvoke).toHaveBeenCalledTimes(SecurityReview.EXPECTED_ROUTER_CALLS);
            expect(mocks.securityNode).toHaveBeenCalledTimes(1);
            expect(mocks.reviewerNode).toHaveBeenCalledTimes(1);

            for (const agent of SecurityReview.EXPECTED_CONTRIBUTORS) {
                expect(result.contributors).toContain(agent);
            }
        }, 30000);

        it("should produce SecurityReview and CodeReview artifacts", async () => {
            setupSecurityWorkflow();

            const result = await testGraph.invoke(
                createInitialState(SecurityReview.USER_MESSAGE),
                { configurable: { thread_id: "test-sec-2" }, ...INVOKE_CONFIG }
            );

            const artifactTypes = result.artifacts.map((a: any) => a.type);
            expect(artifactTypes).toContain("SecurityReview");
            expect(artifactTypes).toContain("CodeReview");
        }, 30000);

        it("should include security findings in message content", async () => {
            setupSecurityWorkflow();

            const result = await testGraph.invoke(
                createInitialState(SecurityReview.USER_MESSAGE),
                { configurable: { thread_id: "test-sec-3" }, ...INVOKE_CONFIG }
            );

            const securityMessages = result.messages.filter((m: any) => m.name === "Security");
            expect(securityMessages.length).toBeGreaterThanOrEqual(1);

            const content = securityMessages[0].content as string;
            expect(content).toContain("Threat Model");
            expect(content).toContain("VULN-001");
        }, 30000);

        it("should include reviewer verdict in response", async () => {
            setupSecurityWorkflow();

            const result = await testGraph.invoke(
                createInitialState(SecurityReview.USER_MESSAGE),
                { configurable: { thread_id: "test-sec-4" }, ...INVOKE_CONFIG }
            );

            const reviewMessages = result.messages.filter((m: any) => m.name === "Reviewer");
            expect(reviewMessages.length).toBeGreaterThanOrEqual(1);

            const content = reviewMessages[0].content as string;
            expect(content).toContain("REQUEST CHANGES");
        }, 30000);
    });

    // ========================================================================
    // WORKFLOW 3: Deploy to Production
    // ========================================================================

    describe("Workflow: Deploy to Production", () => {

        function setupDeployWorkflow() {
            setupRouterSequence(DeployToProd.ROUTER_DECISIONS);

            mocks.sreNode.mockResolvedValue(
                agentResponse("SRE", DeployToProd.SRE_RESPONSE.content)
            );

            const secFormatted = `# ${DeployToProd.SECURITY_REVIEW_ARTIFACT.title}\n\n## Production Security Assessment\n${DeployToProd.SECURITY_REVIEW_ARTIFACT.vulnerabilities.map(v => `- ${v.id}: ${v.description} [${v.severity}]`).join("\n")}`;

            mocks.securityNode.mockResolvedValue(
                agentResponse("Security", secFormatted, {
                    artifacts: [DeployToProd.SECURITY_REVIEW_ARTIFACT],
                })
            );
        }

        it("should route through SRE → Security → FINISH", async () => {
            setupDeployWorkflow();

            const result = await testGraph.invoke(
                createInitialState(DeployToProd.USER_MESSAGE),
                { configurable: { thread_id: "test-deploy-1" }, ...INVOKE_CONFIG }
            );

            expect(mocks.routerInvoke).toHaveBeenCalledTimes(DeployToProd.EXPECTED_ROUTER_CALLS);
            expect(mocks.sreNode).toHaveBeenCalledTimes(1);
            expect(mocks.securityNode).toHaveBeenCalledTimes(1);

            for (const agent of DeployToProd.EXPECTED_CONTRIBUTORS) {
                expect(result.contributors).toContain(agent);
            }
        }, 30000);

        it("should have SRE deployment plan before security review", async () => {
            setupDeployWorkflow();

            const result = await testGraph.invoke(
                createInitialState(DeployToProd.USER_MESSAGE),
                { configurable: { thread_id: "test-deploy-2" }, ...INVOKE_CONFIG }
            );

            const sreIdx = result.messages.findIndex((m: any) => m.name === "SRE");
            const secIdx = result.messages.findIndex((m: any) => m.name === "Security");

            expect(sreIdx).toBeGreaterThan(-1);
            expect(secIdx).toBeGreaterThan(-1);
            expect(sreIdx).toBeLessThan(secIdx);
        }, 30000);

        it("should produce SecurityReview artifact for deployment", async () => {
            setupDeployWorkflow();

            const result = await testGraph.invoke(
                createInitialState(DeployToProd.USER_MESSAGE),
                { configurable: { thread_id: "test-deploy-3" }, ...INVOKE_CONFIG }
            );

            const securityArtifacts = result.artifacts.filter(
                (a: any) => a.type === "SecurityReview"
            );
            expect(securityArtifacts.length).toBeGreaterThanOrEqual(1);
            expect(securityArtifacts[0].title).toContain("Production Deployment");
        }, 30000);

        it("should terminate with FINISH after security clearance", async () => {
            setupDeployWorkflow();

            const result = await testGraph.invoke(
                createInitialState(DeployToProd.USER_MESSAGE),
                { configurable: { thread_id: "test-deploy-4" }, ...INVOKE_CONFIG }
            );

            // Graph completed without hanging — FINISH was the terminal routing decision
            expect(result.next).toBe("FINISH");
        }, 30000);
    });

    // ========================================================================
    // ERROR & EDGE CASES
    // ========================================================================

    describe("Error & Edge Cases", () => {

        it("should handle agent failure mid-workflow gracefully", async () => {
            setupRouterSequence([
                { next: "Security", reasoning: "Security review needed" },
                { next: "Reviewer", reasoning: "Need code review" },
                { next: "FINISH", reasoning: "Complete" },
            ]);

            // Security fails with an error — but still returns a message
            mocks.securityNode.mockResolvedValue(
                agentResponse("Security", "**[Security Error]**: Error during security review. LLM service unavailable")
            );

            mocks.reviewerNode.mockResolvedValue(
                agentResponse("Reviewer", "Code review completed with findings.", {
                    artifacts: [SecurityReview.CODE_REVIEW_ARTIFACT],
                })
            );

            const result = await testGraph.invoke(
                createInitialState("Review this code for security"),
                { configurable: { thread_id: "test-error-1" }, ...INVOKE_CONFIG }
            );

            expect(result).toBeDefined();
            expect(result.messages.length).toBeGreaterThanOrEqual(2);

            // Security error message should be present
            const securityMessages = result.messages.filter((m: any) => m.name === "Security");
            expect(securityMessages.length).toBeGreaterThanOrEqual(1);
            expect(securityMessages[0].content).toContain("Error");

            // Reviewer still ran after Security error
            expect(mocks.reviewerNode).toHaveBeenCalledTimes(1);
        }, 30000);

        it("should respect turn limits during long workflows", async () => {
            const { checkTurnLimit } = await import("../../src/lib/safety.js");
            const mockTurnLimit = checkTurnLimit as unknown as ReturnType<typeof vi.fn>;

            // Allow first 2 turns, then report unsafe
            mockTurnLimit
                .mockReturnValueOnce({ safe: true })   // Router turn 1
                .mockReturnValueOnce({ safe: true })   // Router turn 2
                .mockReturnValue({ safe: false, reason: "MAX_TURNS exceeded" });

            // Router would try to go deeper, but turn limit forces FINISH
            mocks.routerInvoke
                .mockResolvedValueOnce({ next: "Security", reasoning: "Start" })
                .mockResolvedValue({ next: "FINISH", reasoning: "Turn limit reached" });

            mocks.securityNode.mockResolvedValue(
                agentResponse("Security", "Security analysis complete.", {
                    artifacts: [SecurityReview.SECURITY_REVIEW_ARTIFACT],
                })
            );

            const result = await testGraph.invoke(
                createInitialState("Run a comprehensive security audit"),
                { configurable: { thread_id: "test-turnlimit-1" }, ...INVOKE_CONFIG }
            );

            expect(result).toBeDefined();
            expect(result.next).toBe("FINISH");
        }, 30000);
    });
});
