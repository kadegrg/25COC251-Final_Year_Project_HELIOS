import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { SkuRow } from '../inventory.types.js';

export async function createSku(
  data: {
    skuCode: string; barcode?: string; categoryId?: string; skuName: string;
    shortDescription?: string; longDescription?: string; trackingMode: string;
    status: string; defaultUom: string; sellableByDefault?: boolean;
    requiresExpiryTracking?: boolean; requiresBatchTracking?: boolean;
    weight?: number; dimensionsJson?: object;
  },
  client?: PoolClient,
): Promise<SkuRow> {
  const sql = `
    INSERT INTO inventory_skus
      (sku_code, barcode, category_id, sku_name, short_description, long_description,
       tracking_mode, status, default_uom, sellable_by_default,
       requires_expiry_tracking, requires_batch_tracking, weight, dimensions_json,
       search_text)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *
  `;
  const searchText = [data.skuCode, data.skuName, data.barcode, data.shortDescription].filter(Boolean).join(' ');
  const params = [
    data.skuCode, data.barcode ?? null, data.categoryId ?? null, data.skuName,
    data.shortDescription ?? null, data.longDescription ?? null,
    data.trackingMode, data.status, data.defaultUom, data.sellableByDefault ?? true,
    data.requiresExpiryTracking ?? false, data.requiresBatchTracking ?? false,
    data.weight ?? null, data.dimensionsJson ? JSON.stringify(data.dimensionsJson) : null,
    searchText,
  ];
  const result = client ? await client.query<SkuRow>(sql, params) : await query<SkuRow>(sql, params);
  return result.rows[0];
}

export async function findSkuById(id: string, client?: PoolClient): Promise<SkuRow | null> {
  const sql = 'SELECT * FROM inventory_skus WHERE sku_id = $1 AND deleted_at IS NULL';
  const result = client ? await client.query<SkuRow>(sql, [id]) : await query<SkuRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function findSkuByCode(code: string): Promise<SkuRow | null> {
  const result = await query<SkuRow>('SELECT * FROM inventory_skus WHERE sku_code = $1 AND deleted_at IS NULL', [code]);
  return result.rows[0] ?? null;
}

export async function listSkus(
  filters: { status?: string; categoryId?: string; trackingMode?: string; search?: string; limit: number; offset: number },
): Promise<{ rows: SkuRow[]; total: number }> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let idx = 1;
  if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
  if (filters.categoryId) { conditions.push(`category_id = $${idx++}`); params.push(filters.categoryId); }
  if (filters.trackingMode) { conditions.push(`tracking_mode = $${idx++}`); params.push(filters.trackingMode); }
  if (filters.search) {
    conditions.push(`(sku_code ILIKE $${idx} OR sku_name ILIKE $${idx} OR barcode ILIKE $${idx} OR search_text ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inventory_skus ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<SkuRow>(
    `SELECT * FROM inventory_skus ${where} ORDER BY sku_code ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

export async function updateSku(
  skuId: string,
  data: {
    barcode?: string; categoryId?: string; skuName?: string; shortDescription?: string;
    longDescription?: string; status?: string; defaultUom?: string;
    sellableByDefault?: boolean; requiresExpiryTracking?: boolean; requiresBatchTracking?: boolean;
    weight?: number; dimensionsJson?: object;
  },
  client?: PoolClient,
): Promise<SkuRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (data.barcode !== undefined) { sets.push(`barcode = $${idx++}`); params.push(data.barcode); }
  if (data.categoryId !== undefined) { sets.push(`category_id = $${idx++}`); params.push(data.categoryId || null); }
  if (data.skuName !== undefined) { sets.push(`sku_name = $${idx++}`); params.push(data.skuName); }
  if (data.shortDescription !== undefined) { sets.push(`short_description = $${idx++}`); params.push(data.shortDescription); }
  if (data.longDescription !== undefined) { sets.push(`long_description = $${idx++}`); params.push(data.longDescription); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); params.push(data.status); }
  if (data.defaultUom !== undefined) { sets.push(`default_uom = $${idx++}`); params.push(data.defaultUom); }
  if (data.sellableByDefault !== undefined) { sets.push(`sellable_by_default = $${idx++}`); params.push(data.sellableByDefault); }
  if (data.requiresExpiryTracking !== undefined) { sets.push(`requires_expiry_tracking = $${idx++}`); params.push(data.requiresExpiryTracking); }
  if (data.requiresBatchTracking !== undefined) { sets.push(`requires_batch_tracking = $${idx++}`); params.push(data.requiresBatchTracking); }
  if (data.weight !== undefined) { sets.push(`weight = $${idx++}`); params.push(data.weight); }
  if (data.dimensionsJson !== undefined) { sets.push(`dimensions_json = $${idx++}`); params.push(JSON.stringify(data.dimensionsJson)); }
  if (sets.length === 0) return findSkuById(skuId, client);
  sets.push('updated_at = now()');
  params.push(skuId);
  const sql = `UPDATE inventory_skus SET ${sets.join(', ')} WHERE sku_id = $${idx} AND deleted_at IS NULL RETURNING *`;
  const result = client ? await client.query<SkuRow>(sql, params) : await query<SkuRow>(sql, params);
  return result.rows[0] ?? null;
}

export async function archiveSku(skuId: string, client?: PoolClient): Promise<SkuRow | null> {
  const sql = `UPDATE inventory_skus SET status = 'DISCONTINUED', deleted_at = now(), updated_at = now() WHERE sku_id = $1 AND deleted_at IS NULL RETURNING *`;
  const result = client ? await client.query<SkuRow>(sql, [skuId]) : await query<SkuRow>(sql, [skuId]);
  return result.rows[0] ?? null;
}

