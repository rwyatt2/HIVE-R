
/**
 * Admin Router
 * 
 * APIs for the Owner Dashboard.
 * Protected by ownerAuthMiddleware.
 */

import { Hono } from 'hono';
import { getDb, getUserById } from '../lib/user-auth.js';

const app = new Hono();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware: Require 'system_owner' role
 * JWT verification is handled by the global jwtAuthMiddleware.
 * This middleware only checks that the user has the owner role.
 */
export async function ownerAuthMiddleware(c: any, next: any) {
    const authUser = c.get('user');

    if (!authUser?.userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = getUserById(authUser.userId);

    if (!user || user.role !== 'system_owner') {
        console.warn(`⛔ Blocked non-owner access attempt: ${authUser.email}`);
        return c.json({ error: 'Forbidden: Owner access required' }, 403);
    }

    // Pass full user to next handler
    c.set('user', { ...authUser, role: user.role });
    await next();
}

// PROTECT ALL ROUTES
app.use('*', ownerAuthMiddleware);

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * GET /admin/stats
 * Global system statistics
 */
app.get('/stats', (c) => {
    const db = getDb();

    // User stats
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'system_owner'").get() as { count: number };

    // Session stats (last 24h)
    // Note: Assuming session table exists or we count refresh tokens as proxy for active users
    const activeTokens = db.prepare('SELECT COUNT(*) as count FROM refresh_tokens').get() as { count: number };

    // Agent stats
    // Note: This would come from an agents table if we had one persisting dynamic agents, 
    // for now we count the static ones + custom plugins if we had them.
    const agentCount = 13; // Base swarm size

    return c.json({
        users: {
            total: userCount.count,
            admins: adminCount.count,
            activeSessions: activeTokens.count
        },
        system: {
            agents: agentCount,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        }
    });
});

/**
 * GET /admin/users
 * List all users
 */
app.get('/users', (c) => {
    const db = getDb();
    const limit = 50;

    const users = db.prepare(`
        SELECT id, email, role, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ?
    `).all(limit);

    return c.json({ users });
});

/**
 * GET /admin/logs
 * System logs (if stored in DB)
 */
app.get('/logs', (c) => {
    // Placeholder: If we had a logs table, we'd query it here.
    return c.json({ logs: [] });
});

// ============================================================================
// SUB-ROUTERS
// ============================================================================

import costsRouter from "./admin/costs.js";
app.route('/costs', costsRouter);

export default app;
