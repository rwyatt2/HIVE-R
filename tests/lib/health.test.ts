/**
 * Tests for Enhanced Health Check System
 *
 * Covers:
 * - Individual checks (database, OpenAI, Anthropic, disk, memory)
 * - Status determination (healthy / degraded / unhealthy)
 * - Aggregated health check result format
 * - Cache behavior
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    checkDatabase,
    checkOpenAI,
    checkAnthropic,
    checkDiskSpace,
    checkMemory,
    determineStatus,
    runHealthChecks,
    clearHealthCache,
} from "../../src/lib/health.js";
import type {
    DatabaseCheckResult,
    ApiCheckResult,
    DiskCheckResult,
    MemoryCheckResult,
} from "../../src/lib/health.js";

// ============================================================================
// MOCKS
// ============================================================================

const { mockCircuitBreaker } = vi.hoisted(() => {
    const mockCircuitBreaker = { state: "CLOSED", failureCount: 0 };
    return { mockCircuitBreaker };
});

vi.mock("../../src/lib/circuit-breaker.js", () => ({
    circuitBreakerRegistry: {
        get: vi.fn(() => mockCircuitBreaker),
    },
    CircuitState: {
        CLOSED: "CLOSED",
        OPEN: "OPEN",
        HALF_OPEN: "HALF_OPEN",
    },
    CircuitOpenError: class CircuitOpenError extends Error {
        constructor(model: string) {
            super(`Circuit open for ${model}`);
            this.name = "CircuitOpenError";
        }
    },
}));

vi.mock("node:fs", () => ({
    statfsSync: vi.fn(() => ({
        bfree: 50 * 1024 * 1024,
        bsize: 1024,
    })),
}));

vi.mock("node:os", () => ({
    totalmem: vi.fn(() => 16 * 1024 * 1024 * 1024),
    freemem: vi.fn(() => 8 * 1024 * 1024 * 1024),
}));

// ============================================================================
// HELPERS
// ============================================================================

/** Creates a mock DB factory that succeeds */
function okDbFactory() {
    return () => ({
        prepare: () => ({ get: () => ({ 1: 1 }) }),
        close: () => { },
    });
}

/** Creates a mock DB factory that throws */
function failDbFactory(errorMsg: string) {
    return () => { throw new Error(errorMsg); };
}

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
    clearHealthCache();
    mockCircuitBreaker.state = "CLOSED";
    mockCircuitBreaker.failureCount = 0;
});

// ============================================================================
// DATABASE CHECK
// ============================================================================

