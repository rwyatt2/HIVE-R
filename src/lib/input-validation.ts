/**
 * Input Validation & Prompt Injection Protection for HIVE-R
 * 
 * Provides Zod schemas, sanitization, and security logging for all
 * user-facing input endpoints.
 */

import { z } from "zod";
import { logger } from "./logger.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const INPUT_LIMITS = {
    /** Maximum characters per chat message */
    MAX_MESSAGE_LENGTH: 10_000,
    /** Minimum characters per chat message */
    MIN_MESSAGE_LENGTH: 1,
    /** Maximum characters for memory search query */
    MAX_QUERY_LENGTH: 2_000,
    /** Per-user chat rate limit (requests per window) */
    CHAT_RATE_LIMIT: 10,
    /** Rate limit window in milliseconds (1 hour) */
    CHAT_RATE_WINDOW_MS: 3_600_000,
};

// ============================================================================
// PROMPT INJECTION PATTERNS
// ============================================================================

/**
 * Patterns that indicate prompt injection attempts.
 * Each entry has a regex and a human-readable label for logging.
 */
const INJECTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
    // Role override attempts
    { pattern: /\bsystem\s*:/i, label: "system_role_override" },
    { pattern: /\bassistant\s*:/i, label: "assistant_role_override" },
    { pattern: /\bhuman\s*:/i, label: "human_role_override" },
    { pattern: /\buser\s*:/i, label: "user_role_override" },

    // LLaMA / Mistral instruction format
    { pattern: /\[INST\]/i, label: "inst_tag" },
    { pattern: /\[\/INST\]/i, label: "inst_close_tag" },
    { pattern: /<<SYS>>/i, label: "sys_tag" },
    { pattern: /<\/s>/i, label: "end_of_sequence" },
    { pattern: /<<\/?SYS>>/i, label: "sys_tag_variant" },

    // ChatML format
    { pattern: /<\|im_start\|>/i, label: "chatml_start" },
    { pattern: /<\|im_end\|>/i, label: "chatml_end" },
    { pattern: /<\|system\|>/i, label: "chatml_system" },
    { pattern: /<\|assistant\|>/i, label: "chatml_assistant" },

    // Common injection phrases
    { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, label: "ignore_instructions" },
    { pattern: /ignore\s+(all\s+)?above\s+instructions/i, label: "ignore_above" },
    { pattern: /disregard\s+(all\s+)?previous/i, label: "disregard_previous" },
    { pattern: /you\s+are\s+now\s+(?:a|an|in)\s+/i, label: "role_reassignment" },
    { pattern: /pretend\s+(?:you(?:'re| are)\s+)/i, label: "pretend_role" },
    { pattern: /act\s+as\s+(?:if\s+)?(?:you\s+(?:are|were)\s+)/i, label: "act_as_role" },
    { pattern: /new\s+system\s+prompt/i, label: "new_system_prompt" },
    { pattern: /override\s+(?:your\s+)?(?:system|instructions)/i, label: "override_system" },
];

// ============================================================================
// SANITIZATION
// ============================================================================

export interface SanitizationResult {
    /** The sanitized message text */
    sanitized: string;
    /** Whether any injection patterns were detected */
    hadInjection: boolean;
    /** List of detected injection pattern labels */
    detectedPatterns: string[];
}

/**
 * Sanitize user input by detecting and neutralizing prompt injection patterns.
 * 
 * Strategy: We strip the dangerous tokens rather than reject outright,
 * so legitimate messages containing these substrings still get through
 * (just with the dangerous parts removed). The detection is logged.
 */
export function sanitizeMessage(input: string): SanitizationResult {
    const detectedPatterns: string[] = [];
    let sanitized = input;

    for (const { pattern, label } of INJECTION_PATTERNS) {
        if (pattern.test(sanitized)) {
            detectedPatterns.push(label);
            // Replace the match with an empty string to neutralize it
            sanitized = sanitized.replace(new RegExp(pattern.source, "gi"), "");
        }
    }

    // Trim any resulting extra whitespace
    sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

    return {
        sanitized,
        hadInjection: detectedPatterns.length > 0,
        detectedPatterns,
    };
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Schema for /chat and /chat/stream request bodies
 */
export const ChatInputSchema = z.object({
    message: z
        .string({ error: "Message is required" })
        .min(INPUT_LIMITS.MIN_MESSAGE_LENGTH, "Message cannot be empty")
        .max(INPUT_LIMITS.MAX_MESSAGE_LENGTH, `Message cannot exceed ${INPUT_LIMITS.MAX_MESSAGE_LENGTH.toLocaleString()} characters`),
    threadId: z
        .string()
        .uuid("threadId must be a valid UUID")
        .optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

/**
 * Schema for /memory/search request body
 */
export const MemorySearchSchema = z.object({
    query: z
        .string({ error: "Query is required" })
        .min(1, "Query cannot be empty")
        .max(INPUT_LIMITS.MAX_QUERY_LENGTH, `Query cannot exceed ${INPUT_LIMITS.MAX_QUERY_LENGTH.toLocaleString()} characters`),
    agent: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional(),
});

export type MemorySearchInput = z.infer<typeof MemorySearchSchema>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export interface ValidationSuccess<T> {
    success: true;
    data: T;
    sanitization: SanitizationResult;
}

export interface ValidationError {
    success: false;
    error: string;
    code: string;
    details?: Array<{ field: string; message: string }>;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

/**
 * Validate and sanitize chat input.
 * Returns a typed result with either the validated data or a user-friendly error.
 */
export function validateChatInput(body: unknown, ip?: string): ValidationResult<ChatInput> {
    // Step 1: Schema validation
    const parsed = ChatInputSchema.safeParse(body);

    if (!parsed.success) {
        const details = parsed.error.issues.map(issue => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
        }));

        logValidationFailure("chat_validation_failed", {
            ip,
            errors: details,
        });

        return {
            success: false,
            error: details[0]?.message || "Invalid input",
            code: "VALIDATION_ERROR",
            details,
        };
    }

    // Step 2: Prompt injection sanitization
    const sanitization = sanitizeMessage(parsed.data.message);

    if (sanitization.hadInjection) {
        logValidationFailure("prompt_injection_detected", {
            ip,
            patterns: sanitization.detectedPatterns,
            originalLength: parsed.data.message.length,
            sanitizedLength: sanitization.sanitized.length,
        });
    }

    return {
        success: true,
        data: {
            ...parsed.data,
            message: sanitization.sanitized,
        },
        sanitization,
    };
}

/**
 * Validate memory search input.
 */
export function validateMemorySearch(body: unknown, ip?: string): ValidationResult<MemorySearchInput> {
    const parsed = MemorySearchSchema.safeParse(body);

    if (!parsed.success) {
        const details = parsed.error.issues.map(issue => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
        }));

        logValidationFailure("memory_search_validation_failed", {
            ip,
            errors: details,
        });

        return {
            success: false,
            error: details[0]?.message || "Invalid input",
            code: "VALIDATION_ERROR",
            details,
        };
    }

    return {
        success: true,
        data: parsed.data,
        sanitization: { sanitized: parsed.data.query, hadInjection: false, detectedPatterns: [] },
    };
}

// ============================================================================
// PER-USER CHAT RATE LIMITER
// ============================================================================

interface ChatRateEntry {
    count: number;
    resetTime: number;
}

const chatRateStore = new Map<string, ChatRateEntry>();

/**
 * Check if a user/IP has exceeded the chat rate limit.
 * Returns remaining requests or a rejection.
 */
export function checkChatRateLimit(key: string): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds?: number;
    limit: number;
    resetTime: number;
} {
    const now = Date.now();
    const entry = chatRateStore.get(key);

    if (!entry || now > entry.resetTime) {
        // New window
        const resetTime = now + INPUT_LIMITS.CHAT_RATE_WINDOW_MS;
        chatRateStore.set(key, { count: 1, resetTime });
        return {
            allowed: true,
            remaining: INPUT_LIMITS.CHAT_RATE_LIMIT - 1,
            limit: INPUT_LIMITS.CHAT_RATE_LIMIT,
            resetTime,
        };
    }

    if (entry.count >= INPUT_LIMITS.CHAT_RATE_LIMIT) {
        const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);

        logValidationFailure("chat_rate_limit_exceeded", {
            key,
            count: entry.count,
            limit: INPUT_LIMITS.CHAT_RATE_LIMIT,
            retryAfterSeconds,
        });

        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds,
            limit: INPUT_LIMITS.CHAT_RATE_LIMIT,
            resetTime: entry.resetTime,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: INPUT_LIMITS.CHAT_RATE_LIMIT - entry.count,
        limit: INPUT_LIMITS.CHAT_RATE_LIMIT,
        resetTime: entry.resetTime,
    };
}

/** Reset rate limit store — exposed for testing */
export function _resetRateLimitStore(): void {
    chatRateStore.clear();
}

// ============================================================================
// SECURITY LOGGING
// ============================================================================

/**
 * Log all validation failures for security monitoring.
 * Uses the existing structured logger with security-specific context.
 */
function logValidationFailure(event: string, context: Record<string, unknown>): void {
    logger.warn(`🛡️ Security: ${event}`, {
        ...context,
        timestamp: new Date().toISOString(),
    } as any);
}
