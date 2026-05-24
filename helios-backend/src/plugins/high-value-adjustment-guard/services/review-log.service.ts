// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Review log service
// ═══════════════════════════════════════════════════════════════════════

import * as reviewRepo from '../repositories/review-log.repository.js';
import type { PoolClient } from '../../../db/index.js';

export async function logReview(
  adjustmentId: string,
  outcome: 'ALLOWED' | 'DENIED' | 'FLAGGED',
  opts: {
    siteId?: string;
    reason?: string;
    userId?: string;
    requestId?: string;
    correlationId?: string;
    details?: Record<string, unknown>;
    txClient?: PoolClient;
  } = {},
): Promise<string> {
  return reviewRepo.insertReviewLog(
    {
      adjustmentId,
      siteId: opts.siteId,
      outcome,
      reason: opts.reason,
      reviewedByUserId: opts.userId,
      requestId: opts.requestId,
      correlationId: opts.correlationId,
      detailsJson: opts.details,
    },
    opts.txClient,
  );
}

export async function getRecentActivity(limit = 20) {
  return reviewRepo.getRecentReviews(limit);
}

export async function getStaleFlags(olderThanHours = 24) {
  return reviewRepo.getStaleReviews(olderThanHours);
}


