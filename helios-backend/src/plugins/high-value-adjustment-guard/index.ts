// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Main entry point
// ═══════════════════════════════════════════════════════════════════════
//
// Demonstrates:
//   - Interceptor hook (before adjustment post)
//   - Event hook (after adjustment posted)
//   - Plugin config with Zod validation
//   - Plugin-owned routes
//   - Plugin-owned DB table via migration
//   - Scheduled job
//   - Full lifecycle (init → start → stop)
// ═══════════════════════════════════════════════════════════════════════

import { manifest } from './manifest.js';
import { beforeAdjustmentPostHandler, setConfig } from './hooks/before-adjustment-post.hook.js';
import { afterAdjustmentPostedHandler } from './hooks/after-adjustment-post.event.js';
import { pluginRouter } from './routes/plugin.routes.js';
import { staleReviewJobHandler } from './jobs/stale-review.job.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import { logger } from '../../core/logging/logger.js';
import type { HeliosPlugin } from '../../core/plugins/plugin-types.js';

// ── Migration SQL (inlined so it's available at registration time) ───

const MIGRATION_001 = `
CREATE TABLE IF NOT EXISTS plugin_high_value_adjustment_reviews (
  review_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id        UUID NOT NULL,
  site_id              STRING NULL,
  outcome              STRING NOT NULL CHECK (outcome IN ('ALLOWED','DENIED','FLAGGED')),
  reason               STRING NULL,
  reviewed_by_user_id  UUID NULL,
  request_id           STRING NULL,
  correlation_id       STRING NULL,
  details_json         JSONB NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plugin_hv_adj_reviews_adjustment
  ON plugin_high_value_adjustment_reviews (adjustment_id);

CREATE INDEX IF NOT EXISTS idx_plugin_hv_adj_reviews_outcome_created
  ON plugin_high_value_adjustment_reviews (outcome, created_at DESC);
`;

// ── Build plugin ─────────────────────────────────────────────────────

const plugin: HeliosPlugin = {
  manifest,

  hooks: [
    {
      hookName: BuiltInHooks.ADJUSTMENT_BEFORE_POST,
      category: 'INTERCEPTOR',
      handler: beforeAdjustmentPostHandler,
      priority: 50, // Run early to block before other plugins
      required: true,
      description: 'Guards against high-value or restricted-reason adjustments',
    },
    {
      hookName: BuiltInHooks.ADJUSTMENT_AFTER_POSTED,
      category: 'EVENT',
      handler: afterAdjustmentPostedHandler,
      priority: 100,
      description: 'Observes successful adjustment posts for audit logging',
    },
  ],

  routes: {
    router: pluginRouter,
  },

  jobs: [
    {
      jobKey: 'stale-review-check',
      displayName: 'Stale High-Value Review Check',
      intervalMs: 60 * 60 * 1000, // Every hour
      handler: staleReviewJobHandler,
      runOnStart: false,
    },
  ],

  migrations: [
    { key: '001_create_high_value_adjustment_reviews', up: MIGRATION_001 },
  ],

  async init(config) {
    // Pass resolved config to the hook handler
    setConfig(config);

    logger.info({
      pluginId: manifest.pluginId,
      threshold: config.highValueThreshold,
      minAal: config.minimumAalForHighValue,
    }, 'High-value adjustment guard initialised');
  },

  async start() {
    logger.info({ pluginId: manifest.pluginId }, 'High-value adjustment guard started');
  },

  async stop() {
    logger.info({ pluginId: manifest.pluginId }, 'High-value adjustment guard stopped');
  },
};

export default plugin;

