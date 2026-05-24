// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Sites repository
// ═══════════════════════════════════════════════════════════════════════

import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { InventorySiteRow } from '../inventory.types.js';

export async function createSite(
  data: { siteId: string; siteName: string; siteType: string; status: string; timezone?: string; addressJson?: object; contactJson?: object; metadata?: object },
  client?: PoolClient,
): Promise<InventorySiteRow> {
  const sql = `
    INSERT INTO inventory_sites (site_id, site_name, site_type, status, timezone, address_json, contact_json, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `;
  const params = [
    data.siteId, data.siteName, data.siteType, data.status,
    data.timezone ?? null,
    data.addressJson ? JSON.stringify(data.addressJson) : null,
    data.contactJson ? JSON.stringify(data.contactJson) : null,
    data.metadata ? JSON.stringify(data.metadata) : null,
  ];
  const result = client
    ? await client.query<InventorySiteRow>(sql, params)
    : await query<InventorySiteRow>(sql, params);
  return result.rows[0];
}

export async function findSiteBySiteId(siteId: string, client?: PoolClient): Promise<InventorySiteRow | null> {
  const sql = 'SELECT * FROM inventory_sites WHERE site_id = $1 AND deleted_at IS NULL';
  const result = client
    ? await client.query<InventorySiteRow>(sql, [siteId])
    : await query<InventorySiteRow>(sql, [siteId]);
  return result.rows[0] ?? null;
}

export async function findSiteById(id: string, client?: PoolClient): Promise<InventorySiteRow | null> {
  const sql = 'SELECT * FROM inventory_sites WHERE inventory_site_id = $1 AND deleted_at IS NULL';
  const result = client
    ? await client.query<InventorySiteRow>(sql, [id])
    : await query<InventorySiteRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function listSites(
  filters: { status?: string; limit: number; offset: number },
): Promise<{ rows: InventorySiteRow[]; total: number }> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inventory_sites ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<InventorySiteRow>(
    `SELECT * FROM inventory_sites ${where} ORDER BY site_name ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

export async function updateSite(
  siteId: string,
  data: { siteName?: string; siteType?: string; status?: string; timezone?: string; addressJson?: object; contactJson?: object; metadata?: object },
  client?: PoolClient,
): Promise<InventorySiteRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.siteName !== undefined) { sets.push(`site_name = $${idx++}`); params.push(data.siteName); }
  if (data.siteType !== undefined) { sets.push(`site_type = $${idx++}`); params.push(data.siteType); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); params.push(data.status); }
  if (data.timezone !== undefined) { sets.push(`timezone = $${idx++}`); params.push(data.timezone); }
  if (data.addressJson !== undefined) { sets.push(`address_json = $${idx++}`); params.push(JSON.stringify(data.addressJson)); }
  if (data.contactJson !== undefined) { sets.push(`contact_json = $${idx++}`); params.push(JSON.stringify(data.contactJson)); }
  if (data.metadata !== undefined) { sets.push(`metadata = $${idx++}`); params.push(JSON.stringify(data.metadata)); }

  if (sets.length === 0) return findSiteBySiteId(siteId, client);

  sets.push('updated_at = now()');
  params.push(siteId);

  const sql = `UPDATE inventory_sites SET ${sets.join(', ')} WHERE site_id = $${idx} AND deleted_at IS NULL RETURNING *`;
  const result = client
    ? await client.query<InventorySiteRow>(sql, params)
    : await query<InventorySiteRow>(sql, params);
  return result.rows[0] ?? null;
}

export async function archiveSite(siteId: string, client?: PoolClient): Promise<InventorySiteRow | null> {
  const sql = `UPDATE inventory_sites SET status = 'DECOMMISSIONED', deleted_at = now(), updated_at = now() WHERE site_id = $1 AND deleted_at IS NULL RETURNING *`;
  const result = client
    ? await client.query<InventorySiteRow>(sql, [siteId])
    : await query<InventorySiteRow>(sql, [siteId]);
  return result.rows[0] ?? null;
}

