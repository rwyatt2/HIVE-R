/**
 * Plugin System for Custom Agents
 * 
 * Allows users to extend HIVE-R with custom agents by dropping
 * configuration files into the plugins/ directory.
 */

import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "./prompts.js";
import { safeAgentCall, createAgentResponse } from "./utils.js";
import { logger } from "./logger.js";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// PLUGIN INTERFACE
// ============================================================================

/**
 * Schema for defining a custom agent plugin
 */
export interface AgentPlugin {
    /** Unique identifier (used as node name) */
    name: string;

    /** Human-readable role title */
    role: string;

    /** Description for the Router (helps it decide when to invoke) */
    description: string;

    /** The agent's system prompt / persona */
    systemPrompt: string;

    /** Model to use (defaults to gpt-4o) */
    model?: string;

    /** Temperature (defaults to 0.3) */
    temperature?: number;

    /** Optional tools the agent can use */
    tools?: any[];

    /** Keywords that help Router identify when to use this agent */
    keywords?: string[];
}

// ============================================================================
// PLUGIN REGISTRY
// ============================================================================

class PluginRegistry {
    private plugins: Map<string, AgentPlugin> = new Map();
    private pluginDir: string;

    constructor(pluginDir?: string) {
        this.pluginDir = pluginDir || path.join(process.cwd(), "plugins");
    }

    /**
     * Load all plugins from the plugins directory
     */
    async loadPlugins(): Promise<AgentPlugin[]> {
        if (!fs.existsSync(this.pluginDir)) {
            logger.info("📦 No plugins directory found, skipping plugin loading");
            return [];
        }

        const files = fs.readdirSync(this.pluginDir);
        const jsFiles = files.filter(f => f.endsWith(".js") || f.endsWith(".mjs"));

        for (const file of jsFiles) {
            try {
                const filePath = path.join(this.pluginDir, file);
                const module = await import(`file://${filePath}`);

                // Look for exported plugin definitions
                for (const [key, value] of Object.entries(module)) {
                    if (this.isValidPlugin(value)) {
                        this.registerPlugin(value as AgentPlugin);
                    }
                }
            } catch (error) {
                logger.error({ error: String(error) }, `Failed to load plugin ${file}:`);
            }
        }

        logger.info(`📦 Loaded ${this.plugins.size} custom plugins`);
        return this.getAllPlugins();
    }

    /**
     * Register a plugin manually
     */
    registerPlugin(plugin: AgentPlugin): void {
        if (!this.isValidPlugin(plugin)) {
            throw new Error(`Invalid plugin: ${JSON.stringify(plugin)}`);
        }

        this.plugins.set(plugin.name, plugin);
        logger.info(`✅ Registered plugin: ${plugin.name} (${plugin.role})`);
    }

    /**
     * Get a plugin by name
     */
    getPlugin(name: string): AgentPlugin | undefined {
        return this.plugins.get(name);
    }

    /**
     * Get all registered plugins
     */
    getAllPlugins(): AgentPlugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get plugin names for Router awareness
     */
    getPluginNames(): string[] {
        return Array.from(this.plugins.keys());
    }

    /**
     * Format plugins for Router prompt injection
     */
    formatForRouter(): string {
        if (this.plugins.size === 0) return "";

        let output = "\n\n## Custom Agents (Plugins)\n";
        for (const plugin of this.plugins.values()) {
            output += `- **${plugin.name}** (${plugin.role}): ${plugin.description}`;
            if (plugin.keywords?.length) {
                output += ` [Keywords: ${plugin.keywords.join(", ")}]`;
            }
            output += "\n";
        }
        return output;
    }

    /**
     * Type guard to validate plugin structure
     */
    private isValidPlugin(obj: unknown): obj is AgentPlugin {
        if (!obj || typeof obj !== "object") return false;
        const p = obj as Partial<AgentPlugin>;
        return (
            typeof p.name === "string" &&
            typeof p.role === "string" &&
            typeof p.description === "string" &&
            typeof p.systemPrompt === "string"
        );
    }
}

// ============================================================================
// PLUGIN NODE FACTORY
// ============================================================================

/**
 * Create a LangGraph node function from a plugin definition
 */
export function createPluginNode(plugin: AgentPlugin) {
    const llm = new ChatOpenAI({
        modelName: plugin.model || "gpt-4o",
        temperature: plugin.temperature ?? 0.3,
    });

    const boundLlm = plugin.tools?.length ? llm.bindTools(plugin.tools) : llm;

    const fullPrompt = `${HIVE_PREAMBLE}

You are **${plugin.role}** — a specialist brought in for specific expertise.

${plugin.systemPrompt}

${CONTEXT_PROTOCOL}`;

    return async (state: typeof AgentState.State) => {
        return safeAgentCall(
            async () => {
                const response = await boundLlm.invoke([
                    new SystemMessage(fullPrompt),
                    ...state.messages,
                ]);

                return createAgentResponse(
                    response.content as string,
                    plugin.name
                );
            },
            plugin.name,
            state.messages,
            undefined,
            `${plugin.role} encountered an error. Please retry.`
        );
    };
}

// ============================================================================
// SINGLETON REGISTRY
// ============================================================================

export const pluginRegistry = new PluginRegistry();

/**
 * Initialize plugins (call before graph compilation)
 */
export async function initializePlugins(): Promise<AgentPlugin[]> {
    return pluginRegistry.loadPlugins();
}

/**
 * Get router prompt extension for plugins
 */
export function getPluginRouterContext(): string {
    return pluginRegistry.formatForRouter();
}

/**
 * Get all plugin names
 */
export function getPluginNames(): string[] {
    return pluginRegistry.getPluginNames();
}
