/**
 * Error Handler Middleware
 * 
 * Centralized error handling that logs full details server-side
 * but sends user-friendly messages to clients.
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode, CircuitOpenError, ValidationError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Generate request ID for support inquiries
    const requestId = req.headers['x-request-id'] as string | undefined
        ?? `req_${Date.now().toString(36)}`;

    // Log full error details server-side
    logger.error({
        requestId,
        error: err.message,
        stack: err.stack,
        code: err instanceof AppError ? err.code : undefined,
        req: {
            method: req.method,
            url: req.url,
            ip: req.ip,
        },
    });

    // AppError instances have user-friendly messages
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            ...err.toJSON(),
            requestId,
        });
        return;
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        const validationError = new ValidationError('Invalid input data');
        res.status(400).json({
            ...validationError.toJSON(),
            requestId,
        });
        return;
    }

    // Handle circuit breaker errors
    if (err.message.includes('Circuit open') || err.message.includes('circuit breaker')) {
        const circuitError = new CircuitOpenError('AI service');
        res.status(503).json({
            ...circuitError.toJSON(),
            requestId,
        });
        return;
    }

    // Handle timeout errors
    if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
        res.status(504).json({
            error: 'Your request took too long. Please try again.',
            code: ErrorCode.LLM_TIMEOUT,
            requestId,
            recovery: ['Try again', 'Simplify your request'],
        });
        return;
    }

    // Don't leak internal errors - send generic message
    res.status(500).json({
        error: 'Something went wrong on our end. We\'ve been notified.',
        code: ErrorCode.INTERNAL_ERROR,
        requestId,
        helpUrl: '/docs/support',
    });
}

export default errorHandler;
