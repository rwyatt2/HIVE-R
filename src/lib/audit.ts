/**
 * Audit Trail System for HIVE-R
 * 
 * Provides structured logging for all significant events:
 * - API requests
 * - Agent invocations
 * - Tool usage
 * - Errors
 * 
 * Logs in JSON Lines format for easy parsing by log aggregators.
 */

import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import path from "path";
import { logger } from "./logger.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";
const AUDIT_TO_DB = process.env.AUDIT_TO_DB === "true";
const RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || "30", 10);

// ============================================================================
// TYPES
// ============================================================================

export type AuditEventType =
    | "request"
    | "agent_start"
    | "agent_end"
    | "tool_call"
    | "tool_result"
    | "handoff"
    | "error";

export interface AuditEvent {
    timestamp: string;
    eventType: AuditEventType;
    threadId?: string;
    userId?: string;
    agentName?: string;
    action: string;
    metadata: Record<string, unknown>;
    duration?: number;
    success?: boolean;
}

// ============================================================================
// DATABASE SETUP
// ============================================================================

let db: Database.Database | null = null;

function getDb(): Database.Database {
    if (!db) {
        // Ensure data directory exists
        const dbDir = path.dirname(DB_PATH);
        if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
        }

        db = new Database(DB_PATH);

        // Create audit_log table if it doesn't exist
        db.exec(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                thread_id TEXT,
                user_id TEXT,
                agent_name TEXT,
                action TEXT NOT NULL,
                metadata TEXT,
                duration INTEGER,
                success INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
            CREATE INDEX IF NOT EXISTS idx_audit_thread_id ON audit_log(thread_id);
            CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
        `);
    }
    return db;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log an audit event.
 * Writes to console (JSON Lines) and optionally to SQLite.
 */
export function logAuditEvent(event: AuditEvent): void {
    const logEntry = {
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
    };

    // Console output in JSON Lines format (for log aggregators)
    logger.info(logEntry, `audit:${logEntry.eventType}`);

    // Optional: Write to SQLite
    if (AUDIT_TO_DB) {
        try {
            const stmt = getDb().prepare(`
                INSERT INTO audit_log (
                    timestamp, event_type, thread_id, user_id, agent_name, 
                    action, metadata, duration, success
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                logEntry.timestamp,
                logEntry.eventType,
                logEntry.threadId || null,
                logEntry.userId || null,
                logEntry.agentName || null,
                logEntry.action,
                JSON.stringify(logEntry.metadata),
                logEntry.duration || null,
                logEntry.success !== undefined ? (logEntry.success ? 1 : 0) : null
            );
        } catch (error) {
            logger.error({ err: error }, 'Failed to write audit log to DB');
        }
    }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Log an API request
 */
export function logRequest(
    path: string,
    method: string,
    threadId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
): void {
    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "request",
        threadId,
        userId,
        action: `${method} ${path}`,
        metadata: { path, method, ...metadata },
    });
}

/**
 * Log agent start
 */
export function logAgentStart(
    agentName: string,
    threadId?: string,
    metadata?: Record<string, unknown>
): void {
    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "agent_start",
        agentName,
        threadId,
        action: `Agent ${agentName} started`,
        metadata: metadata || {},
    });
}

/**
 * Log agent end
 */
export function logAgentEnd(
    agentName: string,
    duration: number,
    success: boolean,
    threadId?: string,
    metadata?: Record<string, unknown>
): void {
    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "agent_end",
        agentName,
        threadId,
        action: `Agent ${agentName} completed`,
        duration,
        success,
        metadata: metadata || {},
    });
}

/**
 * Log tool call
 */
export function logToolCall(
    toolName: string,
    agentName: string,
    threadId?: string,
    input?: unknown
): void {
    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "tool_call",
        agentName,
        threadId,
        action: `Tool ${toolName} called`,
        metadata: { toolName, input },
    });
}

/**
 * Log tool result
 */
export function logToolResult(
    toolName: string,
    agentName: string,
    success: boolean,
    duration: number,
    threadId?: string
): void {
    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "tool_result",
        agentName,
        threadId,
        action: `Tool ${toolName} ${success ? 'succeeded' : 'failed'}`,
        duration,
        success,
        metadata: { toolName },
    });
}

