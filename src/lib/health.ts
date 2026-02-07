/**
 * Health Check System for HIVE-R
 *
 * Production-grade health probes with:
 * - Database connectivity (SELECT 1)
 * - LLM API reachability via circuit breaker state (no HTTP calls)
 * - Disk space availability
 * - Memory usage percentage
 * - 3-level status: healthy / degraded / unhealthy
 * - 30s result caching to avoid hammering dependencies
 *
 * K8s-compatible:
 *   /health/live  → liveness  (always 200)
 *   /health/ready → readiness (200 or 503)
 */

import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as os from "node:os";
import { circuitBreakerRegistry, CircuitState } from "./circuit-breaker.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";
const CACHE_TTL_MS = 30_000; // 30 seconds
const DISK_WARNING_GB = 5;   // warn below 5 GB free
const MEMORY_WARNING_PCT = 90; // warn above 90% usage

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry<T> {
    result: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return entry.result;
    }
    return null;
}

function setCache<T>(key: string, result: T): void {
    cache.set(key, { result, timestamp: Date.now() });
}

export function clearHealthCache(): void {
    cache.clear();
}

// ============================================================================
// INDIVIDUAL CHECK TYPES
// ============================================================================

export interface DatabaseCheckResult {
    status: "ok" | "error";
    latency_ms: number;
    error?: string;
}

export interface ApiCheckResult {
    status: "ok" | "degraded" | "error";
    circuit: string; // "closed" | "open" | "half_open"
    failure_count?: number;
}

export interface DiskCheckResult {
    status: "ok" | "warning";
    free_gb: number;
}

export interface MemoryCheckResult {
    status: "ok" | "warning";
    usage_pct: number;
}

// ============================================================================
export interface CheckDatabaseOptions {
    /** Override database constructor (for testing). */
    _dbFactory?: (path: string, opts: any) => { prepare: (sql: string) => { get: () => any }; close: () => void };
}

export async function checkDatabase(options: CheckDatabaseOptions = {}): Promise<DatabaseCheckResult> {
    const cached = getCached<DatabaseCheckResult>("database");
    if (cached) return cached;

    const createDb = options._dbFactory || ((path: string, opts: any) => new Database(path, opts));

    const start = Date.now();
    try {
        const db = createDb(DB_PATH, { readonly: true });
        db.prepare("SELECT 1").get();
        db.close();

        const result: DatabaseCheckResult = {
            status: "ok",
            latency_ms: Date.now() - start,
        };
        setCache("database", result);
        return result;
    } catch (error) {
        const result: DatabaseCheckResult = {
            status: "error",
            latency_ms: Date.now() - start,
            error: error instanceof Error ? error.message : "Unknown error",
        };
        setCache("database", result);
        return result;
    }
}

// ============================================================================
// LLM API CHECKS (via circuit breaker state — no HTTP calls)
// ============================================================================

function getCircuitCheckResult(modelName: string): ApiCheckResult {
    try {
        const cb = circuitBreakerRegistry.get(modelName);
        const state = cb.state;
        const circuitLabel = state === CircuitState.CLOSED ? "closed"
            : state === CircuitState.OPEN ? "open"
                : "half_open";

        const result: ApiCheckResult = {
            status: state === CircuitState.CLOSED ? "ok"
                : state === CircuitState.HALF_OPEN ? "degraded"
                    : "error",
            circuit: circuitLabel,
        };

        if (cb.failureCount > 0) {
            result.failure_count = cb.failureCount;
        }

        return result;
    } catch {
        // If registry throws, model hasn't been used yet — assume ok
        return { status: "ok", circuit: "closed" };
    }
}

export function checkOpenAI(): ApiCheckResult {
    const cached = getCached<ApiCheckResult>("openai");
    if (cached) return cached;

    const result = getCircuitCheckResult("gpt-4o");
    setCache("openai", result);
    return result;
}

export function checkAnthropic(): ApiCheckResult {
    const cached = getCached<ApiCheckResult>("anthropic");
    if (cached) return cached;

    const result = getCircuitCheckResult("claude-3-5-sonnet");
    setCache("anthropic", result);
    return result;
}

// ============================================================================
// DISK SPACE CHECK
// ============================================================================

export function checkDiskSpace(): DiskCheckResult {
    const cached = getCached<DiskCheckResult>("disk");
    if (cached) return cached;

    try {
        const stats = fs.statfsSync("/");
        const freeBytes = stats.bfree * stats.bsize;
        const freeGb = Math.round((freeBytes / (1024 ** 3)) * 10) / 10;

        const result: DiskCheckResult = {
            status: freeGb < DISK_WARNING_GB ? "warning" : "ok",
            free_gb: freeGb,
        };
        setCache("disk", result);
        return result;
    } catch {
        // statfs not available (Windows, some containers)
        const result: DiskCheckResult = { status: "ok", free_gb: -1 };
        setCache("disk", result);
        return result;
    }
}

// ============================================================================
// MEMORY CHECK
// ============================================================================

export function checkMemory(): MemoryCheckResult {
    const cached = getCached<MemoryCheckResult>("memory");
    if (cached) return cached;

    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    const usagePct = Math.round((usedMem / totalMem) * 100);

    const result: MemoryCheckResult = {
        status: usagePct >= MEMORY_WARNING_PCT ? "warning" : "ok",
        usage_pct: usagePct,
    };
    setCache("memory", result);
    return result;
}

// ============================================================================
// AGGREGATED HEALTH CHECK
// ============================================================================

export type OverallStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckResult {
    status: OverallStatus;
    checks: {
        database: DatabaseCheckResult;
        openai_api: ApiCheckResult;
        anthropic_api: ApiCheckResult;
        disk_space: DiskCheckResult;
        memory: MemoryCheckResult;
    };
    timestamp: string;
}

/**
 * Determine overall status from individual checks.
 *
 * - unhealthy: database down OR both LLM circuits open
 * - degraded:  any check has a warning/degraded/error (but not critical)
 * - healthy:   everything is ok
 */
export function determineStatus(checks: HealthCheckResult["checks"]): OverallStatus {
    // Critical: database down → unhealthy
    if (checks.database.status === "error") return "unhealthy";

    // Critical: both LLM APIs circuits open → unhealthy
    if (checks.openai_api.status === "error" && checks.anthropic_api.status === "error") {
        return "unhealthy";
    }

    // Any non-ok check → degraded
    const allStatuses = [
        checks.database.status,
        checks.openai_api.status,
        checks.anthropic_api.status,
        checks.disk_space.status,
        checks.memory.status,
    ];

    if (allStatuses.some((s) => s !== "ok")) return "degraded";

    return "healthy";
}

/**
 * Run all health checks and return aggregated result.
 * Total execution time target: <50ms (no HTTP calls).
 */
export async function runHealthChecks(): Promise<HealthCheckResult> {
    // Database is the only async check (file I/O)
    const database = await checkDatabase();

    // These are all synchronous (circuit breaker lookups, os stats)
    const openai_api = checkOpenAI();
    const anthropic_api = checkAnthropic();
    const disk_space = checkDiskSpace();
    const memory = checkMemory();

    const checks = { database, openai_api, anthropic_api, disk_space, memory };

    return {
        status: determineStatus(checks),
        checks,
        timestamp: new Date().toISOString(),
    };
}
