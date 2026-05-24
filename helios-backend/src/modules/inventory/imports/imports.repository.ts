import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { ImportJobRow, ImportRowRow } from '../inventory.types.js';

export async function createImportJob(
  data: { siteId: string; importType: string; status: string; sourceFilename?: string; sourceFormat?: string; requestedByUserId?: string },
  client?: PoolClient,
): Promise<ImportJobRow> {
  const sql = `INSERT INTO inventory_import_jobs (site_id, import_type, status, source_filename, source_format, requested_by_user_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
  const params = [data.siteId, data.importType, data.status, data.sourceFilename ?? null, data.sourceFormat ?? null, data.requestedByUserId ?? null];
  const result = client ? await client.query<ImportJobRow>(sql, params) : await query<ImportJobRow>(sql, params);
  return result.rows[0];
}

export async function createImportRow(
  data: { importJobId: string; rowNumber: number; rowData: object; validationStatus: string; validationErrors?: object },
  client?: PoolClient,
): Promise<ImportRowRow> {
  const sql = `INSERT INTO inventory_import_rows (import_job_id, row_number, row_data, validation_status, validation_errors) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const params = [data.importJobId, data.rowNumber, JSON.stringify(data.rowData), data.validationStatus, data.validationErrors ? JSON.stringify(data.validationErrors) : null];
  const result = client ? await client.query<ImportRowRow>(sql, params) : await query<ImportRowRow>(sql, params);
  return result.rows[0];
}

export async function findImportJobById(id: string): Promise<ImportJobRow | null> {
  const result = await query<ImportJobRow>('SELECT * FROM inventory_import_jobs WHERE import_job_id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function getImportRows(importJobId: string): Promise<ImportRowRow[]> {
  const result = await query<ImportRowRow>('SELECT * FROM inventory_import_rows WHERE import_job_id = $1 ORDER BY row_number ASC', [importJobId]);
  return result.rows;
}

export async function listImportJobs(
  filters: { siteId?: string; status?: string; importType?: string; limit: number; offset: number },
): Promise<{ rows: ImportJobRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (filters.siteId) { conditions.push(`site_id = $${idx++}`); params.push(filters.siteId); }
  if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
  if (filters.importType) { conditions.push(`import_type = $${idx++}`); params.push(filters.importType); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM inventory_import_jobs ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await query<ImportJobRow>(
    `SELECT * FROM inventory_import_jobs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, filters.offset],
  );
  return { rows: result.rows, total };
}

export async function updateImportJobStatus(
  importJobId: string, status: string, extra?: { summaryJson?: object; errorJson?: object; processedByUserId?: string },
  client?: PoolClient,
): Promise<ImportJobRow | null> {
  const sets = [`status = $1`, `updated_at = now()`];
  const params: unknown[] = [status];
  let idx = 2;
  if (status === 'PROCESSING') { sets.push(`started_at = now()`); }
  if (status === 'COMPLETED' || status === 'FAILED') { sets.push(`completed_at = now()`); }
  if (extra?.summaryJson) { sets.push(`summary_json = $${idx++}`); params.push(JSON.stringify(extra.summaryJson)); }
  if (extra?.errorJson) { sets.push(`error_json = $${idx++}`); params.push(JSON.stringify(extra.errorJson)); }
  if (extra?.processedByUserId) { sets.push(`processed_by_user_id = $${idx++}`); params.push(extra.processedByUserId); }
  params.push(importJobId);
  const sql = `UPDATE inventory_import_jobs SET ${sets.join(', ')} WHERE import_job_id = $${idx} RETURNING *`;
  const result = client ? await client.query<ImportJobRow>(sql, params) : await query<ImportJobRow>(sql, params);
  return result.rows[0] ?? null;
}

export async function updateImportRowStatus(
  importRowId: string, validationStatus: string, validationErrors?: object, resultRefType?: string, resultRefId?: string,
  client?: PoolClient,
): Promise<void> {
  const sql = `UPDATE inventory_import_rows SET validation_status = $1, validation_errors = $2, result_reference_type = $3, result_reference_id = $4, updated_at = now() WHERE import_row_id = $5`;
  const params = [validationStatus, validationErrors ? JSON.stringify(validationErrors) : null, resultRefType ?? null, resultRefId ?? null, importRowId];
  if (client) await client.query(sql, params);
  else await query(sql, params);
}

