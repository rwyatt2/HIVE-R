/**
 * Traced Agent Factory
 *
 * Wraps agent nodes with tracing for observability.
 * Use this to wrap existing agent nodes.
 */
import { startSpan, endSpan, startTrace, endTrace } from "./tracing.js";
import { logger } from "./logger.js";
import { storeArtifact, formatArtifactsForPrompt, checkArtifactRequirements } from "./artifact-store.js";
// ============================================================================
// TRACED AGENT WRAPPER
// ============================================================================
/**
 * Wrap an agent node with tracing
 */
export function createTracedNode(agentName, node) {
    return async (state) => {
        const threadId = `thread-${Date.now()}`; // Ideally passed from state
        const startTime = Date.now();
        const spanId = startSpan(threadId, agentName, "agent", {
            messageCount: state.messages.length
        });
        logger.agentStart(agentName, { threadId });
        try {
            const result = await node(state);
            const duration = Date.now() - startTime;
            endSpan(spanId, {
                success: true,
                outputKeys: Object.keys(result)
            });
            logger.agentEnd(agentName, duration);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            endSpan(spanId, undefined, error.message);
            logger.agentError(agentName, error, { duration });
            throw error;
        }
    };
}
// ============================================================================
// ARTIFACT-AWARE NODE
// ============================================================================
/**
 * Create a node that automatically:
 * 1. Checks artifact requirements before running
 * 2. Injects artifact context into state
 * 3. Stores produced artifacts
 */
export function createArtifactAwareNode(agentName, node) {
    return async (state) => {
        // Check requirements
        const { ready, missing } = checkArtifactRequirements(state.artifactStore, agentName);
        if (!ready) {
            logger.warn(`${agentName} missing required artifacts`, { missing });
            // Could return early or continue with warning
        }
        // Format context
        const artifactContext = formatArtifactsForPrompt(state.artifactStore);
        // Run node
        const { result, producedArtifact } = await node(state, artifactContext);
        // Store produced artifact
        if (producedArtifact) {
            const updatedStore = storeArtifact(state.artifactStore, producedArtifact, agentName);
            return {
                ...result,
                artifactStore: updatedStore,
            };
        }
        return result;
    };
}
// ============================================================================
// COMBINED WRAPPER
// ============================================================================
/**
 * Full-featured agent wrapper with tracing + artifacts
 */
export function createEnhancedNode(agentName, node) {
    const artifactAwareNode = createArtifactAwareNode(agentName, node);
    return createTracedNode(agentName, artifactAwareNode);
}
//# sourceMappingURL=traced-agent.js.map