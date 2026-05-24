import type { Request, Response, NextFunction } from 'express';
import { generateCorrelationId } from '../utils/ids.js';
import type { RequestContext } from '../types/request-context.js';

/**
 * Attaches a request context object to every incoming request.
 * Reads X-Request-ID header if present, otherwise generates one.
 */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const requestId =
    (req.headers['x-request-id'] as string) || generateCorrelationId();

  const ctx: RequestContext = {
    requestId,
    aal: 0,
    amr: [],
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };

  req.ctx = ctx;
  // Set response header for traceability
  _res.setHeader('X-Request-ID', requestId);

  next();
}

