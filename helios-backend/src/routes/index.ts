import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { passwordRoutes } from '../modules/password/password.routes.js';
import { totpRoutes } from '../modules/mfa/totp.routes.js';
import { webAuthnRoutes } from '../modules/mfa/webauthn.routes.js';
import { recoveryRoutes } from '../modules/mfa/recovery.routes.js';
import { factorsRoutes } from '../modules/mfa/factors.routes.js';
import { sessionsRoutes } from '../modules/sessions/sessions.routes.js';
import { usersRoutes } from '../modules/iam/users.routes.js';
import { rolesRoutes } from '../modules/iam/roles.routes.js';
import { permissionsRoutes, rolePermissionsRouter } from '../modules/iam/permissions.routes.js';
import { inventoryRouter } from './inventory.routes.js';
import { pluginsAdminRoutes } from '../modules/system/plugins/plugins.routes.js';

const router = Router();

// ── Health check ───────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth ───────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Password ──────────────────────────────────────────
router.use('/auth/password', passwordRoutes);

// ── MFA / TOTP ────────────────────────────────────────
router.use('/auth/mfa/totp', totpRoutes);

// ── MFA / WebAuthn ────────────────────────────────────
router.use('/auth/mfa/webauthn', webAuthnRoutes);

// ── MFA / Recovery ────────────────────────────────────
router.use('/auth/mfa/recovery', recoveryRoutes);

// ── MFA / Factors (list) ──────────────────────────────
router.use('/auth/mfa/factors', factorsRoutes);

// ── Sessions ──────────────────────────────────────────
router.use('/auth/sessions', sessionsRoutes);

// ── IAM / Users ───────────────────────────────────────
router.use('/iam/users', usersRoutes);

// ── IAM / Roles ───────────────────────────────────────
router.use('/iam/roles', rolesRoutes);

// ── IAM / Role Permissions ────────────────────────────
router.use('/iam/roles/:roleId/permissions', rolePermissionsRouter);

// ── IAM / Permissions ─────────────────────────────────
router.use('/iam/permissions', permissionsRoutes);

// ── Inventory ─────────────────────────────────────────
router.use('/inventory', inventoryRouter);

// ── System / Plugin Administration ────────────────────
router.use('/system/plugins', pluginsAdminRoutes);

// TODO: Future — JWKS endpoint for inter-service verification
// router.get('/.well-known/jwks.json', jwksHandler);

// TODO: Future — Federation endpoints
// router.use('/auth/sso', ssoRoutes);

export { router as apiRouter };

