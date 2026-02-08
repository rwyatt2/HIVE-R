/**
 * Error Message Translations
 * 
 * Translates error codes to user-friendly messages with actions.
 */

import { ErrorCode, type ApiError } from '../types/errors';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ErrorMessage {
    title: string;
    message: string;
    icon: string;
    actions?: Array<{
        label: string;
        href?: string;
        onClick?: () => void;
    }>;
}

// ─── Translation Map ────────────────────────────────────────────────────────

const errorMessages: Partial<Record<ErrorCode, (error: ApiError) => ErrorMessage>> = {
    [ErrorCode.AUTH_REQUIRED]: () => ({
        title: 'Sign in required',
        message: 'Please sign in to continue.',
        icon: '🔐',
        actions: [{ label: 'Sign In', href: '/login' }],
    }),

    [ErrorCode.AUTH_INVALID_CREDENTIALS]: () => ({
        title: 'Invalid credentials',
        message: 'The email or password is incorrect.',
        icon: '❌',
        actions: [{ label: 'Forgot Password?', href: '/forgot-password' }],
    }),

    [ErrorCode.AUTH_TOKEN_EXPIRED]: () => ({
        title: 'Session expired',
        message: 'Your session has expired. Please sign in again.',
        icon: '⏰',
        actions: [{ label: 'Sign In', href: '/login' }],
    }),

    [ErrorCode.RATE_LIMIT_EXCEEDED]: (error) => ({
        title: 'Slow down!',
        message: error.error || 'Too many requests. Please wait a moment.',
        icon: '⏱️',
        actions: [{ label: 'View Limits', href: '/docs/rate-limits' }],
    }),

    [ErrorCode.INSUFFICIENT_BUDGET]: (error) => ({
        title: 'Daily limit reached',
        message: error.error || 'You\'ve reached your daily usage limit.',
        icon: '💰',
        actions: [
            { label: 'View Usage', href: '/billing' },
            { label: 'Upgrade Plan', href: '/billing' },
        ],
    }),

    [ErrorCode.LLM_CIRCUIT_OPEN]: () => ({
        title: 'Service unavailable',
        message: 'Our AI service is experiencing high load. Try again soon.',
        icon: '🔧',
        actions: [{ label: 'Check Status', href: '/docs/status' }],
    }),

    [ErrorCode.LLM_TIMEOUT]: () => ({
        title: 'Request timed out',
        message: 'Your request took too long. Try simplifying your prompt.',
        icon: '⏰',
    }),

    [ErrorCode.VALIDATION_ERROR]: (error) => ({
        title: 'Invalid input',
        message: error.error || 'Please check your input.',
        icon: '⚠️',
    }),

    [ErrorCode.NOT_FOUND]: () => ({
        title: 'Not found',
        message: 'The resource doesn\'t exist.',
        icon: '🔍',
        actions: [{ label: 'Go to Dashboard', href: '/dashboard' }],
    }),

    [ErrorCode.NETWORK_ERROR]: () => ({
        title: 'Connection error',
        message: 'Unable to connect. Check your internet.',
        icon: '📡',
    }),
};

// ─── Translation Function ───────────────────────────────────────────────────

export function translateError(error: ApiError): ErrorMessage {
    const translator = error.code ? errorMessages[error.code] : undefined;

    if (translator) {
        return translator(error);
    }

    // Default fallback
    return {
        title: 'Something went wrong',
        message: error.error || 'An unexpected error occurred.',
        icon: '❌',
        actions: error.requestId
            ? [{ label: 'Contact Support', href: `/support?ref=${error.requestId}` }]
            : undefined,
    };
}

export default translateError;
