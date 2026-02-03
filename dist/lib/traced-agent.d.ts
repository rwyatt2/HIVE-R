/**
 * Traced Agent Factory
 *
 * Wraps agent nodes with tracing for observability.
 * Use this to wrap existing agent nodes.
 */
import type { ArtifactStore } from "./artifact-store.js";
import type { Artifact } from "./artifacts.js";
/**
 * Wrap an agent node with tracing
 */
export declare function createTracedNode<TState extends {
    messages: unknown[];
    artifactStore?: ArtifactStore;
}>(agentName: string, node: (state: TState) => Promise<Partial<TState>>): (state: TState) => Promise<Partial<TState>>;
/**
 * Create a node that automatically:
 * 1. Checks artifact requirements before running
 * 2. Injects artifact context into state
 * 3. Stores produced artifacts
 */
export declare function createArtifactAwareNode<TState extends {
    messages: unknown[];
    artifactStore: ArtifactStore;
}>(agentName: string, node: (state: TState, artifactContext: string) => Promise<{
    result: Partial<TState>;
    producedArtifact?: Artifact;
}>): (state: TState) => Promise<Partial<TState>>;
/**
 * Full-featured agent wrapper with tracing + artifacts
 */
export declare function createEnhancedNode<TState extends {
    messages: unknown[];
    artifactStore: ArtifactStore;
}>(agentName: string, node: (state: TState, artifactContext: string) => Promise<{
    result: Partial<TState>;
    producedArtifact?: Artifact;
}>): (state: TState) => Promise<Partial<TState>>;
//# sourceMappingURL=traced-agent.d.ts.map