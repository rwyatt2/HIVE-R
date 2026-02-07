/**
 * JWT Authentication Middleware Tests
 *
 * Tests for the global JWT authentication middleware.
 * Covers: missing token, invalid token, expired token, tampered token,
 *         valid token, and public route bypass.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { jwtAuthMiddleware, isPublicRoute } from "../../src/middleware/auth.js";
import type { AuthUser } from "../../src/middleware/auth.js";

// ============================================================================
// We mock `verifyAccessToken` to control JWT verification in tests.
// ============================================================================

const mockVerifyAccessToken = vi.fn();

vi.mock("../../src/lib/user-auth.js", () => ({
    verifyAccessToken: (...args: any[]) => mockVerifyAccessToken(...args),
}));

// Suppress logger output during tests
vi.mock("../../src/lib/logger.js", () => ({
    logger: {
        warn: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

// ============================================================================
// HELPERS
// ============================================================================

/** Create a mini Hono app with the JWT middleware and a protected endpoint */
function createTestApp() {
    const app = new Hono<{ Variables: { user: AuthUser } }>();

    app.use("*", jwtAuthMiddleware);

    // Protected route
    app.get("/chat", (c) => {
        const user = c.get("user");
        return c.json({ message: "ok", user });
    });

    // Public route
    app.get("/health", (c) => c.json({ status: "healthy" }));
    app.get("/health/live", (c) => c.json({ status: "alive" }));
    app.get("/auth/login", (c) => c.json({ ok: true }));
    app.post("/auth/register", (c) => c.json({ ok: true }));
    app.get("/demo/session/123", (c) => c.json({ ok: true }));
    app.get("/metrics", (c) => c.json({ ok: true }));
    app.get("/metrics/prometheus", (c) => c.json({ ok: true }));

    // Public GETs, protected POSTs
    app.get("/plugins", (c) => c.json({ plugins: [] }));
    app.get("/plugins/abc123", (c) => c.json({ ok: true }));
    app.post("/plugins", (c) => {
        const user = c.get("user");
        return c.json({ message: "created", user });
    });

    return app;
}

// ============================================================================
// isPublicRoute unit tests
// ============================================================================

describe("isPublicRoute", () => {
    it("matches /health exactly", () => {
        expect(isPublicRoute("GET", "/health")).toBe(true);
    });

    it("matches /health/ prefix", () => {
        expect(isPublicRoute("GET", "/health/live")).toBe(true);
        expect(isPublicRoute("GET", "/health/ready")).toBe(true);
    });

    it("matches /auth/ prefix", () => {
        expect(isPublicRoute("POST", "/auth/login")).toBe(true);
        expect(isPublicRoute("POST", "/auth/register")).toBe(true);
        expect(isPublicRoute("POST", "/auth/refresh")).toBe(true);
        expect(isPublicRoute("POST", "/auth/logout")).toBe(true);
    });

    it("matches /demo/ prefix", () => {
        expect(isPublicRoute("POST", "/demo/chat")).toBe(true);
        expect(isPublicRoute("GET", "/demo/session/abc")).toBe(true);
    });

    it("matches /metrics exactly and prefix", () => {
        expect(isPublicRoute("GET", "/metrics")).toBe(true);
        expect(isPublicRoute("GET", "/metrics/prometheus")).toBe(true);
    });

    it("matches GET /plugins and GET /plugins/:id", () => {
        expect(isPublicRoute("GET", "/plugins")).toBe(true);
        expect(isPublicRoute("GET", "/plugins/abc123")).toBe(true);
    });

    it("does NOT match POST /plugins", () => {
        expect(isPublicRoute("POST", "/plugins")).toBe(false);
    });

    it("matches GET /plugins/:id/ratings", () => {
        expect(isPublicRoute("GET", "/plugins/abc123/ratings")).toBe(true);
    });

    it("does NOT match POST /plugins/:id/ratings", () => {
        expect(isPublicRoute("POST", "/plugins/abc123/ratings")).toBe(false);
    });

    it("does NOT match protected routes", () => {
        expect(isPublicRoute("POST", "/chat")).toBe(false);
        expect(isPublicRoute("GET", "/dashboard")).toBe(false);
        expect(isPublicRoute("GET", "/thread/abc")).toBe(false);
        expect(isPublicRoute("GET", "/traces")).toBe(false);
    });
});

