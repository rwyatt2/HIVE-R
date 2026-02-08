/**
 * Artifact Store
 *
 * Shared context store for structured artifacts that agents produce and consume.
 * Instead of re-parsing message history, agents access typed artifacts directly.
 */
import { logger } from "./logger.js";
// ============================================================================
// STORE FACTORY
// ============================================================================
export function createArtifactStore() {
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
const TYPE_TO_KEY = {
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
function getArtifactName(artifact) {
    if (artifact.type === "CodeReview") {
        return `Code Review (${artifact.verdict})`;
    }
    return artifact.title;
}
/**
 * Store an artifact in the artifact store
 */
export function storeArtifact(store, artifact, producerAgent) {
    const key = TYPE_TO_KEY[artifact.type];
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
export function getArtifact(store, type) {
    const key = TYPE_TO_KEY[type];
    return store[key] ?? null;
}
/**
 * Check if artifact exists
 */
export function hasArtifact(store, type) {
    const key = TYPE_TO_KEY[type];
    return store[key] !== null;
}
/**
 * Get all available artifacts (non-null)
 */
export function getAvailableArtifacts(store) {
    const artifacts = [];
    if (store.prd)
        artifacts.push(store.prd);
    if (store.designSpec)
        artifacts.push(store.designSpec);
    if (store.techPlan)
        artifacts.push(store.techPlan);
    if (store.securityReview)
        artifacts.push(store.securityReview);
    if (store.testPlan)
        artifacts.push(store.testPlan);
    if (store.codeReview)
        artifacts.push(store.codeReview);
    return artifacts;
}
// ============================================================================
// FORMAT FOR AGENT PROMPTS
// ============================================================================
/**
 * Format available artifacts as context for agent prompts
 */
export function formatArtifactsForPrompt(store) {
    const available = getAvailableArtifacts(store);
    if (available.length === 0) {
        return "";
    }
    const sections = [
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
export function formatArtifactForAgent(artifact) {
    return `## ${artifact.type}: ${getArtifactName(artifact)}\n\n\`\`\`json\n${JSON.stringify(artifact, null, 2)}\n\`\`\``;
}
// ============================================================================
// ARTIFACT DEPENDENCIES
// ============================================================================
/**
 * Define what artifacts each agent type needs
 */
export const AGENT_ARTIFACT_REQUIREMENTS = {
    ProductManager: [], // Creates PRD from scratch
    Designer: ["PRD"], // Needs PRD to create DesignSpec
    Accessibility: ["PRD", "DesignSpec"],
    Planner: ["PRD", "DesignSpec"], // Needs both to create TechPlan
    Security: ["TechPlan"], // Reviews the plan
    Builder: ["TechPlan", "DesignSpec"], // Implements based on both
    Reviewer: ["TechPlan"], // Reviews against plan
    Tester: ["PRD", "DesignSpec", "TechPlan"], // Creates test plan from all
};
/**
 * Check if an agent has required artifacts to proceed
 */
export function checkArtifactRequirements(store, agentName) {
    const required = AGENT_ARTIFACT_REQUIREMENTS[agentName] ?? [];
    const missing = required.filter(type => !hasArtifact(store, type));
    return {
        ready: missing.length === 0,
        missing,
    };
}
//# sourceMappingURL=artifact-store.js.map