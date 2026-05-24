import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { CategoryRow } from '../inventory.types.js';

export async function createCategory(
  data: { categoryKey: string; categoryName: string; description?: string; parentCategoryId?: string },
  client?: PoolClient,
): Promise<CategoryRow> {
  const sql = `INSERT INTO inventory_categories (category_key, category_name, description, parent_category_id) VALUES ($1,$2,$3,$4) RETURNING *`;
  const params = [data.categoryKey, data.categoryName, data.description ?? null, data.parentCategoryId ?? null];
  const result = client ? await client.query<CategoryRow>(sql, params) : await query<CategoryRow>(sql, params);
  return result.rows[0];
}

export async function findCategoryById(id: string): Promise<CategoryRow | null> {
  const result = await query<CategoryRow>('SELECT * FROM inventory_categories WHERE category_id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function listCategories(): Promise<CategoryRow[]> {
  const result = await query<CategoryRow>('SELECT * FROM inventory_categories ORDER BY category_name ASC');
  return result.rows;
}

export async function updateCategory(
  categoryId: string,
  data: { categoryName?: string; description?: string; parentCategoryId?: string },
  client?: PoolClient,
): Promise<CategoryRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (data.categoryName !== undefined) { sets.push(`category_name = $${idx++}`); params.push(data.categoryName); }
  if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }
  if (data.parentCategoryId !== undefined) { sets.push(`parent_category_id = $${idx++}`); params.push(data.parentCategoryId || null); }
  if (sets.length === 0) return findCategoryById(categoryId);
  sets.push('updated_at = now()');
  params.push(categoryId);
  const sql = `UPDATE inventory_categories SET ${sets.join(', ')} WHERE category_id = $${idx} RETURNING *`;
  const result = client ? await client.query<CategoryRow>(sql, params) : await query<CategoryRow>(sql, params);
  return result.rows[0] ?? null;
}

