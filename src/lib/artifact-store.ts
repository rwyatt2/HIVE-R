/**
 * Artifact Store
 * 
 * Shared context store for structured artifacts that agents produce and consume.
 * Instead of re-parsing message history, agents access typed artifacts directly.
 */

import type {
    PRDArtifact,
    DesignSpec,
    TechPlan,
    SecurityReview,
    TestPlan,
    CodeReview,
    Artifact
} from "./artifacts.js";
import { logger } from "./logger.js";

// ============================================================================
// ARTIFACT STORE INTERFACE
// ============================================================================

export interface ArtifactStore {
    prd: PRDArtifact | null;
    designSpec: DesignSpec | null;
    techPlan: TechPlan | null;
    securityReview: SecurityReview | null;
    testPlan: TestPlan | null;
    codeReview: CodeReview | null;

    // Track which agent produced each artifact
    producers: Record<string, string>;

    // Timestamps
    timestamps: Record<string, number>;
}

// ============================================================================
// STORE FACTORY
// ============================================================================

export function createArtifactStore(): ArtifactStore {
    return {
        prd: null,
        designSpec: null,
        techPlan: null,
        securityReview: null,
        testPlan: null,
        codeReview: null,
        producers: {},
        timestamps: {},
    };
}

// ============================================================================
// STORE OPERATIONS
// ============================================================================

type ArtifactType = "PRD" | "DesignSpec" | "TechPlan" | "SecurityReview" | "TestPlan" | "CodeReview";

const TYPE_TO_KEY: Record<ArtifactType, keyof ArtifactStore> = {
    PRD: "prd",
    DesignSpec: "designSpec",
    TechPlan: "techPlan",
    SecurityReview: "securityReview",
    TestPlan: "testPlan",
    CodeReview: "codeReview",
};

/**
 * Get display name for an artifact (handles CodeReview which has no title)
 */
function getArtifactName(artifact: Artifact): string {
    if (artifact.type === "CodeReview") {
        return `Code Review (${artifact.verdict})`;
    }
    return artifact.title;
}

/**
 * Store an artifact in the artifact store
 */
export function storeArtifact(
    store: ArtifactStore,
    artifact: Artifact,
    producerAgent: string
): ArtifactStore {
    const key = TYPE_TO_KEY[artifact.type as ArtifactType];

    if (!key) {
        logger.warn(`Unknown artifact type: ${artifact.type}`);
        return store;
    }

    logger.info({
        type: artifact.type,
        producer: producerAgent,
        name: getArtifactName(artifact)
    }, `📦 Storing artifact`);

    return {
        ...store,
        [key]: artifact,
        producers: { ...store.producers, [artifact.type]: producerAgent },
        timestamps: { ...store.timestamps, [artifact.type]: Date.now() },
    };
}

/**
 * Retrieve an artifact by type
 */
export function getArtifact<T extends Artifact>(
    store: ArtifactStore,
    type: ArtifactType
): T | null {
    const key = TYPE_TO_KEY[type];
    return (store[key] as T) ?? null;
}

/**
 * Check if artifact exists
 */
export function hasArtifact(store: ArtifactStore, type: ArtifactType): boolean {
    const key = TYPE_TO_KEY[type];
    return store[key] !== null;
}

/**
 * Get all available artifacts (non-null)
 */
export function getAvailableArtifacts(store: ArtifactStore): Artifact[] {
    const artifacts: Artifact[] = [];

    if (store.prd) artifacts.push(store.prd);
    if (store.designSpec) artifacts.push(store.designSpec);
    if (store.techPlan) artifacts.push(store.techPlan);
    if (store.securityReview) artifacts.push(store.securityReview);
    if (store.testPlan) artifacts.push(store.testPlan);
    if (store.codeReview) artifacts.push(store.codeReview);

    return artifacts;
}

// ============================================================================
// FORMAT FOR AGENT PROMPTS
// ============================================================================

/**
 * Format available artifacts as context for agent prompts
 */
export function formatArtifactsForPrompt(store: ArtifactStore): string {
    const available = getAvailableArtifacts(store);

    if (available.length === 0) {
        return "";
    }

    const sections: string[] = [
        "\n## 📦 Available Artifacts\n",
        "The following structured artifacts have been produced by other agents:\n"
    ];

    for (const artifact of available) {
        const producer = store.producers[artifact.type] ?? "unknown";
        const timestamp = store.timestamps[artifact.type];
        const age = timestamp ? Math.round((Date.now() - timestamp) / 1000) : 0;

        sections.push(`### ${artifact.type} (by ${producer}, ${age}s ago)`);
        sections.push(`**${getArtifactName(artifact)}**\n`);

        // Add type-specific summaries
        switch (artifact.type) {
            case "PRD":
                sections.push(`- Goal: ${artifact.goal}`);
                sections.push(`- User Stories: ${artifact.userStories.length}`);
                sections.push(`- Success Metrics: ${artifact.successMetrics.join(", ")}`);
                break;
            case "DesignSpec":
                sections.push(`- Components: ${artifact.components.map(c => c.name).join(", ")}`);
                sections.push(`- User Flow Steps: ${artifact.userFlow.length}`);
                break;
            case "TechPlan":
                sections.push(`- Overview: ${artifact.overview}`);
                sections.push(`- Implementation Steps: ${artifact.implementationSteps.length}`);
                break;
            case "SecurityReview":
                sections.push(`- Threats Identified: ${artifact.threatModel.length}`);
                sections.push(`- Vulnerabilities: ${artifact.vulnerabilities.length}`);
                break;
            case "TestPlan":
                sections.push(`- Strategy: ${artifact.strategy}`);
                sections.push(`- Test Cases: ${artifact.testCases.length}`);
                break;
            case "CodeReview":
                sections.push(`- Verdict: ${artifact.verdict}`);
                sections.push(`- Must Fix: ${artifact.mustFix.length}`);
                break;
        }
        sections.push("");
    }

    return sections.join("\n");
}

/**
 * Get specific artifact formatted for an agent
 */
export function formatArtifactForAgent(artifact: Artifact): string {
    return `## ${artifact.type}: ${getArtifactName(artifact)}\n\n\`\`\`json\n${JSON.stringify(artifact, null, 2)}\n\`\`\``;
}

// ============================================================================
// ARTIFACT DEPENDENCIES
// ============================================================================

/**
 * Define what artifacts each agent type needs
 */
export const AGENT_ARTIFACT_REQUIREMENTS: Record<string, ArtifactType[]> = {
    ProductManager: [],  // Creates PRD from scratch
    Designer: ["PRD"],   // Needs PRD to create DesignSpec
    Accessibility: ["PRD", "DesignSpec"],
    Planner: ["PRD", "DesignSpec"],  // Needs both to create TechPlan
    Security: ["TechPlan"],  // Reviews the plan
    Builder: ["TechPlan", "DesignSpec"],  // Implements based on both
    Reviewer: ["TechPlan"],  // Reviews against plan
    Tester: ["PRD", "DesignSpec", "TechPlan"],  // Creates test plan from all
};

/**
 * Check if an agent has required artifacts to proceed
 */
export function checkArtifactRequirements(
    store: ArtifactStore,
    agentName: string
): { ready: boolean; missing: ArtifactType[] } {
    const required = AGENT_ARTIFACT_REQUIREMENTS[agentName] ?? [];
    const missing = required.filter(type => !hasArtifact(store, type));

    return {
        ready: missing.length === 0,
        missing,
    };
}
