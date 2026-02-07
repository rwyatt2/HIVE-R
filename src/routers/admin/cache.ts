/**
 * Cache Admin Router
 *
 * GET  /admin/cache/stats  — Cache statistics (hit rate, entries, by-agent)
 * DELETE /admin/cache/clear — Clear cache (all, or ?agent=Planner)
 */

import { Hono } from "hono";
import { semanticCache } from "../../lib/semantic-cache.js";
import { logger } from "../../lib/logger.js";

const app = new Hono();

/**
 * GET /admin/cache/stats
 * Returns cache hit rate, entry count, and per-agent breakdown.
 */
app.get("/stats", async (c) => {
    try {
        const stats = await semanticCache.stats();
        return c.json(stats);
    } catch (err) {
        logger.error({ err }, "Failed to fetch cache stats");
        return c.json(
            { error: "Failed to fetch cache stats", detail: (err as Error).message },
            500,
        );
    }
});

/**
 * DELETE /admin/cache/clear
 * Clear all cache entries, or filter by agent name.
 *
 * Query params:
 *   ?agent=Planner  — Only clear Planner cache
 */
app.delete("/clear", async (c) => {
    try {
        const agentName = c.req.query("agent");
        const deleted = await semanticCache.clear(agentName ?? undefined);
        logger.info({ agent: agentName ?? "ALL", deleted }, "Cache cleared via admin API");
        return c.json({ cleared: deleted, agent: agentName ?? "ALL" });
    } catch (err) {
        logger.error({ err }, "Failed to clear cache");
        return c.json(
            { error: "Failed to clear cache", detail: (err as Error).message },
            500,
        );
    }
});

export default app;
