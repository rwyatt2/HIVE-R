/**
 * Database Initialization Helpers
 * 
 * Centralized SQLite PRAGMA tuning for all database connections.
 * Call optimizeDatabase() after opening any Database connection.
 */

import Database from "better-sqlite3";
import { logger } from "./logger.js";

/**
 * Apply performance-optimized PRAGMA settings to a SQLite database connection.
 * 
 * - WAL mode: allows concurrent reads during writes
 * - synchronous=NORMAL: safe with WAL, ~2x faster writes
 * - cache_size=-8000: 8MB page cache (vs default 2MB)
 * - busy_timeout=5000: wait 5s for locks instead of failing immediately
 * - temp_store=MEMORY: temp tables in memory instead of disk
 */
export function optimizeDatabase(db: Database.Database): void {
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("cache_size = -8000");
    db.pragma("busy_timeout = 5000");
    db.pragma("temp_store = MEMORY");
}

/**
 * Ensure indexes exist for efficient paginated queries.
 * Safe to call multiple times (uses IF NOT EXISTS).
 */
export function ensurePaginationIndexes(db: Database.Database): void {
    const indexes = [
        // Chat sessions: paginate by user, ordered by recent activity
        `CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated 
         ON chat_sessions(user_id, updated_at DESC)`,

        // Chat messages: cursor-based pagination within session
        `CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time 
         ON chat_messages(session_id, timestamp DESC)`,

        // LLM usage: cost tracking by user and date range
        `CREATE INDEX IF NOT EXISTS idx_llm_usage_user_date 
         ON llm_usage(user_id, created_at DESC)`,

        // Organization members: paginate org members
        `CREATE INDEX IF NOT EXISTS idx_org_members_org 
         ON organization_members(org_id, joined_at DESC)`,
    ];

    let created = 0;
    for (const sql of indexes) {
        try {
            db.exec(sql);
            created++;
        } catch (err) {
            // Index might fail if table doesn't exist yet - that's OK
            logger.debug({ sql, error: (err as Error).message }, 'Index creation skipped');
        }
    }

    logger.info({ count: created }, 'Pagination indexes ensured');
}
