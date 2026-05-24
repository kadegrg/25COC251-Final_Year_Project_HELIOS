// ═══════════════════════════════════════════════════════════════════════
// HELIOS System — Plugin admin routes
// ═══════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { requirePermission } from '../../../middleware/require-permission.middleware.js';
import { requireAAL } from '../../../middleware/require-aal.middleware.js';
import * as controller from './plugins.controller.js';

const router = Router();

// All plugin admin routes require authentication + active user
router.use(authenticate, requireActiveUser);

// ── Read operations (AAL1) ──────────────────────────────

router.get(
  '/',
  requirePermission('system.plugin.read'),
  controller.listPlugins,
);

router.get(
  '/hooks',
  requirePermission('system.plugin.read'),
  controller.getHookStats,
);

router.get(
  '/:pluginId',
  requirePermission('system.plugin.read'),
  controller.getPlugin,
);

router.get(
  '/:pluginId/config',
  requirePermission('system.plugin.config.read'),
  controller.getPluginConfig,
);

router.get(
  '/:pluginId/jobs',
  requirePermission('system.plugin.job.read'),
  controller.getPluginJobs,
);

// ── Write operations (AAL2) ─────────────────────────────

router.patch(
  '/:pluginId',
  requirePermission('system.plugin.manage'),
  requireAAL(2),
  controller.updatePlugin,
);

router.put(
  '/:pluginId/config',
  requirePermission('system.plugin.config.update'),
  requireAAL(2),
  controller.updatePluginConfig,
);

router.post(
  '/:pluginId/start',
  requirePermission('system.plugin.manage'),
  requireAAL(2),
  controller.startPlugin,
);

router.post(
  '/:pluginId/stop',
  requirePermission('system.plugin.manage'),
  requireAAL(2),
  controller.stopPlugin,
);

router.post(
  '/:pluginId/reload',
  requirePermission('system.plugin.manage'),
  requireAAL(2),
  controller.reloadPlugin,
);

export { router as pluginsAdminRoutes };

