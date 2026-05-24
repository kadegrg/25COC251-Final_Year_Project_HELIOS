import type { Request, Response, NextFunction } from 'express';
import {
  AuthenticationError,
  InsufficientPermissionError,
  InsufficientAALError,
} from '../core/errors/auth-errors.js';
import { resolveEffectivePermissions } from '../modules/iam/authorisation.service.js';

/**
 * Scope resolver function type.
 * Returns scope context from the request, e.g. site ID, resource owner ID.
 */
export type ScopeResolver = (req: Request) => {
  siteId?: string;
  locationId?: string;
  resourceOwnerId?: string;
};

/**
 * Default scope resolver — uses siteContext from middleware.
 */
const defaultScopeResolver: ScopeResolver = (req) => ({
  siteId: req.siteContext?.siteId,
});

/**
 * Factory that creates middleware checking a specific permission.
 * Resolves user's effective permissions from DB (roles + inheritance).
 * Enforces scope matching and AAL requirements.
 *
 * @param permissionKey - Permission key like "iam.users.read"
 * @param scopeResolver - Optional function to resolve scope context from req
 */
export function requirePermission(
  permissionKey: string,
  scopeResolver: ScopeResolver = defaultScopeResolver,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.ctx.userId) {
        throw new AuthenticationError();
      }

      const scope = scopeResolver(req);
      const result = await resolveEffectivePermissions(req.ctx.userId);

      // Find matching permission
      const matchingAssignment = result.find((p) => {
        if (p.permissionKey !== permissionKey) return false;

        // Check scope
        switch (p.scopeType) {
          case 'GLOBAL':
            return true;
          case 'SITE':
            return p.scopeValue === scope.siteId;
          case 'LOCATION':
            return p.scopeValue === scope.locationId;
          case 'OWN':
            return scope.resourceOwnerId === req.ctx.userId;
          default:
            return false;
        }
      });

      if (!matchingAssignment) {
        throw new InsufficientPermissionError(permissionKey);
      }

      // Enforce AAL: use the higher of route requirement and permission's default_required_aal
      const requiredAAL = matchingAssignment.defaultRequiredAal;
      if (req.ctx.aal < requiredAAL) {
        throw new InsufficientAALError(requiredAAL, req.ctx.aal);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

