import * as stockRepo from '../stock/stock.repository.js';
import { query } from '../../../db/index.js';
import { DEFAULT_LOW_STOCK_THRESHOLD } from '../inventory.constants.js';
import { emitEvent } from '../../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../../core/plugins/hook-types.js';

export async function getLowStockReport(siteId?: string, threshold?: number, limit = 50, offset = 0) {
  return stockRepo.getLowStockBalances(threshold ?? DEFAULT_LOW_STOCK_THRESHOLD, siteId, limit, offset);
}

export async function getNegativeStockReport(siteId?: string, limit = 50, offset = 0) {
  // Event hook: notify plugins of anomaly report generation (non-blocking)
  emitEvent(BuiltInHooks.ANOMALY_REPORT_GENERATED, {
    reportType: 'negative_stock', siteId,
  }).catch(() => {});
  return stockRepo.getNegativeStockBalances(siteId, limit, offset);
}

export async function getDiscrepancyReport(siteId?: string, limit = 50, offset = 0) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (siteId) {
    conditions.push(`t.from_site_id = $${idx} OR t.to_site_id = $${idx}`);
    params.push(siteId);
    idx++;
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `SELECT d.*, t.transfer_number, t.from_site_id, t.to_site_id
     FROM inventory_transfer_discrepancies d
     JOIN inventory_transfers t ON t.transfer_id = d.transfer_id
     ${where}
     ORDER BY d.reported_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );
  return result.rows;
}

export async function getReservedVsAvailableReport(siteId?: string, limit = 50, offset = 0) {
  return stockRepo.getReservedVsAvailable(siteId, limit, offset);
}

export async function getRecentAdjustmentsReport(siteId?: string, limit = 50, offset = 0) {
  const conditions: string[] = [`status = 'POSTED'`];
  const params: unknown[] = [];
  let idx = 1;
  if (siteId) { conditions.push(`site_id = $${idx++}`); params.push(siteId); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const result = await query(
    `SELECT * FROM inventory_adjustments ${where} ORDER BY posted_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );
  return result.rows;
}

export async function getCycleCountVarianceReport(siteId?: string, limit = 50, offset = 0) {
  const conditions: string[] = [`a.adjustment_type = 'RECOUNT_RECONCILIATION'`, `a.status = 'POSTED'`];
  const params: unknown[] = [];
  let idx = 1;
  if (siteId) { conditions.push(`a.site_id = $${idx++}`); params.push(siteId); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const result = await query(
    `SELECT a.adjustment_id, a.site_id, a.posted_at, al.sku_id, al.expected_quantity, al.counted_quantity,
            (al.counted_quantity - al.expected_quantity) as variance
     FROM inventory_adjustments a
     JOIN inventory_adjustment_lines al ON al.adjustment_id = a.adjustment_id
     ${where}
     ORDER BY a.posted_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );
  return result.rows;
}

