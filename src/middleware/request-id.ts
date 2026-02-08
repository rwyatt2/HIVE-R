/**
 * Request ID Middleware
 * Attaches unique request ID and scoped logger to each request
 */

import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export interface RequestWithId extends Request {
    id: string;
    log: typeof logger;
    startTime: number;
}

export function requestIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const requestWithId = req as RequestWithId;

    // Generate or use existing request ID
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Attach to request
    requestWithId.id = requestId;
    requestWithId.startTime = Date.now();

    // Create request-scoped logger
    requestWithId.log = logger.child({
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });

    // Add to response headers
    res.setHeader('X-Request-ID', requestId);

    // Log request start
    requestWithId.log.info('Request started');

    // Log request end
    res.on('finish', () => {
        const duration = Date.now() - requestWithId.startTime;
        requestWithId.log.info(
            {
                statusCode: res.statusCode,
                durationMs: duration,
            },
            'Request completed'
        );
    });

    next();
}
