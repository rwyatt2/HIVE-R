/**
 * Chat History Persistence for HIVE-R
 * 
 * Manages chat sessions and message history.
 * Supports both anonymous and authenticated users.
 */

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import * as path from "path";
import { optimizeDatabase } from "./db-init.js";
import { logger } from "./logger.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";

// ============================================================================
// TYPES
// ============================================================================

export interface ChatSession {
    id: string;
    userId: string | null;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount?: number;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: "user" | "agent";
    agentName: string | null;
    content: string;
    timestamp: string;
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
        optimizeDatabase(db);

        // Create chat history tables if they don't exist
        db.exec(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT NOT NULL DEFAULT 'New Chat',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'agent')),
                agent_name TEXT,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
            CREATE INDEX IF NOT EXISTS idx_messages_session_ts ON chat_messages(session_id, timestamp);
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON chat_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_updated ON chat_sessions(updated_at);
            CREATE INDEX IF NOT EXISTS idx_sessions_user_updated ON chat_sessions(user_id, updated_at);
        `);
    }
    return db;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new chat session
 */
export function createSession(userId?: string, title?: string): ChatSession {
    const id = randomUUID();
    const now = new Date().toISOString();

    getDb().prepare(`
        INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, userId || null, title || "New Chat", now, now);

    return {
        id,
        userId: userId || null,
        title: title || "New Chat",
        createdAt: now,
        updatedAt: now,
        messageCount: 0
    };
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): ChatSession | null {
    const row = getDb().prepare(`
        SELECT 
            s.id, s.user_id, s.title, s.created_at, s.updated_at,
            (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count
        FROM chat_sessions s
        WHERE s.id = ?
    `).get(sessionId) as {
        id: string;
        user_id: string | null;
        title: string;
        created_at: string;
        updated_at: string;
        message_count: number;
    } | undefined;

    if (!row) return null;

    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        messageCount: row.message_count
    };
}

/**
 * Get all sessions for a user (or anonymous sessions)
 */
export function getUserSessions(userId?: string, limit = 50): ChatSession[] {
    const query = userId
        ? `SELECT 
            s.id, s.user_id, s.title, s.created_at, s.updated_at,
            (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count
           FROM chat_sessions s
           WHERE s.user_id = ?
           ORDER BY s.updated_at DESC
           LIMIT ?`
        : `SELECT 
            s.id, s.user_id, s.title, s.created_at, s.updated_at,
            (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count
           FROM chat_sessions s
           ORDER BY s.updated_at DESC
           LIMIT ?`;

    const params = userId ? [userId, limit] : [limit];

    const rows = getDb().prepare(query).all(...params) as Array<{
        id: string;
        user_id: string | null;
        title: string;
        created_at: string;
        updated_at: string;
        message_count: number;
    }>;

    return rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        messageCount: row.message_count
    }));
}

/**
 * Update session title
 */
export function updateSessionTitle(sessionId: string, title: string): void {
    const now = new Date().toISOString();
    getDb().prepare(`
        UPDATE chat_sessions 
        SET title = ?, updated_at = ?
        WHERE id = ?
    `).run(title, now, sessionId);
}

/**
 * Delete a session and all its messages
 */
export function deleteSession(sessionId: string): boolean {
    // First delete messages (if foreign key cascading isn't working)
    getDb().prepare("DELETE FROM chat_messages WHERE session_id = ?").run(sessionId);

    const result = getDb().prepare("DELETE FROM chat_sessions WHERE id = ?").run(sessionId);
    return result.changes > 0;
}

// ============================================================================
// MESSAGE MANAGEMENT
// ============================================================================

/**
 * Save a message to a session
 */
export function saveMessage(
    sessionId: string,
    role: "user" | "agent",
    content: string,
    agentName?: string
): ChatMessage {
    const id = randomUUID();
    const timestamp = new Date().toISOString();

    getDb().prepare(`
        INSERT INTO chat_messages (id, session_id, role, agent_name, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, sessionId, role, agentName || null, content, timestamp);

    // Update session's updated_at
    getDb().prepare(`
        UPDATE chat_sessions SET updated_at = ? WHERE id = ?
    `).run(timestamp, sessionId);

    // Auto-generate title from first user message if still default
    if (role === "user") {
        const session = getSession(sessionId);
        if (session && session.title === "New Chat") {
            const autoTitle = content.length > 40 ? content.slice(0, 40) + "..." : content;
            updateSessionTitle(sessionId, autoTitle);
        }
    }

    return {
        id,
        sessionId,
        role,
        agentName: agentName || null,
        content,
        timestamp
    };
}

/**
 * Get all messages for a session
 */
export function getSessionMessages(sessionId: string): ChatMessage[] {
    const rows = getDb().prepare(`
        SELECT id, session_id, role, agent_name, content, timestamp
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY timestamp ASC
    `).all(sessionId) as Array<{
        id: string;
        session_id: string;
        role: "user" | "agent";
        agent_name: string | null;
        content: string;
        timestamp: string;
    }>;

    return rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        role: row.role,
        agentName: row.agent_name,
        content: row.content,
        timestamp: row.timestamp
    }));
}

/**
 * Bulk save messages (for importing from localStorage)
 */
export function bulkSaveMessages(sessionId: string, messages: Array<{
    role: "user" | "agent";
    content: string;
    agentName?: string;
    timestamp?: string;
}>): void {
    const stmt = getDb().prepare(`
        INSERT INTO chat_messages (id, session_id, role, agent_name, content, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = getDb().transaction(() => {
        for (const msg of messages) {
            stmt.run(
                randomUUID(),
                sessionId,
                msg.role,
                msg.agentName || null,
                msg.content,
                msg.timestamp || new Date().toISOString()
            );
        }

        // Update session timestamp
        const now = new Date().toISOString();
        getDb().prepare("UPDATE chat_sessions SET updated_at = ? WHERE id = ?").run(now, sessionId);
    });

    transaction();
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Delete old anonymous sessions
 */
export function cleanupOldSessions(daysOld = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    const cutoffStr = cutoff.toISOString();

    // Delete messages first
    const messagesDeleted = getDb().prepare(`
        DELETE FROM chat_messages 
        WHERE session_id IN (
            SELECT id FROM chat_sessions 
            WHERE user_id IS NULL AND updated_at < ?
        )
    `).run(cutoffStr);

    // Then delete sessions
    const sessionsDeleted = getDb().prepare(`
        DELETE FROM chat_sessions 
        WHERE user_id IS NULL AND updated_at < ?
    `).run(cutoffStr);

    logger.info({ sessions: sessionsDeleted.changes, messages: messagesDeleted.changes }, `Cleaned up ${sessionsDeleted.changes} old sessions (${messagesDeleted.changes} messages)`);
    return sessionsDeleted.changes;
}
