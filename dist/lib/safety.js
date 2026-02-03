/**
 * Safety Guards for HIVE-R
 *
 * Protects against runaway loops, resource exhaustion, and agent failures.
 */
import { logger } from "./logger.js";
// ============================================================================
// CONFIGURATION
// ============================================================================
export const SAFETY_CONFIG = {
    // Maximum turns before force-finishing
    MAX_TURNS: 50,
    // Maximum retries per agent
    MAX_AGENT_RETRIES: 3,
    // Maximum total agent failures before circuit break
    MAX_TOTAL_FAILURES: 10,
    // Timeout for individual agent calls (ms)
    AGENT_TIMEOUT_MS: 60000,
    // Agents that can use self-loop (override MAX_RETRIES)
    SELF_LOOP_AGENTS: ["Builder", "Tester"],
};
// ============================================================================
// TURN LIMIT GUARD
// ============================================================================
export function checkTurnLimit(turnCount) {
    if (turnCount >= SAFETY_CONFIG.MAX_TURNS) {
        logger.safetyTrigger(`Turn limit exceeded`, { turnCount, maxTurns: SAFETY_CONFIG.MAX_TURNS });
        return {
            safe: false,
            reason: `Maximum turns (${SAFETY_CONFIG.MAX_TURNS}) exceeded. Force finishing to prevent infinite loop.`,
        };
    }
    return { safe: true };
}
// ============================================================================
// AGENT RETRY GUARD
// ============================================================================
export function checkAgentRetries(agentName, retries) {
    const agentRetries = retries[agentName] ?? 0;
    const maxRetries = SAFETY_CONFIG.SELF_LOOP_AGENTS.includes(agentName)
        ? SAFETY_CONFIG.MAX_AGENT_RETRIES
        : 1;
    if (agentRetries >= maxRetries) {
        logger.safetyTrigger(`Agent retry limit exceeded`, { agentName, retries: agentRetries, maxRetries });
        return {
            safe: false,
            reason: `${agentName} has failed ${agentRetries} times. Skipping to prevent loop.`,
        };
    }
    return { safe: true };
}
const circuitBreakers = {};
export function recordAgentFailure(agentName) {
    if (!circuitBreakers[agentName]) {
        circuitBreakers[agentName] = { failures: 0, lastFailure: 0, isOpen: false };
    }
    const cb = circuitBreakers[agentName];
    cb.failures++;
    cb.lastFailure = Date.now();
    if (cb.failures >= SAFETY_CONFIG.MAX_AGENT_RETRIES) {
        cb.isOpen = true;
        logger.safetyTrigger(`Circuit breaker opened for ${agentName}`, {
            failures: cb.failures
        });
    }
}
export function isCircuitOpen(agentName) {
    const cb = circuitBreakers[agentName];
    if (!cb)
        return false;
    // Reset after 5 minutes
    if (cb.isOpen && Date.now() - cb.lastFailure > 300000) {
        cb.isOpen = false;
        cb.failures = 0;
        logger.info(`Circuit breaker reset for ${agentName}`);
    }
    return cb.isOpen;
}
export function recordAgentSuccess(agentName) {
    if (circuitBreakers[agentName]) {
        circuitBreakers[agentName].failures = 0;
        circuitBreakers[agentName].isOpen = false;
    }
}
// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================
export async function withTimeout(promise, timeoutMs = SAFETY_CONFIG.AGENT_TIMEOUT_MS, agentName = "unknown") {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            logger.safetyTrigger(`Agent timeout`, { agentName, timeoutMs });
            reject(new Error(`Agent ${agentName} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
    }
    catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}
// ============================================================================
// SAFE AGENT WRAPPER (Enhanced)
// ============================================================================
export async function safeAgentExecution(agentName, fn, fallback) {
    const startTime = Date.now();
    logger.agentStart(agentName);
    // Check circuit breaker
    if (isCircuitOpen(agentName)) {
        logger.warn(`⚡ Circuit open for ${agentName}, using fallback`);
        return fallback;
    }
    try {
        const result = await withTimeout(fn(), SAFETY_CONFIG.AGENT_TIMEOUT_MS, agentName);
        const duration = Date.now() - startTime;
        recordAgentSuccess(agentName);
        logger.agentEnd(agentName, duration);
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        recordAgentFailure(agentName);
        logger.agentError(agentName, error, { duration });
        return fallback;
    }
}
//# sourceMappingURL=safety.js.map