/**
 * Safety Guards for HIVE-R
 *
 * Protects against runaway loops, resource exhaustion, and agent failures.
 */
export declare const SAFETY_CONFIG: {
    MAX_TURNS: number;
    MAX_AGENT_RETRIES: number;
    MAX_TOTAL_FAILURES: number;
    AGENT_TIMEOUT_MS: number;
    SELF_LOOP_AGENTS: string[];
};
export declare function checkTurnLimit(turnCount: number): {
    safe: boolean;
    reason?: string;
};
export declare function checkAgentRetries(agentName: string, retries: Record<string, number>): {
    safe: boolean;
    reason?: string;
};
export declare function recordAgentFailure(agentName: string): void;
export declare function isCircuitOpen(agentName: string): boolean;
export declare function recordAgentSuccess(agentName: string): void;
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs?: number, agentName?: string): Promise<T>;
export declare function safeAgentExecution<T>(agentName: string, fn: () => Promise<T>, fallback: T): Promise<T>;
//# sourceMappingURL=safety.d.ts.map