/**
 * Log handoff between agents
 */
export function logHandoff(
    fromAgent: string,
    toAgent: string,
    threadId?: string,
    reason?: string
): void {
    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "handoff",
        agentName: fromAgent,
        threadId,
        action: `Handoff ${fromAgent} → ${toAgent}`,
        metadata: { fromAgent, toAgent, reason },
    });
}

/**
 * Log error
 */
export function logError(
    error: Error,
    agentName?: string,
    threadId?: string,
    metadata?: Record<string, unknown>
): void {
    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "error",
        agentName,
        threadId,
        action: `Error: ${error.message}`,
        success: false,
        metadata: {
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack?.split('\n').slice(0, 5).join('\n'),
            ...metadata,
        },
    });
}

// ============================================================================
// QUERY & MAINTENANCE
// ============================================================================

/**
 * Query audit logs
 */
export function queryAuditLogs(options: {
    threadId?: string;
    eventType?: AuditEventType;
    agentName?: string;
    limit?: number;
    offset?: number;
}): AuditEvent[] {
    if (!AUDIT_TO_DB) {
        logger.warn('Audit DB not enabled. Set AUDIT_TO_DB=true');
        return [];
    }

    const { threadId, eventType, agentName, limit = 100, offset = 0 } = options;

    let query = "SELECT * FROM audit_log WHERE 1=1";
    const params: unknown[] = [];

    if (threadId) {
        query += " AND thread_id = ?";
        params.push(threadId);
    }
    if (eventType) {
        query += " AND event_type = ?";
        params.push(eventType);
    }
    if (agentName) {
        query += " AND agent_name = ?";
        params.push(agentName);
    }

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = getDb().prepare(query).all(...params) as Array<{
        timestamp: string;
        event_type: string;
        thread_id: string | null;
        user_id: string | null;
        agent_name: string | null;
        action: string;
        metadata: string | null;
        duration: number | null;
        success: number | null;
    }>;

    return rows.map(row => {
        const event: AuditEvent = {
            timestamp: row.timestamp,
            eventType: row.event_type as AuditEventType,
            action: row.action,
            metadata: row.metadata ? JSON.parse(row.metadata) : {},
        };

        if (row.thread_id) event.threadId = row.thread_id;
        if (row.user_id) event.userId = row.user_id;
        if (row.agent_name) event.agentName = row.agent_name;
        if (row.duration !== null) event.duration = row.duration;
        if (row.success !== null) event.success = row.success === 1;

        return event;
    });
}

/**
 * Clean up old audit logs based on retention policy
 */
export function cleanupAuditLogs(): number {
    if (!AUDIT_TO_DB) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoff = cutoffDate.toISOString();

    const result = getDb().prepare(
        "DELETE FROM audit_log WHERE timestamp < ?"
    ).run(cutoff);

    logger.info({ cleaned: result.changes, retentionDays: RETENTION_DAYS }, `Cleaned up ${result.changes} audit logs older than ${RETENTION_DAYS} days`);
    return result.changes;
}

/**
 * Get audit log statistics
 */
export function getAuditStats(): {
    totalLogs: number;
    dbEnabled: boolean;
    retentionDays: number;
    byEventType: Record<string, number>;
} {
    let totalLogs = 0;
    const byEventType: Record<string, number> = {};

    if (AUDIT_TO_DB) {
        const countResult = getDb().prepare("SELECT COUNT(*) as count FROM audit_log").get() as { count: number };
        totalLogs = countResult.count;

        const typeResults = getDb().prepare(
            "SELECT event_type, COUNT(*) as count FROM audit_log GROUP BY event_type"
        ).all() as Array<{ event_type: string; count: number }>;

        for (const row of typeResults) {
            byEventType[row.event_type] = row.count;
        }
    }

    return {
        totalLogs,
        dbEnabled: AUDIT_TO_DB,
        retentionDays: RETENTION_DAYS,
        byEventType,
    };
}
