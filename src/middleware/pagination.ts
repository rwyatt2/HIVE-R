/**
 * Pagination Middleware
 * 
 * Request parsing and response formatting for paginated endpoints.
 */

import { Request } from 'express';
import { logger } from '../lib/logger.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PaginationParams {
    limit: number;
    offset: number;
    cursor?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasNext: boolean;
        hasPrev: boolean;
        nextCursor?: string;
    };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Parse pagination parameters from request query string.
 * Enforces maximum limit to prevent memory exhaustion.
 */
export function parsePagination(req: Request): PaginationParams {
    const limit = Math.min(
        Math.max(parseInt(req.query.limit as string) || DEFAULT_LIMIT, 1),
        MAX_LIMIT
    );
    const offset = Math.max(
        parseInt(req.query.offset as string) || 0,
        0
    );
    const cursor = req.query.cursor as string | undefined;

    return { limit, offset, cursor };
}

/**
 * Create a paginated response with metadata.
 */
export function paginate<T extends { id?: string }>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginatedResponse<T> {
    const hasNext = params.offset + params.limit < total;
    const hasPrev = params.offset > 0;

    return {
        data,
        pagination: {
            total,
            limit: params.limit,
            offset: params.offset,
            hasNext,
            hasPrev,
            nextCursor: data.length > 0 && hasNext
                ? data[data.length - 1]?.id
                : undefined,
        },
    };
}

/**
 * Log slow queries for performance monitoring.
 */
export function logSlowQuery(
    startTime: number,
    queryName: string,
    params: Record<string, unknown>
): void {
    const duration = Date.now() - startTime;

    if (duration > 100) {
        logger.warn({
            queryName,
            duration,
            params,
        }, `Slow query detected: ${queryName} took ${duration}ms`);
    }
}

/**
 * Measure query execution time.
 */
export function measureQuery<T>(
    queryName: string,
    params: Record<string, unknown>,
    fn: () => T
): T {
    const startTime = Date.now();
    const result = fn();
    logSlowQuery(startTime, queryName, params);
    return result;
}
