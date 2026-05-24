// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Stale review job
// ═══════════════════════════════════════════════════════════════════════
//
// Simple scheduled job that checks for FLAGGED reviews that have been
// sitting without follow-up for more than 24 hours and logs a warning.
//
// ═══════════════════════════════════════════════════════════════════════

import { getStaleFlags } from '../services/review-log.service.js';
import { logger } from '../../../core/logging/logger.js';

export async function staleReviewJobHandler(): Promise<void> {
  const stale = await getStaleFlags(24);

  if (stale.length === 0) {
    logger.debug({ pluginId: 'high-value-adjustment-guard' }, 'No stale flagged reviews');
    return;
  }

  logger.warn({
    pluginId: 'high-value-adjustment-guard',
    staleCount: stale.length,
    oldestCreatedAt: stale[0]?.created_at,
  }, `${stale.length} high-value adjustment review(s) still awaiting follow-up`);

  // In a real system this could send alerts, create tasks, etc.
}

