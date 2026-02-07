/**
 * Database Initialization Helpers
 * 
 * Centralized SQLite PRAGMA tuning for all database connections.
 * Call optimizeDatabase() after opening any Database connection.
 */

import Database from "better-sqlite3";

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
