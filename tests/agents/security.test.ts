/**
 * Security Agent — Unit Tests
 *
 * The Security agent produces structured SecurityReview artifacts with
 * threat models, vulnerabilities, and compliance notes. Tests cover:
 *   - Structured output generation (SecurityReviewSchema)
 *   - Threat model formatting
 *   - Vulnerability formatting
 *   - Artifact emission
 *   - Graceful error handling
 *   - Response structure validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
    createEmptyState,
    LLM_TIMEOUT_ERROR,
    LLM_AUTH_ERROR,
} from "../fixtures/agent-responses.js";
import {
    MOCK_SECURITY_REVIEW,
    MOCK_SECURITY_REVIEW_MINIMAL,
} from "../fixtures/llm-responses.js";

// ============================================================================
// Persistent mock references
// ============================================================================
const mockSecurityInvoke = vi.fn();

// ============================================================================
// Mock all dependencies
// ============================================================================
vi.mock("../../src/middleware/cost-tracking.js", () => ({
    createTrackedLLM: vi.fn(() => ({
        withStructuredOutput: vi.fn(() => ({
            invoke: mockSecurityInvoke,
        })),
        invoke: vi.fn(),
        bindTools: vi.fn(() => ({
            invoke: vi.fn(),
        })),
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

vi.mock("../../src/lib/plugins.js", () => ({
    getPluginNames: vi.fn(() => []),
    getPluginRouterContext: vi.fn(() => ""),
}));

vi.mock("../../src/lib/utils.js", () => ({
    formatContributorContext: vi.fn(() => ""),
}));

vi.mock("../../src/lib/artifact-store.js", () => ({
    createArtifactStore: vi.fn(() => ({})),
}));

vi.mock("../../src/tools/files.js", () => ({
    writeFileTool: { invoke: vi.fn() },
    readFileTool: { invoke: vi.fn() },
    listFilesTool: { invoke: vi.fn() },
    runCommandTool: { invoke: vi.fn() },
    fileTools: [],
}));

vi.mock("../../src/tools/testing.js", () => ({
    runCommandTool: { invoke: vi.fn() },
    runTestsTool: { invoke: vi.fn() },
    testTools: [],
}));

vi.mock("../../src/lib/design-system.js", () => ({
    getDesignSystemContext: vi.fn(() => ""),
}));

vi.mock("../../src/lib/production-standards.js", () => ({
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
import { securityNode } from "../../src/agents/security.js";

// ============================================================================
// Helpers
// ============================================================================
function createSecurityRequestState() {
    return {
        ...createEmptyState(),
        messages: [
            new HumanMessage("Review the authentication system for vulnerabilities and create a threat model"),
        ],
    };
}

// ============================================================================
// Tests
// ============================================================================

describe("Security Agent", () => {
    beforeEach(() => {
        mockSecurityInvoke.mockReset();
    });

    // ====================================================================
    // Structured Output
    // ====================================================================
    describe("Structured Output (SecurityReview)", () => {
        it("should produce a SecurityReview artifact", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.artifacts).toHaveLength(1);
            expect(result.artifacts![0].type).toBe("SecurityReview");
        });

        it("should include title in artifact", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.artifacts![0].title).toBe("Security Review: User Authentication");
        });

        it("should include threat model in artifact", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.artifacts![0].threatModel).toHaveLength(2);
            expect(result.artifacts![0].threatModel[0].threat).toBe("Brute force login attacks");
        });

        it("should include vulnerabilities in artifact", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.artifacts![0].vulnerabilities).toHaveLength(2);
            expect(result.artifacts![0].vulnerabilities[0].id).toBe("VULN-001");
        });
    });

    // ====================================================================
    // Formatted Message
    // ====================================================================
    describe("Formatted Message Output", () => {
        it("should format threat model as markdown", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("# Security Review: User Authentication");
            expect(content).toContain("## Threat Model");
            expect(content).toContain("Brute force login attacks");
            expect(content).toContain("**Attack Vector**");
            expect(content).toContain("**Impact**: HIGH");
        });

        it("should format vulnerabilities as markdown", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("## Vulnerabilities");
            expect(content).toContain("VULN-001");
            expect(content).toContain("CRITICAL");
            expect(content).toContain("**Recommendation**");
        });

        it("should format security requirements as list", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("## Security Requirements");
            expect(content).toContain("- Implement bcrypt password hashing");
        });

        it("should format compliance notes as list", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("## Compliance Notes");
            expect(content).toContain("GDPR");
        });

        it("should set message name to Security", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.messages[0].name).toBe("Security");
        });
    });

    // ====================================================================
    // Minimal Review (edge case)
    // ====================================================================
    describe("Minimal Review", () => {
        it("should handle review with no vulnerabilities", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW_MINIMAL);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.artifacts![0].vulnerabilities).toHaveLength(0);
        });

        it("should handle review with empty compliance notes", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW_MINIMAL);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.artifacts![0].complianceNotes).toHaveLength(0);
        });
    });

    // ====================================================================
    // Contributors
    // ====================================================================
    describe("Contributors", () => {
        it("should always return Security as contributor", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.contributors).toEqual(["Security"]);
        });
    });

    // ====================================================================
    // Error Handling
    // ====================================================================
    describe("Error Handling", () => {
        it("should return error message on LLM failure", async () => {
            mockSecurityInvoke.mockRejectedValue(LLM_TIMEOUT_ERROR);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            const content = result.messages[0].content as string;
            expect(content).toContain("[Security Error]");
            expect(content).toContain("timeout");
        });

        it("should still return contributor on error", async () => {
            mockSecurityInvoke.mockRejectedValue(LLM_AUTH_ERROR);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.contributors).toEqual(["Security"]);
        });

        it("should not emit artifact on error", async () => {
            mockSecurityInvoke.mockRejectedValue(new Error("API error"));
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.artifacts).toBeUndefined();
        });

        it("should not throw on error (always graceful)", async () => {
            mockSecurityInvoke.mockRejectedValue(new Error("Catastrophic"));
            const state = createSecurityRequestState();

            await expect(securityNode(state)).resolves.toBeDefined();
        });

        it("should handle non-Error objects in catch", async () => {
            mockSecurityInvoke.mockRejectedValue("string error");
            const state = createSecurityRequestState();

            const result = await securityNode(state);
            const content = result.messages[0].content as string;

            expect(content).toContain("[Security Error]");
            expect(content).toContain("Unknown error");
        });
    });

    // ====================================================================
    // Message Structure
    // ====================================================================
    describe("Response Structure", () => {
        it("should always return exactly one message", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.messages).toHaveLength(1);
        });

        it("should return HumanMessage type", async () => {
            mockSecurityInvoke.mockResolvedValue(MOCK_SECURITY_REVIEW);
            const state = createSecurityRequestState();

            const result = await securityNode(state);

            expect(result.messages[0]).toBeInstanceOf(HumanMessage);
        });
    });
});
