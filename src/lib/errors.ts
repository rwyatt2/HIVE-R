/**
 * Error Classes and Types
 * 
 * Standardized error handling with user-friendly messages.
 */

// ─── Error Codes ────────────────────────────────────────────────────────────

export enum ErrorCode {
    // Authentication
    AUTH_REQUIRED = 'AUTH_REQUIRED',
    AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
    AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

    // Validation
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
    VALIDATION_PASSWORD_WEAK = 'VALIDATION_PASSWORD_WEAK',

    // Rate Limiting
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    RATE_LIMIT_HOURLY = 'RATE_LIMIT_HOURLY',
    RATE_LIMIT_BURST = 'RATE_LIMIT_BURST',

    // Budget & Billing
    INSUFFICIENT_BUDGET = 'INSUFFICIENT_BUDGET',
    SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
    USAGE_LIMIT_REACHED = 'USAGE_LIMIT_REACHED',

    // LLM & Agents
    LLM_ERROR = 'LLM_ERROR',
    LLM_TIMEOUT = 'LLM_TIMEOUT',
    LLM_CIRCUIT_OPEN = 'LLM_CIRCUIT_OPEN',
    AGENT_ERROR = 'AGENT_ERROR',

    // Resources
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',

    // System
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    NETWORK_ERROR = 'NETWORK_ERROR',
}

// ─── Base Error Class ───────────────────────────────────────────────────────

export class AppError extends Error {
    constructor(
        public code: ErrorCode,
        message: string,
        public statusCode: number,
        public userMessage?: string,
        public helpUrl?: string,
        public recovery?: string[]
    ) {
        super(message);
        this.name = 'AppError';
    }

    toJSON(): Record<string, unknown> {
        return {
            error: this.userMessage ?? this.message,
            code: this.code,
            statusCode: this.statusCode,
            helpUrl: this.helpUrl,
            recovery: this.recovery,
        };
    }
}

// ─── Specific Error Classes ─────────────────────────────────────────────────

export class AuthRequiredError extends AppError {
    constructor() {
        super(
            ErrorCode.AUTH_REQUIRED,
            'Authentication required',
            401,
            'Please sign in to continue.',
            '/login',
            ['Sign in with your account', 'Create a new account']
        );
    }
}

export class InvalidCredentialsError extends AppError {
    constructor() {
        super(
            ErrorCode.AUTH_INVALID_CREDENTIALS,
            'Invalid credentials',
            401,
            'The email or password you entered is incorrect.',
            '/forgot-password',
            ['Check your email and password', 'Reset your password']
        );
    }
}

export class RateLimitError extends AppError {
    constructor(retryAfter?: number) {
        super(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            'Rate limit exceeded',
            429,
            `You've made too many requests. Please wait ${retryAfter ? `${retryAfter} seconds` : 'a moment'} and try again.`,
            '/docs/rate-limits',
            ['Wait before trying again', 'Upgrade your plan for higher limits']
        );
    }
}

export class InsufficientBudgetError extends AppError {
    constructor(dailyLimit: number, currentSpend: number) {
        super(
            ErrorCode.INSUFFICIENT_BUDGET,
            'Daily budget exceeded',
            429,
            `You've reached your daily limit of $${dailyLimit}. Current spend: $${currentSpend.toFixed(2)}.`,
            '/billing',
            ['Wait until tomorrow when your limit resets', 'Upgrade your subscription']
        );
    }
}

export class CircuitOpenError extends AppError {
    constructor(service: string) {
        super(
            ErrorCode.LLM_CIRCUIT_OPEN,
            `Circuit breaker open for ${service}`,
            503,
            'Our AI service is temporarily unavailable. We\'re working on it!',
            '/docs/status',
            ['Try again in a few minutes', 'Check the Status page']
        );
    }
}

export class ValidationError extends AppError {
    constructor(details: string) {
        super(
            ErrorCode.VALIDATION_ERROR,
            details,
            400,
            'Please check your input and try again.',
            undefined,
            undefined
        );
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(
            ErrorCode.NOT_FOUND,
            `${resource} not found`,
            404,
            `The ${resource} you're looking for doesn't exist.`,
            undefined,
            ['Check the URL', 'Return to Dashboard']
        );
    }
}

export class LLMTimeoutError extends AppError {
    constructor() {
        super(
            ErrorCode.LLM_TIMEOUT,
            'LLM request timed out',
            504,
            'Your request took too long. Try simplifying your prompt.',
            '/docs/tips',
            ['Try a shorter prompt', 'Break your request into smaller parts']
        );
    }
}
