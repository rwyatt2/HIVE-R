/**
 * Plugin Registry
 * 
 * Self-hosted plugin storage and retrieval.
 * JSON-only plugins for safe agent extensions.
 */

import { randomUUID } from 'crypto';
import { getDb } from './user-auth.js';
import type {
    AgentPlugin,
    StoredPlugin,
    PluginRating,
    StoredRating,
    CreatePluginInput,
    UpdatePluginInput,
    RatingInput,
    PluginFilters,
    PluginListResponse,
    PluginTool
} from '../types/plugin.js';

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize plugin tables
 */
export function initPluginTables(): void {
    const db = getDb();

    // Plugins table
    db.exec(`
        CREATE TABLE IF NOT EXISTS plugins (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            author TEXT NOT NULL,
            author_id TEXT NOT NULL,
            description TEXT NOT NULL,
            long_description TEXT,
            agent_name TEXT NOT NULL,
            system_prompt_extension TEXT,
            tools TEXT,
            tags TEXT NOT NULL DEFAULT '[]',
            icon TEXT,
            homepage TEXT,
            repository TEXT,
            downloads INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    // Ratings table
    db.exec(`
        CREATE TABLE IF NOT EXISTS plugin_ratings (
            id TEXT PRIMARY KEY,
            plugin_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            stars INTEGER NOT NULL CHECK(stars >= 1 AND stars <= 5),
            review TEXT,
            created_at TEXT NOT NULL,
            UNIQUE(plugin_id, user_id),
            FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
        )
    `);

    // Create indexes
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_plugins_agent ON plugins(agent_name);
        CREATE INDEX IF NOT EXISTS idx_plugins_author ON plugins(author_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_plugin ON plugin_ratings(plugin_id);
    `);
}

// ============================================================================
// PLUGIN CRUD
// ============================================================================

/**
 * Convert stored plugin to API format
 */
function toPluginResponse(stored: StoredPlugin, ratings?: { avg: number; count: number }): AgentPlugin {
    return {
        id: stored.id,
        name: stored.name,
        version: stored.version,
        author: stored.author,
        authorId: stored.author_id,
        description: stored.description,
        longDescription: stored.long_description || undefined,
        agentName: stored.agent_name,
        systemPromptExtension: stored.system_prompt_extension || undefined,
        tools: stored.tools ? JSON.parse(stored.tools) as PluginTool[] : undefined,
        tags: JSON.parse(stored.tags) as string[],
        icon: stored.icon || undefined,
        homepage: stored.homepage || undefined,
        repository: stored.repository || undefined,
        downloads: stored.downloads,
        averageRating: ratings?.avg,
        ratingCount: ratings?.count,
        createdAt: stored.created_at,
        updatedAt: stored.updated_at
    };
}

/**
 * Get rating stats for a plugin
 */
function getRatingStats(pluginId: string): { avg: number; count: number } {
    const result = getDb().prepare(`
        SELECT AVG(stars) as avg, COUNT(*) as count
        FROM plugin_ratings WHERE plugin_id = ?
    `).get(pluginId) as { avg: number | null; count: number };

    return {
        avg: result.avg ? Math.round(result.avg * 10) / 10 : 0,
        count: result.count
    };
}

/**
 * Create a new plugin
 */
