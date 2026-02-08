/**
 * Error Types
 * 
 * Frontend error types mirroring backend error codes.
 */

export const ErrorCode = {
    // Authentication
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
    VALIDATION_PASSWORD_WEAK: 'VALIDATION_PASSWORD_WEAK',

    // Rate Limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    RATE_LIMIT_HOURLY: 'RATE_LIMIT_HOURLY',
    RATE_LIMIT_BURST: 'RATE_LIMIT_BURST',

    // Budget & Billing
    INSUFFICIENT_BUDGET: 'INSUFFICIENT_BUDGET',
    SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
    USAGE_LIMIT_REACHED: 'USAGE_LIMIT_REACHED',

    // LLM & Agents
    LLM_ERROR: 'LLM_ERROR',
    LLM_TIMEOUT: 'LLM_TIMEOUT',
    LLM_CIRCUIT_OPEN: 'LLM_CIRCUIT_OPEN',
    AGENT_ERROR: 'AGENT_ERROR',

    // Resources
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',

    // System
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export interface ApiError {
    error: string;
    code: ErrorCode;
    statusCode?: number;
    requestId?: string;
    helpUrl?: string;
    recovery?: string[];
}
