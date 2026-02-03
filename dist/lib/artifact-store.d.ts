/**
 * Artifact Store
 *
 * Shared context store for structured artifacts that agents produce and consume.
 * Instead of re-parsing message history, agents access typed artifacts directly.
 */
import type { PRDArtifact, DesignSpec, TechPlan, SecurityReview, TestPlan, CodeReview, Artifact } from "./artifacts.js";
export interface ArtifactStore {
    prd: PRDArtifact | null;
    designSpec: DesignSpec | null;
    techPlan: TechPlan | null;
    securityReview: SecurityReview | null;
    testPlan: TestPlan | null;
    codeReview: CodeReview | null;
    producers: Record<string, string>;
    timestamps: Record<string, number>;
}
export declare function createArtifactStore(): ArtifactStore;
type ArtifactType = "PRD" | "DesignSpec" | "TechPlan" | "SecurityReview" | "TestPlan" | "CodeReview";
/**
 * Store an artifact in the artifact store
 */
export declare function storeArtifact(store: ArtifactStore, artifact: Artifact, producerAgent: string): ArtifactStore;
/**
 * Retrieve an artifact by type
 */
export declare function getArtifact<T extends Artifact>(store: ArtifactStore, type: ArtifactType): T | null;
/**
 * Check if artifact exists
 */
export declare function hasArtifact(store: ArtifactStore, type: ArtifactType): boolean;
/**
 * Get all available artifacts (non-null)
 */
export declare function getAvailableArtifacts(store: ArtifactStore): Artifact[];
/**
 * Format available artifacts as context for agent prompts
 */
export declare function formatArtifactsForPrompt(store: ArtifactStore): string;
/**
 * Get specific artifact formatted for an agent
 */
export declare function formatArtifactForAgent(artifact: Artifact): string;
/**
 * Define what artifacts each agent type needs
 */
export declare const AGENT_ARTIFACT_REQUIREMENTS: Record<string, ArtifactType[]>;
/**
 * Check if an agent has required artifacts to proceed
 */
export declare function checkArtifactRequirements(store: ArtifactStore, agentName: string): {
    ready: boolean;
    missing: ArtifactType[];
};
export {};
//# sourceMappingURL=artifact-store.d.ts.map