export function createPlugin(
    input: CreatePluginInput,
    authorId: string,
    authorName: string
): AgentPlugin {
    const db = getDb();
    const now = new Date().toISOString();
    const id = randomUUID();

    db.prepare(`
        INSERT INTO plugins (
            id, name, version, author, author_id, description, long_description,
            agent_name, system_prompt_extension, tools, tags, icon, homepage,
            repository, downloads, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
        id,
        input.name,
        input.version,
        authorName,
        authorId,
        input.description,
        input.longDescription || null,
        input.agentName,
        input.systemPromptExtension || null,
        input.tools ? JSON.stringify(input.tools) : null,
        JSON.stringify(input.tags),
        input.icon || null,
        input.homepage || null,
        input.repository || null,
        now,
        now
    );

    return getPlugin(id)!;
}

/**
 * Get a plugin by ID
 */
export function getPlugin(id: string): AgentPlugin | null {
    const stored = getDb().prepare(`
        SELECT * FROM plugins WHERE id = ?
    `).get(id) as StoredPlugin | undefined;

    if (!stored) return null;

    const ratings = getRatingStats(id);
    return toPluginResponse(stored, ratings);
}

/**
 * Update a plugin
 */
export function updatePlugin(
    id: string,
    input: UpdatePluginInput,
    authorId: string
): AgentPlugin | null {
    const db = getDb();
    const existing = db.prepare(`
        SELECT * FROM plugins WHERE id = ? AND author_id = ?
    `).get(id, authorId) as StoredPlugin | undefined;

    if (!existing) return null;

    const now = new Date().toISOString();

    db.prepare(`
        UPDATE plugins SET
            name = COALESCE(?, name),
            version = COALESCE(?, version),
            description = COALESCE(?, description),
            long_description = COALESCE(?, long_description),
            system_prompt_extension = COALESCE(?, system_prompt_extension),
            tools = COALESCE(?, tools),
            tags = COALESCE(?, tags),
            icon = COALESCE(?, icon),
            homepage = COALESCE(?, homepage),
            repository = COALESCE(?, repository),
            updated_at = ?
        WHERE id = ?
    `).run(
        input.name ?? null,
        input.version ?? null,
        input.description ?? null,
        input.longDescription ?? null,
        input.systemPromptExtension ?? null,
        input.tools ? JSON.stringify(input.tools) : null,
        input.tags ? JSON.stringify(input.tags) : null,
        input.icon ?? null,
        input.homepage ?? null,
        input.repository ?? null,
        now,
        id
    );

    return getPlugin(id);
}

/**
 * Delete a plugin
 */
export function deletePlugin(id: string, authorId: string): boolean {
    const result = getDb().prepare(`
        DELETE FROM plugins WHERE id = ? AND author_id = ?
    `).run(id, authorId);

    return result.changes > 0;
}

/**
 * List plugins with filtering and pagination
 */
export function listPlugins(filters: PluginFilters = {}): PluginListResponse {
    const db = getDb();
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (filters.search) {
        whereClause += ` AND (name LIKE ? OR description LIKE ?)`;
        params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.agentName) {
        whereClause += ` AND agent_name = ?`;
        params.push(filters.agentName);
    }

    if (filters.tags && filters.tags.length > 0) {
        for (const tag of filters.tags) {
            whereClause += ` AND tags LIKE ?`;
            params.push(`%"${tag}"%`);
        }
    }

    // Get total count
    const countResult = db.prepare(`
        SELECT COUNT(*) as count FROM plugins WHERE ${whereClause}
    `).get(...params) as { count: number };

    // Determine sort order
    let orderBy = 'created_at DESC';
    if (filters.sortBy === 'downloads') {
        orderBy = 'downloads DESC';
    } else if (filters.sortBy === 'rating') {
        // We'll need a subquery for this
        orderBy = 'downloads DESC'; // Fallback for now
    }

    // Get plugins
    const stored = db.prepare(`
        SELECT * FROM plugins 
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as StoredPlugin[];

    const plugins = stored.map(s => {
        const ratings = getRatingStats(s.id);
        return toPluginResponse(s, ratings);
    });

    return {
        plugins,
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
    };
}

/**
 * Increment download count
 */
export function incrementDownloads(id: string): void {
    getDb().prepare(`
        UPDATE plugins SET downloads = downloads + 1 WHERE id = ?
    `).run(id);
}

// ============================================================================
// RATINGS
// ============================================================================

/**
 * Add or update a rating
 */
export function ratePlugin(
    pluginId: string,
    userId: string,
    userName: string,
    input: RatingInput
): PluginRating {
    const db = getDb();
    const now = new Date().toISOString();
    const id = randomUUID();

    // Upsert rating
    db.prepare(`
        INSERT INTO plugin_ratings (id, plugin_id, user_id, user_name, stars, review, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(plugin_id, user_id) DO UPDATE SET
            stars = excluded.stars,
            review = excluded.review,
            created_at = excluded.created_at
    `).run(id, pluginId, userId, userName, input.stars, input.review || null, now);

    // Get the rating we just created/updated
    const stored = db.prepare(`
        SELECT * FROM plugin_ratings WHERE plugin_id = ? AND user_id = ?
    `).get(pluginId, userId) as StoredRating;

    return {
        id: stored.id,
        pluginId: stored.plugin_id,
        userId: stored.user_id,
        userName: stored.user_name,
        stars: stored.stars as 1 | 2 | 3 | 4 | 5,
        review: stored.review || undefined,
        createdAt: stored.created_at
    };
}

/**
 * Get ratings for a plugin
 */
export function getPluginRatings(pluginId: string): PluginRating[] {
    const stored = getDb().prepare(`
        SELECT * FROM plugin_ratings 
        WHERE plugin_id = ?
        ORDER BY created_at DESC
    `).all(pluginId) as StoredRating[];

    return stored.map(s => ({
        id: s.id,
        pluginId: s.plugin_id,
        userId: s.user_id,
        userName: s.user_name,
        stars: s.stars as 1 | 2 | 3 | 4 | 5,
        review: s.review || undefined,
        createdAt: s.created_at
    }));
}

/**
 * Delete a rating
 */
export function deleteRating(ratingId: string, userId: string): boolean {
    const result = getDb().prepare(`
        DELETE FROM plugin_ratings WHERE id = ? AND user_id = ?
    `).run(ratingId, userId);

    return result.changes > 0;
}
