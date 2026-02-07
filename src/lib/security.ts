/**
 * Security Middleware for HIVE-R
 * 
 * Provides security headers and input sanitization.
 */

import type { Context, Next } from "hono";
import { hasSecret } from "./secrets.js";

// ============================================================================
// SECURITY HEADERS MIDDLEWARE
// ============================================================================

/**
 * Adds security headers to all responses.
 * These protect against common web vulnerabilities.
 */
export const securityHeaders = () => {
    return async (c: Context, next: Next) => {
        await next();

        // Prevent MIME type sniffing
        c.header('X-Content-Type-Options', 'nosniff');

        // Prevent clickjacking
        c.header('X-Frame-Options', 'DENY');

        // XSS protection (legacy but still useful)
        c.header('X-XSS-Protection', '1; mode=block');

        // Referrer policy for privacy
        c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content security policy (basic)
        c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");

        // HSTS - only in production
        if (process.env.NODE_ENV === 'production') {
            c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Permissions policy - restrict browser features
        c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    };
};

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Basic input sanitization to prevent XSS in LLM outputs.
 * Strips or escapes potentially dangerous HTML/script content.
 */
export function sanitizeOutput(text: string): string {
    if (typeof text !== 'string') return text;

    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate that input is a safe string for processing.
 * Returns true if safe, false if potentially malicious.
 */
export function isValidInput(input: unknown): input is string {
    if (typeof input !== 'string') return false;
    if (input.length > 100_000) return false; // Max 100KB input

    // Check for common injection patterns
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i, // onclick=, onload=, etc.
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
}

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

/**
 * Get production-safe CORS origins.
 * In production, restrict to known domains.
 */
export function getSecureCorsOrigins(): string[] {
    const env = process.env.NODE_ENV;
    const allowedOrigins = process.env.CORS_ORIGINS;

    if (env === 'production' && allowedOrigins) {
        return allowedOrigins.split(',').map(o => o.trim());
    }

    // Development: allow common local origins
    return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173', // Vite
    ];
}

// ============================================================================
// SECURITY AUDIT HELPERS
// ============================================================================

export interface SecurityAuditResult {
    passed: boolean;
    issues: string[];
    recommendations: string[];
}

/**
 * Run a basic security audit of the current configuration.
 */
export function runSecurityAudit(): SecurityAuditResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check API key auth
    if (!hasSecret('HIVE_API_KEY')) {
        issues.push('HIVE_API_KEY not set - API is unprotected');
    }

    // Check OpenAI key
    if (!hasSecret('OPENAI_API_KEY')) {
        issues.push('OPENAI_API_KEY not set');
    }

    // Check for production settings
    if (process.env.NODE_ENV !== 'production') {
        recommendations.push('Set NODE_ENV=production for stricter security');
    }

    // Check CORS
    if (!process.env.CORS_ORIGINS) {
        recommendations.push('Set CORS_ORIGINS to restrict cross-origin requests in production');
    }

    // Check Sentry
    if (!process.env.SENTRY_DSN) {
        recommendations.push('Set SENTRY_DSN for error monitoring');
    }

    return {
        passed: issues.length === 0,
        issues,
        recommendations,
    };
}
