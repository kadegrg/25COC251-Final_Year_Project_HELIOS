// ═══════════════════════════════════════════════════════════════════════
// Plugin: high-value-adjustment-guard — Review log repository
// ═══════════════════════════════════════════════════════════════════════

import { query, type PoolClient } from '../../../db/index.js';
import { generateId } from '../../../utils/ids.js';

export interface ReviewLogInput {
  adjustmentId: string;
  siteId?: string;
  outcome: 'ALLOWED' | 'DENIED' | 'FLAGGED';
  reason?: string;
  reviewedByUserId?: string;
  requestId?: string;
  correlationId?: string;
  detailsJson?: Record<string, unknown>;
}

export async function insertReviewLog(input: ReviewLogInput, client?: PoolClient): Promise<string> {
  const id = generateId();
  const q = client ?? (await import('../../../db/index.js')).pool;
  await (q as any).query(
    `INSERT INTO plugin_high_value_adjustment_reviews
       (review_id, adjustment_id, site_id, outcome, reason, reviewed_by_user_id, request_id, correlation_id, details_json, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
    [
      id,
      input.adjustmentId,
      input.siteId ?? null,
      input.outcome,
      input.reason ?? null,
      input.reviewedByUserId ?? null,
      input.requestId ?? null,
      input.correlationId ?? null,
      input.detailsJson ? JSON.stringify(input.detailsJson) : null,
    ],
  );
  return id;
}

export async function getRecentReviews(limit = 20): Promise<any[]> {
  const result = await query(
    'SELECT * FROM plugin_high_value_adjustment_reviews ORDER BY created_at DESC LIMIT $1',
    [limit],
  );
  return result.rows;
}

export async function getStaleReviews(olderThanHours = 24): Promise<any[]> {
  const result = await query(
    `SELECT * FROM plugin_high_value_adjustment_reviews
     WHERE outcome = 'FLAGGED'
       AND created_at < now() - $1 * INTERVAL '1 hour'
     ORDER BY created_at ASC`,
    [olderThanHours],
  );
  return result.rows;
}