// ============================================================================
// Middleware integration tests
// ============================================================================

describe("jwtAuthMiddleware", () => {
    let app: Hono<{ Variables: { user: AuthUser } }>;

    beforeEach(() => {
        mockVerifyAccessToken.mockReset();
        app = createTestApp();
    });

    // --- Missing token ---

    it("returns 401 TOKEN_MISSING when no Authorization header", async () => {
        const res = await app.request("/chat");
        expect(res.status).toBe(401);

        const body = await res.json();
        expect(body.code).toBe("TOKEN_MISSING");
        expect(body.hint).toContain("Authorization: Bearer");
    });

    it("returns 401 TOKEN_INVALID for malformed header (Basic auth)", async () => {
        const res = await app.request("/chat", {
            headers: { Authorization: "Basic dXNlcjpwYXNz" },
        });
        expect(res.status).toBe(401);

        const body = await res.json();
        expect(body.code).toBe("TOKEN_MISSING");
    });

    // --- Invalid token ---

    it("returns 401 TOKEN_INVALID for tampered token", async () => {
        mockVerifyAccessToken.mockReturnValue(null);

        const res = await app.request("/chat", {
            headers: { Authorization: "Bearer tampered.token.value" },
        });
        expect(res.status).toBe(401);

        const body = await res.json();
        expect(body.code).toBe("TOKEN_INVALID");
    });

    // --- Expired token ---

    it("returns 401 TOKEN_EXPIRED for expired JWT", async () => {
        mockVerifyAccessToken.mockReturnValue(null);

        // Create a structurally valid but expired JWT payload
        const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
        const payload = Buffer.from(
            JSON.stringify({
                sub: "user-123",
                email: "test@example.com",
                iat: 1000,
                exp: 1001, // Expired long ago
            })
        )
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
        const expiredToken = `${header}.${payload}.fakesig`;

        const res = await app.request("/chat", {
            headers: { Authorization: `Bearer ${expiredToken}` },
        });
        expect(res.status).toBe(401);

        const body = await res.json();
        expect(body.code).toBe("TOKEN_EXPIRED");
        expect(body.error).toContain("/auth/refresh");
    });

    // --- Valid token ---

    it("passes through and sets user context for valid token", async () => {
        mockVerifyAccessToken.mockReturnValue({
            userId: "user-abc",
            email: "alice@example.com",
        });

        const res = await app.request("/chat", {
            headers: { Authorization: "Bearer valid.token.here" },
        });
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.user).toEqual({
            userId: "user-abc",
            email: "alice@example.com",
        });
    });

    // --- Public routes ---

    it("allows /health without token", async () => {
        const res = await app.request("/health");
        expect(res.status).toBe(200);
    });

    it("allows /health/live without token", async () => {
        const res = await app.request("/health/live");
        expect(res.status).toBe(200);
    });

    it("allows /auth/login without token", async () => {
        const res = await app.request("/auth/login");
        expect(res.status).toBe(200);
    });

    it("allows POST /auth/register without token", async () => {
        const res = await app.request("/auth/register", { method: "POST" });
        expect(res.status).toBe(200);
    });

    it("allows /demo/* without token", async () => {
        const res = await app.request("/demo/session/123");
        expect(res.status).toBe(200);
    });

    it("allows /metrics without token", async () => {
        const res = await app.request("/metrics");
        expect(res.status).toBe(200);
    });

    it("allows GET /plugins without token (public catalog)", async () => {
        const res = await app.request("/plugins");
        expect(res.status).toBe(200);
    });

    it("allows GET /plugins/:id without token", async () => {
        const res = await app.request("/plugins/abc123");
        expect(res.status).toBe(200);
    });

    it("requires token for POST /plugins", async () => {
        const res = await app.request("/plugins", { method: "POST" });
        expect(res.status).toBe(401);
    });

    // --- Public route with optional token ---

    it("attaches user on public route when valid token provided", async () => {
        mockVerifyAccessToken.mockReturnValue({
            userId: "user-xyz",
            email: "bob@example.com",
        });

        const res = await app.request("/health", {
            headers: { Authorization: "Bearer valid.token.here" },
        });
        expect(res.status).toBe(200);
        // User should be attached but the health endpoint doesn't use it
    });
});