describe("checkDatabase", () => {
    it("should return ok when database is accessible", async () => {
        const result = await checkDatabase({ _dbFactory: okDbFactory() });

        expect(result.status).toBe("ok");
        expect(result.latency_ms).toBeGreaterThanOrEqual(0);
        expect(result.error).toBeUndefined();
    });

    it("should return error when database query fails", async () => {
        const result = await checkDatabase({
            _dbFactory: failDbFactory("SQLITE_CANTOPEN: unable to open database file"),
        });

        expect(result.status).toBe("error");
        expect(result.error).toContain("SQLITE_CANTOPEN");
    });

    it("should measure latency", async () => {
        const result = await checkDatabase({ _dbFactory: okDbFactory() });

        expect(typeof result.latency_ms).toBe("number");
        expect(result.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it("should cache results within TTL", async () => {
        const factory = vi.fn(okDbFactory());
        await checkDatabase({ _dbFactory: factory });
        await checkDatabase({ _dbFactory: factory });

        // Factory called only once (second call hits cache)
        expect(factory).toHaveBeenCalledTimes(1);
    });
});

// ============================================================================
// OPENAI API CHECK
// ============================================================================

describe("checkOpenAI", () => {
    it("should return ok when circuit is closed", () => {
        mockCircuitBreaker.state = "CLOSED";
        mockCircuitBreaker.failureCount = 0;

        const result = checkOpenAI();

        expect(result.status).toBe("ok");
        expect(result.circuit).toBe("closed");
    });

    it("should return error when circuit is open", () => {
        mockCircuitBreaker.state = "OPEN";
        mockCircuitBreaker.failureCount = 3;

        const result = checkOpenAI();

        expect(result.status).toBe("error");
        expect(result.circuit).toBe("open");
        expect(result.failure_count).toBe(3);
    });

    it("should return degraded when circuit is half-open", () => {
        mockCircuitBreaker.state = "HALF_OPEN";
        mockCircuitBreaker.failureCount = 2;

        const result = checkOpenAI();

        expect(result.status).toBe("degraded");
        expect(result.circuit).toBe("half_open");
    });
});

// ============================================================================
// ANTHROPIC API CHECK
// ============================================================================

describe("checkAnthropic", () => {
    it("should return ok when circuit is closed", () => {
        mockCircuitBreaker.state = "CLOSED";

        const result = checkAnthropic();

        expect(result.status).toBe("ok");
        expect(result.circuit).toBe("closed");
    });

    it("should return error when circuit is open", () => {
        mockCircuitBreaker.state = "OPEN";
        mockCircuitBreaker.failureCount = 3;

        const result = checkAnthropic();

        expect(result.status).toBe("error");
        expect(result.circuit).toBe("open");
    });
});

// ============================================================================
// DISK SPACE CHECK
// ============================================================================

describe("checkDiskSpace", () => {
    it("should return ok with adequate disk space", () => {
        const result = checkDiskSpace();

        expect(result.status).toBe("ok");
        expect(result.free_gb).toBeGreaterThan(0);
    });

    it("should return warning when disk space is low", async () => {
        const fs = await import("node:fs");
        (fs.statfsSync as any).mockReturnValueOnce({
            bfree: 2 * 1024,
            bsize: 1024 * 1024,
        });
        clearHealthCache();

        const result = checkDiskSpace();

        expect(result.status).toBe("warning");
        expect(result.free_gb).toBeLessThan(5);
    });
});

// ============================================================================
// MEMORY CHECK
// ============================================================================

describe("checkMemory", () => {
    it("should return ok with normal memory usage", () => {
        const result = checkMemory();

        expect(result.status).toBe("ok");
        expect(result.usage_pct).toBe(50);
    });

    it("should return warning when memory usage exceeds threshold", async () => {
        const os = await import("node:os");
        (os.freemem as any).mockReturnValueOnce(1 * 1024 * 1024 * 1024);
        clearHealthCache();

        const result = checkMemory();

        expect(result.status).toBe("warning");
        expect(result.usage_pct).toBeGreaterThanOrEqual(90);
    });
});

// ============================================================================
// STATUS DETERMINATION
// ============================================================================

describe("determineStatus", () => {
    const okDb: DatabaseCheckResult = { status: "ok", latency_ms: 5 };
    const errorDb: DatabaseCheckResult = { status: "error", latency_ms: 100, error: "connection failed" };
    const okApi: ApiCheckResult = { status: "ok", circuit: "closed" };
    const errorApi: ApiCheckResult = { status: "error", circuit: "open", failure_count: 3 };
    const degradedApi: ApiCheckResult = { status: "degraded", circuit: "half_open" };
    const okDisk: DiskCheckResult = { status: "ok", free_gb: 50 };
    const warningDisk: DiskCheckResult = { status: "warning", free_gb: 3 };
    const okMem: MemoryCheckResult = { status: "ok", usage_pct: 50 };
    const warningMem: MemoryCheckResult = { status: "warning", usage_pct: 95 };

    it("should return healthy when all checks are ok", () => {
        const status = determineStatus({
            database: okDb,
            openai_api: okApi,
            anthropic_api: okApi,
            disk_space: okDisk,
            memory: okMem,
        });
        expect(status).toBe("healthy");
    });

    it("should return unhealthy when database is down", () => {
        const status = determineStatus({
            database: errorDb,
            openai_api: okApi,
            anthropic_api: okApi,
            disk_space: okDisk,
            memory: okMem,
        });
        expect(status).toBe("unhealthy");
    });

    it("should return unhealthy when both LLM circuits are open", () => {
        const status = determineStatus({
            database: okDb,
            openai_api: errorApi,
            anthropic_api: errorApi,
            disk_space: okDisk,
            memory: okMem,
        });
        expect(status).toBe("unhealthy");
    });

    it("should return degraded when one LLM circuit is open", () => {
        const status = determineStatus({
            database: okDb,
            openai_api: errorApi,
            anthropic_api: okApi,
            disk_space: okDisk,
            memory: okMem,
        });
        expect(status).toBe("degraded");
    });

    it("should return degraded when LLM circuit is half-open", () => {
        const status = determineStatus({
            database: okDb,
            openai_api: degradedApi,
            anthropic_api: okApi,
            disk_space: okDisk,
            memory: okMem,
        });
        expect(status).toBe("degraded");
    });

    it("should return degraded when disk space is low", () => {
        const status = determineStatus({
            database: okDb,
            openai_api: okApi,
            anthropic_api: okApi,
            disk_space: warningDisk,
            memory: okMem,
        });
        expect(status).toBe("degraded");
    });

    it("should return degraded when memory usage is high", () => {
        const status = determineStatus({
            database: okDb,
            openai_api: okApi,
            anthropic_api: okApi,
            disk_space: okDisk,
            memory: warningMem,
        });
        expect(status).toBe("degraded");
    });
});

// ============================================================================
// AGGREGATED HEALTH CHECK (runHealthChecks uses real DB path — test structure only)
// ============================================================================

describe("runHealthChecks", () => {
    it("should return result with all required fields", async () => {
        const result = await runHealthChecks();

        // Verify top-level structure
        expect(result).toHaveProperty("status");
        expect(result).toHaveProperty("checks");
        expect(result).toHaveProperty("timestamp");
        expect(typeof result.timestamp).toBe("string");

        // Verify all 5 checks present
        expect(result.checks).toHaveProperty("database");
        expect(result.checks).toHaveProperty("openai_api");
        expect(result.checks).toHaveProperty("anthropic_api");
        expect(result.checks).toHaveProperty("disk_space");
        expect(result.checks).toHaveProperty("memory");

        // Verify check shapes
        expect(result.checks.database).toHaveProperty("status");
        expect(result.checks.database).toHaveProperty("latency_ms");
        expect(result.checks.openai_api).toHaveProperty("circuit");
        expect(result.checks.anthropic_api).toHaveProperty("circuit");
        expect(result.checks.disk_space).toHaveProperty("free_gb");
        expect(result.checks.memory).toHaveProperty("usage_pct");
    });

    it("should return valid ISO timestamp", async () => {
        const result = await runHealthChecks();

        const parsed = new Date(result.timestamp);
        expect(parsed.toISOString()).toBe(result.timestamp);
    });
});

// ============================================================================
// CACHE BEHAVIOR
// ============================================================================

describe("Health Cache", () => {
    it("should return cached results on second call", async () => {
        const factory = vi.fn(okDbFactory());
        const result1 = await checkDatabase({ _dbFactory: factory });
        const result2 = await checkDatabase({ _dbFactory: factory });

        expect(factory).toHaveBeenCalledTimes(1);
        expect(result1.status).toBe(result2.status);
    });

    it("should clear cache when clearHealthCache is called", async () => {
        const factory = vi.fn(okDbFactory());
        await checkDatabase({ _dbFactory: factory });
        expect(factory).toHaveBeenCalledTimes(1);

        clearHealthCache();
        await checkDatabase({ _dbFactory: factory });
        expect(factory).toHaveBeenCalledTimes(2);
    });
});
