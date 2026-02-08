/**
 * Plugin System Types
 * 
 * Complete API contract for HIVE-R plugins.
 */

// ─── Plugin Manifest ────────────────────────────────────────────────────────

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    homepage?: string;
    repository?: string;
    license?: string;
    icon?: string;

    // Requirements
    minHiveVersion?: string;
    dependencies?: Record<string, string>;

    // What the plugin provides
    capabilities: {
        tools?: boolean;
        agents?: boolean;
        uiComponents?: boolean;
        apiEndpoints?: boolean;
    };

    // Configuration schema (JSON Schema format)
    configSchema?: {
        type: 'object';
        properties: Record<string, ConfigProperty>;
        required?: string[];
    };
}

export interface ConfigProperty {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
    default?: unknown;
    enum?: unknown[];
}

// ─── Plugin Interface ───────────────────────────────────────────────────────

export interface Plugin {
    manifest: PluginManifest;

    // Lifecycle hooks
    onInstall?: () => Promise<void>;
    onUninstall?: () => Promise<void>;
    onEnable?: () => Promise<void>;
    onDisable?: () => Promise<void>;
    onConfigure?: (config: Record<string, unknown>) => Promise<void>;

    // Extensions
    getTools?: () => PluginTool[];
    getAgents?: () => AgentDefinition[];
    getComponents?: () => PluginComponents;
    getRoutes?: () => PluginRoute[];
}

// ─── Plugin Extensions ──────────────────────────────────────────────────────

export interface PluginTool {
    name: string;
    description: string;
    execute: (input: string) => Promise<string>;
}

export interface AgentDefinition {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    tools?: string[];
    model?: string;
}

export interface PluginComponents {
    agentPanel?: React.ComponentType<unknown>;
    settingsPanel?: React.ComponentType<unknown>;
    dashboardWidget?: React.ComponentType<unknown>;
}

export interface PluginRoute {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    handler: (req: unknown, res: unknown) => Promise<void>;
}

// ─── Plugin Config ──────────────────────────────────────────────────────────

export interface PluginConfig {
    pluginId: string;
    enabled: boolean;
    config: Record<string, unknown>;
    installedAt: string;
    version: string;
}

// ─── Marketplace Types ──────────────────────────────────────────────────────

export interface MarketplacePlugin extends PluginManifest {
    downloads?: number;
    rating?: number;
    featured?: boolean;
    category?: PluginCategory;
}

export type PluginCategory =
    | 'integrations'
    | 'productivity'
    | 'ai-models'
    | 'analytics'
    | 'security'
    | 'other';

export interface InstalledPlugin {
    manifest: PluginManifest;
    config: PluginConfig;
    status: 'enabled' | 'disabled' | 'error';
}
