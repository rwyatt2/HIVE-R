/**
 * Workflow Fixture: "Review this code for security issues"
 *
 * Expected path: Router → Security → Router → Reviewer → Router → FINISH
 *
 * Provides sequential mock responses for each agent invocation.
 */

// ============================================================================
// Router Decisions (3 sequential calls)
// ============================================================================

export const ROUTER_DECISIONS = [
    { next: "Security", reasoning: "User is asking for security review — Security agent should do threat modeling first" },
    { next: "Reviewer", reasoning: "Security review complete — Reviewer should do code quality review with security context" },
    { next: "FINISH", reasoning: "Security and code review are both complete — all issues documented" },
];

// ============================================================================
// Security Agent — SecurityReview (structured output)
// ============================================================================

export const SECURITY_REVIEW_ARTIFACT = {
    type: "SecurityReview" as const,
    title: "Security Review: Authentication Module",
    threatModel: [
        {
            threat: "SQL injection via login form",
            attackVector: "Malicious input in username/password fields bypassing parameterized queries",
            impact: "critical" as const,
            likelihood: "medium" as const,
        },
        {
            threat: "JWT token theft via XSS",
            attackVector: "Stored XSS in user profile field to exfiltrate tokens from localStorage",
            impact: "high" as const,
            likelihood: "medium" as const,
        },
        {
            threat: "Brute force password attacks",
            attackVector: "Automated credential stuffing against /api/login endpoint",
            impact: "high" as const,
            likelihood: "high" as const,
        },
    ],
    vulnerabilities: [
        {
            id: "VULN-001",
            description: "No rate limiting on authentication endpoints",
            severity: "high" as const,
            recommendation: "Add express-rate-limit with max 5 login attempts per minute per IP",
        },
        {
            id: "VULN-002",
            description: "JWT stored in localStorage instead of httpOnly cookie",
            severity: "critical" as const,
            recommendation: "Move JWT to httpOnly secure cookie with SameSite=Strict",
        },
        {
            id: "VULN-003",
            description: "Missing Content-Security-Policy header",
            severity: "medium" as const,
            recommendation: "Add CSP header: default-src 'self'; script-src 'self'",
        },
    ],
    requirements: [
        "Use parameterized queries for all database operations",
        "Implement bcrypt with cost factor >= 12 for password hashing",
        "Add CSRF tokens to all state-changing endpoints",
        "Set Secure and HttpOnly flags on all auth cookies",
    ],
    complianceNotes: [
        "OWASP A01:2021 — Broken Access Control: Rate limiting required",
        "OWASP A03:2021 — Injection: Parameterized queries mandatory",
        "GDPR Article 32: Encryption at rest and in transit",
    ],
};

// ============================================================================
// Reviewer Agent — CodeReview (structured output)
// ============================================================================

export const CODE_REVIEW_ARTIFACT = {
    type: "CodeReview" as const,
    verdict: "request_changes" as const,
    summary: "The authentication module has a solid foundation but critical security gaps need addressing before merge. The code structure is clean but security hardening is required.",
    mustFix: [
        {
            location: "src/auth/login.ts:23",
            issue: "Password comparison uses timing-unsafe string equality",
            suggestion: "Use crypto.timingSafeEqual() or bcrypt.compare() for constant-time comparison",
        },
        {
            location: "src/auth/jwt.ts:15",
            issue: "JWT secret is hardcoded in source file",
            suggestion: "Move to environment variable with secrets manager integration",
        },
    ],
    shouldFix: [
        {
            location: "src/auth/middleware.ts:8",
            issue: "Error messages leak internal details to client",
            suggestion: "Return generic 'Authentication failed' without exposing whether email or password was wrong",
        },
    ],
    nits: [
        "Consider using an auth library like Passport.js for standard patterns",
        "Token expiry of 24h is generous — consider 1h with refresh tokens",
    ],
    praise: [
        "Clean separation of auth logic into dedicated module",
        "Good use of TypeScript types for user session data",
        "Proper middleware pattern for route protection",
    ],
};

// ============================================================================
// Expected Workflow Results
// ============================================================================

export const EXPECTED_CONTRIBUTORS = ["Security", "Reviewer"];
export const EXPECTED_AGENT_COUNT = 2;
export const EXPECTED_ROUTER_CALLS = 3;

export const USER_MESSAGE = "Review this authentication code for security vulnerabilities:\n\n```typescript\nimport jwt from 'jsonwebtoken';\nconst SECRET = 'my-secret-key';\n\nexport async function login(email: string, password: string) {\n  const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);\n  if (user && user.password === password) {\n    return jwt.sign({ userId: user.id }, SECRET, { expiresIn: '24h' });\n  }\n  throw new Error('Invalid email or password');\n}\n```";
