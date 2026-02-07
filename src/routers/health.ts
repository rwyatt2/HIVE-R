/**
 * Health Check Router for HIVE-R
 *
 * K8s-compatible liveness and readiness probes:
 *   GET /health       — basic status + version + uptime
 *   GET /health/live  — liveness probe (always 200 unless crashed)
 *   GET /health/ready — readiness probe (200 or 503)
 */

import { Hono } from "hono";
import { runHealthChecks } from "../lib/health.js";

export const healthRouter = new Hono();

/**
 * Basic health check — always 200 with service info.
 */
healthRouter.get("/", (c) => {
    return c.json({
        status: "healthy",
        version: "1.0.0",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

/**
 * Liveness probe — is the process alive?
 * K8s uses this to decide if the container should be restarted.
 * Always returns 200 unless the process has crashed.
 */
healthRouter.get("/live", (c) => {
    return c.json({
        status: "alive",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

/**
 * Readiness probe — is the system ready to serve traffic?
 * K8s uses this to decide if traffic should be routed to this instance.
 * Returns 200 (healthy/degraded) or 503 (unhealthy).
 */
healthRouter.get("/ready", async (c) => {
    const result = await runHealthChecks();

    const httpStatus = result.status === "unhealthy" ? 503 : 200;
    return c.json(result, httpStatus);
});
