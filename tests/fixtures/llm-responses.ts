/**
 * Shared LLM Response Fixtures for Agent Tests
 *
 * Realistic mock responses that match the Zod schemas used by each agent.
 * Keeps agent test files focused on behavior, not data construction.
 */

// ============================================================================
// Security Agent — SecurityReview structured output
// ============================================================================

export const MOCK_SECURITY_REVIEW = {
    type: "SecurityReview" as const,
    title: "Security Review: User Authentication",
    threatModel: [
        {
            threat: "Brute force login attacks",
            attackVector: "Automated credential stuffing via login endpoint",
            impact: "high" as const,
            likelihood: "high" as const,
        },
        {
            threat: "Session hijacking",
            attackVector: "XSS to steal session token from cookies",
            impact: "critical" as const,
            likelihood: "medium" as const,
        },
    ],
    vulnerabilities: [
        {
            id: "VULN-001",
            description: "No rate limiting on login endpoint",
            severity: "high" as const,
            recommendation: "Implement rate limiting with express-rate-limit (max 5 attempts per minute)",
        },
        {
            id: "VULN-002",
            description: "Session tokens stored in localStorage",
            severity: "critical" as const,
            recommendation: "Use httpOnly secure cookies instead of localStorage",
        },
    ],
    requirements: [
        "Implement bcrypt password hashing with cost factor 12",
        "Add CSRF protection on all state-changing endpoints",
        "Enable Content-Security-Policy headers",
    ],
    complianceNotes: [
        "GDPR: Ensure password storage meets Article 32 encryption requirements",
        "OWASP: Addresses A02:2021 Cryptographic Failures",
    ],
};

/** Minimal valid SecurityReview for edge case tests */
export const MOCK_SECURITY_REVIEW_MINIMAL = {
    type: "SecurityReview" as const,
    title: "Security Review: Simple Feature",
    threatModel: [
        {
            threat: "Low risk",
            attackVector: "N/A",
            impact: "low" as const,
            likelihood: "low" as const,
        },
    ],
    vulnerabilities: [],
    requirements: ["Basic input validation"],
    complianceNotes: [],
};

// ============================================================================
// Tester Agent — TestPlan structured output
// ============================================================================

export const MOCK_TEST_PLAN = {
    type: "TestPlan" as const,
    title: "Test Plan: User Login Flow",
    strategy: "Comprehensive testing of authentication endpoints with unit, integration, and E2E tests",
    testCases: [
        {
            id: "TC-001",
            description: "Valid login with correct credentials",
            preconditions: ["User account exists in database", "Server is running"],
            steps: [
                "POST /api/auth/login with valid email and password",
                "Verify response contains JWT token",
                "Verify token is valid and contains correct user ID",
            ],
            expectedResult: "Returns 200 with valid JWT token",
            priority: "P0",
        },
        {
            id: "TC-002",
            description: "Login with invalid password",
            preconditions: ["User account exists in database"],
            steps: [
                "POST /api/auth/login with valid email and wrong password",
                "Verify response returns 401",
            ],
            expectedResult: "Returns 401 Unauthorized with generic error message",
            priority: "P0",
        },
        {
            id: "TC-003",
            description: "Login rate limiting",
            preconditions: ["Rate limiter configured for 5 attempts/minute"],
            steps: [
                "Send 6 login attempts in rapid succession",
                "Verify 6th attempt returns 429",
            ],
            expectedResult: "Returns 429 Too Many Requests after 5 attempts",
            priority: "P1",
        },
    ],
    edgeCases: [
        "Empty email/password fields",
        "SQL injection in email field",
        "Unicode characters in password",
        "Expired JWT token refresh",
    ],
    automationPlan: [
        "Unit tests for auth service functions",
        "Integration tests for login endpoint",
        "E2E tests with Playwright for full login flow",
    ],
    manualTestingNotes: [
        "Test with multiple browsers for cookie handling",
        "Verify logout clears session in private browsing mode",
    ],
};

// ============================================================================
// Builder Agent — Tool call responses
// ============================================================================

/** Builder LLM response with successful tool calls */
export const MOCK_BUILDER_WITH_TOOLS = {
    content: "I'll implement the API endpoint and run tests to verify.",
    tool_calls: [
        {
            name: "write_file",
            args: { filePath: "src/routes/auth.ts", content: "export const authRouter = ..." },
            id: "call_write_1",
        },
        {
            name: "run_command",
            args: { command: "npm test -- --run" },
            id: "call_run_1",
        },
    ],
};

/** Builder LLM response with tool calls that will fail */
export const MOCK_BUILDER_WITH_FAILING_TOOLS = {
    content: "Let me fix the test failures.",
    tool_calls: [
        {
            name: "run_command",
            args: { command: "npm test" },
            id: "call_run_fail",
        },
    ],
};

/** Builder LLM response with no tool calls (analysis only) */
export const MOCK_BUILDER_ANALYSIS_ONLY = {
    content: "After reviewing the codebase, the architecture looks solid. No changes needed.",
    tool_calls: [] as Array<{ name: string; args: Record<string, unknown>; id: string }>,
};

/** Builder LLM response with read + write sequence */
export const MOCK_BUILDER_READ_WRITE = {
    content: "I'll read the existing file and update it.",
    tool_calls: [
        {
            name: "read_file",
            args: { filePath: "src/index.ts" },
            id: "call_read_1",
        },
        {
            name: "write_file",
            args: { filePath: "src/index.ts", content: "updated content" },
            id: "call_write_2",
        },
    ],
};

/** Builder LLM response with unknown tool (edge case) */
export const MOCK_BUILDER_UNKNOWN_TOOL = {
    content: "Let me try a different approach.",
    tool_calls: [
        {
            name: "deploy_to_cloud",
            args: { region: "us-east-1" },
            id: "call_unknown",
        },
    ],
};

// ============================================================================
// Tester Agent — Tool call responses (fallback path)
// ============================================================================

/** Tester LLM response with test execution tool calls */
export const MOCK_TESTER_WITH_TOOLS = {
    content: "Running the test suite to verify the implementation.",
    tool_calls: [
        {
            name: "run_tests",
            args: { testPath: "tests/auth.test.ts", framework: "vitest" },
            id: "call_test_1",
        },
    ],
};

/** Tester LLM response with run_command */
export const MOCK_TESTER_WITH_COMMAND = {
    content: "Let me check test coverage.",
    tool_calls: [
        {
            name: "run_command",
            args: { command: "npx vitest run --coverage" },
            id: "call_cmd_1",
        },
    ],
};

/** Tester LLM response with no tool calls */
export const MOCK_TESTER_NO_TOOLS = {
    content: "Here's my analysis of the test coverage gaps.",
    tool_calls: [] as Array<{ name: string; args: Record<string, unknown>; id: string }>,
};

// ============================================================================
// Router Agent — Route decision structured output
// ============================================================================

export const MOCK_ROUTE_TO_SECURITY = {
    next: "Security",
    reasoning: "New authentication feature needs threat modeling before implementation",
};

export const MOCK_ROUTE_TO_SRE = {
    next: "SRE",
    reasoning: "Deployment configuration needs review",
};

export const MOCK_ROUTE_TO_REVIEWER = {
    next: "Reviewer",
    reasoning: "Code implementation complete, needs peer review",
};
