import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import type { AttributeDefinitionRow, SkuAttributeValueRow } from '../inventory.types.js';

export async function createAttributeDefinition(
  data: {
    attributeKey: string; attributeName: string; categoryId?: string; dataType: string;
    isRequired?: boolean; isFilterable?: boolean; isSearchable?: boolean;
    validationRules?: object; enumValues?: string[]; unitLabel?: string; sortOrder?: number;
  },
  client?: PoolClient,
): Promise<AttributeDefinitionRow> {
  const sql = `
    INSERT INTO inventory_attribute_definitions
      (attribute_key, attribute_name, category_id, data_type, is_required, is_filterable, is_searchable,
       validation_rules, enum_values, unit_label, sort_order)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
  `;
  const params = [
    data.attributeKey, data.attributeName, data.categoryId ?? null, data.dataType,
    data.isRequired ?? false, data.isFilterable ?? true, data.isSearchable ?? false,
    data.validationRules ? JSON.stringify(data.validationRules) : null,
    data.enumValues ? JSON.stringify(data.enumValues) : null,
    data.unitLabel ?? null, data.sortOrder ?? 0,
  ];
  const result = client ? await client.query<AttributeDefinitionRow>(sql, params) : await query<AttributeDefinitionRow>(sql, params);
  return result.rows[0];
}

export async function findAttributeById(id: string): Promise<AttributeDefinitionRow | null> {
  const result = await query<AttributeDefinitionRow>('SELECT * FROM inventory_attribute_definitions WHERE attribute_id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findAttributeByKey(key: string): Promise<AttributeDefinitionRow | null> {
  const result = await query<AttributeDefinitionRow>('SELECT * FROM inventory_attribute_definitions WHERE attribute_key = $1', [key]);
  return result.rows[0] ?? null;
}

export async function listAttributes(categoryId?: string): Promise<AttributeDefinitionRow[]> {
  if (categoryId) {
    // Return attributes for specific category plus global ones (category_id IS NULL)
    const result = await query<AttributeDefinitionRow>(
      'SELECT * FROM inventory_attribute_definitions WHERE category_id = $1 OR category_id IS NULL ORDER BY sort_order ASC, attribute_name ASC',
      [categoryId],
    );
    return result.rows;
  }
  const result = await query<AttributeDefinitionRow>('SELECT * FROM inventory_attribute_definitions ORDER BY sort_order ASC, attribute_name ASC');
  return result.rows;
}

export async function updateAttribute(
  attributeId: string,
  data: { attributeName?: string; isRequired?: boolean; isFilterable?: boolean; isSearchable?: boolean; validationRules?: object; enumValues?: string[]; unitLabel?: string; sortOrder?: number },
  client?: PoolClient,
): Promise<AttributeDefinitionRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (data.attributeName !== undefined) { sets.push(`attribute_name = $${idx++}`); params.push(data.attributeName); }
  if (data.isRequired !== undefined) { sets.push(`is_required = $${idx++}`); params.push(data.isRequired); }
  if (data.isFilterable !== undefined) { sets.push(`is_filterable = $${idx++}`); params.push(data.isFilterable); }
  if (data.isSearchable !== undefined) { sets.push(`is_searchable = $${idx++}`); params.push(data.isSearchable); }
  if (data.validationRules !== undefined) { sets.push(`validation_rules = $${idx++}`); params.push(JSON.stringify(data.validationRules)); }
  if (data.enumValues !== undefined) { sets.push(`enum_values = $${idx++}`); params.push(JSON.stringify(data.enumValues)); }
  if (data.unitLabel !== undefined) { sets.push(`unit_label = $${idx++}`); params.push(data.unitLabel); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order = $${idx++}`); params.push(data.sortOrder); }
  if (sets.length === 0) return findAttributeById(attributeId);
  sets.push('updated_at = now()');
  params.push(attributeId);
  const sql = `UPDATE inventory_attribute_definitions SET ${sets.join(', ')} WHERE attribute_id = $${idx} RETURNING *`;
  const result = client ? await client.query<AttributeDefinitionRow>(sql, params) : await query<AttributeDefinitionRow>(sql, params);
  return result.rows[0] ?? null;
}

// ── SKU attribute values ──────────────────────────────

export async function getSkuAttributeValues(skuId: string): Promise<SkuAttributeValueRow[]> {
  const result = await query<SkuAttributeValueRow>(
    'SELECT * FROM inventory_sku_attribute_values WHERE sku_id = $1 ORDER BY created_at ASC',
    [skuId],
  );
  return result.rows;
}

export async function upsertSkuAttributeValue(
  skuId: string,
  attributeId: string,
  valueColumn: string,
  value: unknown,
  client?: PoolClient,
): Promise<SkuAttributeValueRow> {
  // Reset all value columns to null, then set the correct one
  const sql = `
    INSERT INTO inventory_sku_attribute_values (sku_id, attribute_id, ${valueColumn})
    VALUES ($1, $2, $3)
    ON CONFLICT (sku_id, attribute_id) DO UPDATE SET
      value_string = NULL, value_text = NULL, value_integer = NULL, value_decimal = NULL,
      value_boolean = NULL, value_date = NULL, value_datetime = NULL, value_json = NULL, value_enum = NULL,
      ${valueColumn} = $3, updated_at = now()
    RETURNING *
  `;
  const result = client
    ? await client.query<SkuAttributeValueRow>(sql, [skuId, attributeId, value])
    : await query<SkuAttributeValueRow>(sql, [skuId, attributeId, value]);
  return result.rows[0];
}

export async function deleteSkuAttributeValue(skuId: string, attributeId: string, client?: PoolClient): Promise<void> {
  const sql = 'DELETE FROM inventory_sku_attribute_values WHERE sku_id = $1 AND attribute_id = $2';
  if (client) await client.query(sql, [skuId, attributeId]);
  else await query(sql, [skuId, attributeId]);
}

