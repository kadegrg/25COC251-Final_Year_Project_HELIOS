// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Plugin routes
// ═══════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../../middleware/require-active-user.middleware.js';
import { sendSuccess } from '../../../core/http/response.js';
import { getPluginRuntimeConfig } from '../../../core/plugins/plugin-manager.js';
import { getRecentActivity } from '../services/review-log.service.js';

const router = Router();

// Plugin routes can opt into auth middleware as needed
router.use(authenticate, requireActiveUser);

/**
 * GET /api/v1/plugins/high-value-adjustment-guard/status
 * Returns plugin status and config summary.
 */
router.get('/status', (req, res) => {
  const config = getPluginRuntimeConfig('high-value-adjustment-guard');
  sendSuccess(res, {
    pluginId: 'high-value-adjustment-guard',
    status: 'active',
    config: config ? {
      enabled: config.enabled,
      highValueThreshold: config.highValueThreshold,
      minimumAalForHighValue: config.minimumAalForHighValue,
      restrictedReasonCodes: config.restrictedReasonCodes,
    } : null,
  });
});

/**
 * GET /api/v1/plugins/high-value-adjustment-guard/config
 * Returns the full plugin config (same as admin endpoint but plugin-scoped).
 */
router.get('/config', (req, res) => {
  const config = getPluginRuntimeConfig('high-value-adjustment-guard');
  sendSuccess(res, { config: config ?? {} });
});

/**
 * GET /api/v1/plugins/high-value-adjustment-guard/activity
 * Returns recent review log entries.
 */
router.get('/activity', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const reviews = await getRecentActivity(limit);
    sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
});

export { router as pluginRouter };

