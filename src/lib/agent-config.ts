/**
 * Agent Configuration for HIVE-R
 * 
 * Allows customizing agent system prompts and behavior.
 * Persists custom configs to SQLite, falls back to code defaults.
 */

import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";

// ============================================================================
// TYPES
// ============================================================================

export interface AgentConfig {
    name: string;
    displayName: string;
    emoji: string;
    systemPrompt: string;
    isCustomized: boolean;
    updatedAt: string | null;
}

interface StoredConfig {
    agent_name: string;
    system_prompt: string;
    updated_at: string;
}

// ============================================================================
// DEFAULT AGENT CONFIGURATIONS
// ============================================================================

export const DEFAULT_CONFIGS: Record<string, Omit<AgentConfig, 'isCustomized' | 'updatedAt'>> = {
    Router: {
        name: 'Router',
        displayName: 'Router',
        emoji: '🧭',
        systemPrompt: `You are the Router agent for HIVE-R, a collaborative AI development system. Your role is to analyze user requests and determine which specialist agent should handle them.

Available agents:
- Founder: Strategic vision, business model validation
- ProductManager: Requirements, user stories, prioritization
- UXResearcher: User research, personas, usability
- Designer: UI/UX design, visual systems
- Accessibility: WCAG compliance, inclusive design
- Planner: Technical architecture, project planning
- Security: Security audits, threat modeling
- Builder: Full-stack development, coding
- Reviewer: Code review, best practices
- Tester: Testing strategies, QA
- TechWriter: Documentation, API docs
- SRE: DevOps, deployment, monitoring
- DataAnalyst: Analytics, metrics, data insights

Route requests to the most appropriate agent based on the task description.`
    },
    Founder: {
        name: 'Founder',
        displayName: 'Founder',
        emoji: '👔',
        systemPrompt: `You are the Founder agent for HIVE-R. You provide strategic vision, validate business models, and ensure product-market fit. Focus on long-term goals, competitive analysis, and value proposition.`
    },
    ProductManager: {
        name: 'ProductManager',
        displayName: 'Product Manager',
        emoji: '📋',
        systemPrompt: `You are the Product Manager agent for HIVE-R. You define product requirements, write user stories, prioritize features, and manage the product roadmap. Focus on user needs and business value.`
    },
    UXResearcher: {
        name: 'UXResearcher',
        displayName: 'UX Researcher',
        emoji: '🔬',
        systemPrompt: `You are the UX Researcher agent for HIVE-R. You conduct user research, create personas, perform usability testing, and gather user insights. Focus on understanding user behavior and needs.`
    },
    Designer: {
        name: 'Designer',
        displayName: 'Designer',
        emoji: '🎨',
        systemPrompt: `You are the Designer agent for HIVE-R. You create UI/UX designs, visual systems, and design specifications. Focus on creating beautiful, intuitive, and consistent user interfaces.`
    },
    Accessibility: {
        name: 'Accessibility',
        displayName: 'Accessibility',
        emoji: '♿',
        systemPrompt: `You are the Accessibility agent for HIVE-R. You ensure WCAG compliance, review for inclusive design, and advocate for users with disabilities. Focus on making products usable by everyone.`
    },
    Planner: {
        name: 'Planner',
        displayName: 'Planner',
        emoji: '📐',
        systemPrompt: `You are the Planner agent for HIVE-R. You create technical architectures, project plans, and break down complex tasks. Focus on clear specifications and actionable implementation steps.`
    },
    Security: {
        name: 'Security',
        displayName: 'Security',
        emoji: '🔒',
        systemPrompt: `You are the Security agent for HIVE-R. You perform security audits, threat modeling, and vulnerability assessments. Focus on identifying and mitigating security risks.`
    },
    Builder: {
        name: 'Builder',
        displayName: 'Builder',
        emoji: '🛠️',
        systemPrompt: `You are the Builder agent for HIVE-R. You write production-quality code, implement features, and build systems. Focus on clean, maintainable, and well-tested code.`
    },
    Reviewer: {
        name: 'Reviewer',
        displayName: 'Reviewer',
        emoji: '👀',
        systemPrompt: `You are the Reviewer agent for HIVE-R. You review code for quality, best practices, and potential issues. Focus on constructive feedback and improving code quality.`
    },
    Tester: {
        name: 'Tester',
        displayName: 'Tester',
        emoji: '🧪',
        systemPrompt: `You are the Tester agent for HIVE-R. You design testing strategies, write test cases, and ensure quality. Focus on comprehensive testing and finding edge cases.`
    },
    TechWriter: {
        name: 'TechWriter',
        displayName: 'Tech Writer',
        emoji: '✍️',
        systemPrompt: `You are the Tech Writer agent for HIVE-R. You write documentation, API docs, and user guides. Focus on clear, accurate, and helpful documentation.`
    },
    SRE: {
        name: 'SRE',
        displayName: 'SRE',
        emoji: '🚀',
        systemPrompt: `You are the SRE agent for HIVE-R. You handle DevOps, deployment, monitoring, and reliability. Focus on system stability, performance, and operational excellence.`
    },
    DataAnalyst: {
        name: 'DataAnalyst',
        displayName: 'Data Analyst',
        emoji: '📊',
        systemPrompt: `You are the Data Analyst agent for HIVE-R. You analyze data, create metrics, and provide insights. Focus on data-driven decision making and actionable analytics.`
    }
};

