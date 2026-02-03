import { describe, it, expect } from "vitest";

describe("Middleware", () => {
    describe("requestLogger", () => {
        it("should be importable", async () => {
            const { requestLogger } = await import("../src/lib/middleware.js");
            expect(requestLogger).toBeDefined();
            expect(typeof requestLogger).toBe("function");
        });
    });

    describe("rateLimiter", () => {
        it("should be importable", async () => {
            const { rateLimiter } = await import("../src/lib/middleware.js");
            expect(rateLimiter).toBeDefined();
            expect(typeof rateLimiter).toBe("function");
        });
    });

    describe("errorHandler", () => {
        it("should be importable", async () => {
            const { errorHandler } = await import("../src/lib/middleware.js");
            expect(errorHandler).toBeDefined();
            expect(typeof errorHandler).toBe("function");
        });
    });
});
