import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { extractSiteIdFromHost, extractSiteIdFromPath } from '../utils/strings.js';
import type { SiteContext } from '../types/request-context.js';

/**
 * Hybrid site context resolver.
 * Supports:
 *   1. Host-based: site-0002.api.example.com
 *   2. Path-based: /api/v1/site-0002/...
 * Mode is controlled by SITE_RESOLUTION_MODE env var.
 * This middleware is trust-proxy aware.
 */
export function siteContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const mode = env.SITE_RESOLUTION_MODE;
  let siteId: string | null = null;
  let resolvedFrom: SiteContext['resolvedFrom'] = 'none';

  // 1. Try host-based resolution
  if (mode === 'host' || mode === 'hybrid') {
    const host = req.hostname || req.headers.host || '';
    const extracted = extractSiteIdFromHost(host, env.BASE_DOMAIN);
    if (extracted) {
      siteId = extracted;
      resolvedFrom = 'host';
    }
  }

  // 2. Try path-based resolution (only if not already resolved from host, or mode is 'path')
  if (!siteId && (mode === 'path' || mode === 'hybrid')) {
    // Path pattern: /api/v1/site-XXXX/...
    // We look at the third segment (index 3 after split on /)
    const segments = req.path.split('/').filter(Boolean);
    // Expected: ['api', 'v1', 'site-0002', ...]
    if (segments.length >= 3) {
      const extracted = extractSiteIdFromPath(segments[2]);
      if (extracted) {
        siteId = extracted;
        resolvedFrom = 'path';
      }
    }
  }

  if (siteId) {
    req.siteContext = { siteId, resolvedFrom };
    req.ctx.siteId = siteId;
  }

  next();
}