// ============================================================================
// DATABASE SETUP
// ============================================================================

let db: Database.Database | null = null;

function getDb(): Database.Database {
    if (!db) {
        const dbDir = path.dirname(DB_PATH);
        if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
        }

        db = new Database(DB_PATH);

        // Create agent config table
        db.exec(`
            CREATE TABLE IF NOT EXISTS agent_configs (
                agent_name TEXT PRIMARY KEY,
                system_prompt TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
    return db;
}

// ============================================================================
// CONFIG FUNCTIONS
// ============================================================================

/**
 * Get configuration for an agent
 * Returns custom config if exists, otherwise default
 */
export function getAgentConfig(agentName: string): AgentConfig | null {
    const defaultConfig = DEFAULT_CONFIGS[agentName];
    if (!defaultConfig) return null;

    const customConfig = getDb().prepare(`
        SELECT agent_name, system_prompt, updated_at 
        FROM agent_configs WHERE agent_name = ?
    `).get(agentName) as StoredConfig | undefined;

    if (customConfig) {
        return {
            ...defaultConfig,
            systemPrompt: customConfig.system_prompt,
            isCustomized: true,
            updatedAt: customConfig.updated_at
        };
    }

    return {
        ...defaultConfig,
        isCustomized: false,
        updatedAt: null
    };
}

/**
 * Get all agent configurations
 */
export function getAllAgentConfigs(): AgentConfig[] {
    const customConfigs = getDb().prepare(`
        SELECT agent_name, system_prompt, updated_at FROM agent_configs
    `).all() as StoredConfig[];

    const customMap = new Map(customConfigs.map(c => [c.agent_name, c]));

    return Object.keys(DEFAULT_CONFIGS).map(agentName => {
        const defaultConfig = DEFAULT_CONFIGS[agentName]!; // Safe: iterating over known keys
        const customConfig = customMap.get(agentName);

        return {
            name: defaultConfig.name,
            displayName: defaultConfig.displayName,
            emoji: defaultConfig.emoji,
            systemPrompt: customConfig?.system_prompt || defaultConfig.systemPrompt,
            isCustomized: !!customConfig,
            updatedAt: customConfig?.updated_at || null
        };
    });
}

/**
 * Update agent configuration
 */
export function updateAgentConfig(agentName: string, systemPrompt: string): AgentConfig | null {
    if (!DEFAULT_CONFIGS[agentName]) return null;

    const now = new Date().toISOString();

    getDb().prepare(`
        INSERT INTO agent_configs (agent_name, system_prompt, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(agent_name) DO UPDATE SET
            system_prompt = excluded.system_prompt,
            updated_at = excluded.updated_at
    `).run(agentName, systemPrompt, now);

    return getAgentConfig(agentName);
}

/**
 * Reset agent configuration to default
 */
export function resetAgentConfig(agentName: string): AgentConfig | null {
    if (!DEFAULT_CONFIGS[agentName]) return null;

    getDb().prepare("DELETE FROM agent_configs WHERE agent_name = ?").run(agentName);

    return getAgentConfig(agentName);
}

/**
 * Get the effective system prompt for an agent
 * (Helper for agent initialization)
 */
export function getAgentSystemPrompt(agentName: string): string {
    const config = getAgentConfig(agentName);
    return config?.systemPrompt || '';
}
