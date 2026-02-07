/**
 * Plugin Loader
 * 
 * Loads plugins from the local plugins/ directory and applies them to agents.
 * Also handles downloading plugins from the registry.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { AgentPlugin, PluginTool } from '../types/plugin.js';
import * as pluginRegistry from './plugin-registry.js';
import { logger } from './logger.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PLUGINS_DIR = process.env.PLUGINS_PATH || './plugins';

// Ensure plugins directory exists
if (!existsSync(PLUGINS_DIR)) {
    mkdirSync(PLUGINS_DIR, { recursive: true });
}

// ============================================================================
// LOCAL PLUGIN STORAGE
// ============================================================================

/** In-memory cache of loaded plugins */
const loadedPlugins = new Map<string, AgentPlugin>();

/** Plugins organized by target agent */
const pluginsByAgent = new Map<string, AgentPlugin[]>();

/**
 * Load all plugins from the plugins/ directory
 */
export function loadPlugins(): void {
    loadedPlugins.clear();
    pluginsByAgent.clear();

    if (!existsSync(PLUGINS_DIR)) {
        logger.info('No plugins directory found');
        return;
    }

    const files = readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        try {
            const content = readFileSync(join(PLUGINS_DIR, file), 'utf-8');
            const plugin = JSON.parse(content) as AgentPlugin;

            // Validate required fields
            if (!plugin.id || !plugin.name || !plugin.agentName) {
                logger.warn({ file }, `Invalid plugin file: ${file}`);
                continue;
            }

            loadedPlugins.set(plugin.id, plugin);

            // Index by agent
            const agentPlugins = pluginsByAgent.get(plugin.agentName) || [];
            agentPlugins.push(plugin);
            pluginsByAgent.set(plugin.agentName, agentPlugins);

            logger.info({ pluginId: plugin.id, pluginName: plugin.name, version: plugin.version, agent: plugin.agentName }, `Loaded plugin: ${plugin.name} v${plugin.version} for ${plugin.agentName}`);
        } catch (error) {
            logger.error({ err: error, file }, `Failed to load plugin ${file}`);
        }
    }

    logger.info({ count: loadedPlugins.size }, `Loaded ${loadedPlugins.size} plugins`);
}

/**
 * Get all loaded plugins
 */
export function getLoadedPlugins(): AgentPlugin[] {
    return Array.from(loadedPlugins.values());
}

/**
 * Get plugins for a specific agent
 */
export function getPluginsForAgent(agentName: string): AgentPlugin[] {
    return pluginsByAgent.get(agentName) || [];
}

/**
 * Check if a plugin is installed locally
 */
export function isPluginInstalled(pluginId: string): boolean {
    return loadedPlugins.has(pluginId);
}

// ============================================================================
// INSTALL / UNINSTALL
// ============================================================================

/**
 * Install a plugin from the registry
 */
export function installPlugin(pluginId: string): AgentPlugin | null {
    // Get plugin from registry
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (!plugin) {
        logger.error({ pluginId }, `Plugin not found: ${pluginId}`);
        return null;
    }

    // Save to plugins directory
    const filename = `${plugin.id}.json`;
    const filepath = join(PLUGINS_DIR, filename);

    writeFileSync(filepath, JSON.stringify(plugin, null, 2));

    // Increment download count
    pluginRegistry.incrementDownloads(pluginId);

    // Reload plugins
    loadPlugins();

    logger.info({ pluginId: plugin.id, pluginName: plugin.name }, `Installed plugin: ${plugin.name}`);
    return plugin;
}

/**
 * Uninstall a plugin
 */
export function uninstallPlugin(pluginId: string): boolean {
    const filename = `${pluginId}.json`;
    const filepath = join(PLUGINS_DIR, filename);

    if (!existsSync(filepath)) {
        return false;
    }

    unlinkSync(filepath);

    // Reload plugins
    loadPlugins();

    logger.info({ pluginId }, `Uninstalled plugin: ${pluginId}`);
    return true;
}

// ============================================================================
// PLUGIN APPLICATION
// ============================================================================

/**
 * Result of applying plugins to an agent
 */
export interface PluginApplication {
    /** Extended system prompt (original + plugin extensions) */
    systemPrompt: string;
    /** Additional tools from plugins */
    tools: PluginTool[];
    /** Applied plugin names */
    appliedPlugins: string[];
}

/**
 * Apply all plugins for an agent to extend its capabilities
 */
export function applyPlugins(
    agentName: string,
    baseSystemPrompt: string
): PluginApplication {
    const plugins = getPluginsForAgent(agentName);

    if (plugins.length === 0) {
        return {
            systemPrompt: baseSystemPrompt,
            tools: [],
            appliedPlugins: []
        };
    }

    let extendedPrompt = baseSystemPrompt;
    const allTools: PluginTool[] = [];
    const appliedPlugins: string[] = [];

    for (const plugin of plugins) {
        // Add prompt extension
        if (plugin.systemPromptExtension) {
            extendedPrompt += `\n\n## Plugin: ${plugin.name}\n${plugin.systemPromptExtension}`;
        }

        // Add tools
        if (plugin.tools && plugin.tools.length > 0) {
            allTools.push(...plugin.tools);
        }

        appliedPlugins.push(plugin.name);
    }

    return {
        systemPrompt: extendedPrompt,
        tools: allTools,
        appliedPlugins
    };
}

/**
 * Get installed plugins with their local status
 */
export function getInstalledPlugins(): Array<AgentPlugin & { localPath: string }> {
    return Array.from(loadedPlugins.values()).map(plugin => ({
        ...plugin,
        localPath: join(PLUGINS_DIR, `${plugin.id}.json`)
    }));
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load plugins on module import
loadPlugins();
