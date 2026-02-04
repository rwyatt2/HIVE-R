/**
 * Plugin Type Definitions
 * 
 * JSON-only plugins for safe agent extensions.
 * No executable code - only prompt extensions and tool definitions.
 */

import { z } from 'zod';

// ============================================================================
// PLUGIN TYPES
// ============================================================================

/**
 * Tool parameter definition for plugin tools
 */
export interface PluginToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: unknown;
}

/**
 * Tool definition that plugins can add to agents
 */
export interface PluginTool {
    name: string;
    description: string;
    parameters: PluginToolParameter[];
    /** URL endpoint to call when tool is invoked */
    endpoint?: string;
    /** HTTP method for the endpoint */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

/**
 * Main plugin interface
 */
export interface AgentPlugin {
    // Identity
    id: string;
    name: string;
    version: string;
    author: string;
    authorId: string;

    // Description
    description: string;
    longDescription?: string | undefined;

    // Target
    agentName: string;

    // Extensions (JSON-only, no executable code)
    systemPromptExtension?: string | undefined;
    tools?: PluginTool[] | undefined;

    // Metadata
    tags: string[];
    icon?: string | undefined;
    homepage?: string | undefined;
    repository?: string | undefined;

    // Stats (populated by registry)
    downloads?: number | undefined;
    averageRating?: number | undefined;
    ratingCount?: number | undefined;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

/**
 * Plugin stored in database
 */
export interface StoredPlugin {
    id: string;
    name: string;
    version: string;
    author: string;
    author_id: string;
    description: string;
    long_description: string | null;
    agent_name: string;
    system_prompt_extension: string | null;
    tools: string | null; // JSON string
    tags: string; // JSON array string
    icon: string | null;
    homepage: string | null;
    repository: string | null;
    downloads: number;
    created_at: string;
    updated_at: string;
}

/**
 * Plugin rating
 */
export interface PluginRating {
    id: string;
    pluginId: string;
    userId: string;
    userName: string;
    stars: 1 | 2 | 3 | 4 | 5;
    review?: string | undefined;
    createdAt: string;
}

/**
 * Stored rating in database
 */
export interface StoredRating {
    id: string;
    plugin_id: string;
    user_id: string;
    user_name: string;
    stars: number;
    review: string | null;
    created_at: string;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const PluginToolParameterSchema = z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    description: z.string().min(1).max(200),
    required: z.boolean(),
    default: z.unknown().optional()
});

export const PluginToolSchema = z.object({
    name: z.string().min(1).max(50).regex(/^[a-z_][a-z0-9_]*$/i, 'Tool name must be alphanumeric with underscores'),
    description: z.string().min(1).max(500),
    parameters: z.array(PluginToolParameterSchema).max(10),
    endpoint: z.string().url().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional()
});

export const CreatePluginSchema = z.object({
    name: z.string().min(3).max(50),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g., 1.0.0)'),
    description: z.string().min(10).max(200),
    longDescription: z.string().max(2000).optional(),
    agentName: z.string().min(1),
    systemPromptExtension: z.string().max(5000).optional(),
    tools: z.array(PluginToolSchema).max(5).optional(),
    tags: z.array(z.string().max(20)).max(5),
    icon: z.string().max(10).optional(), // Emoji
    homepage: z.string().url().optional(),
    repository: z.string().url().optional()
});

export const UpdatePluginSchema = CreatePluginSchema.partial();

export const RatingSchema = z.object({
    stars: z.number().int().min(1).max(5),
    review: z.string().max(500).optional()
});

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type CreatePluginInput = z.infer<typeof CreatePluginSchema>;
export type UpdatePluginInput = z.infer<typeof UpdatePluginSchema>;
export type RatingInput = z.infer<typeof RatingSchema>;

/**
 * Plugin list filters
 */
export interface PluginFilters {
    search?: string | undefined;
    agentName?: string | undefined;
    tags?: string[] | undefined;
    sortBy?: 'downloads' | 'rating' | 'newest' | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}

/**
 * Paginated plugin list response
 */
export interface PluginListResponse {
    plugins: AgentPlugin[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
