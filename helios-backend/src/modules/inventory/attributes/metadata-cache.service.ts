// ═══════════════════════════════════════════════════════════════════════
// Metadata cache service — rebuilds metadata_cache JSON on SKU rows
// ═══════════════════════════════════════════════════════════════════════

import { query } from '../../../db/index.js';
import type { PoolClient } from '../../../db/index.js';
import * as attrsRepo from './attributes.repository.js';
import type { SkuAttributeValueRow, AttributeDefinitionRow } from '../inventory.types.js';

/**
 * Rebuild the metadata_cache JSONB and search_text on the SKU record
 * from the current EAV attribute values.
 */
export async function rebuildMetadataCache(skuId: string, client?: PoolClient): Promise<void> {
  const values = await attrsRepo.getSkuAttributeValues(skuId);
  const allDefs = await attrsRepo.listAttributes();
  const defMap = new Map<string, AttributeDefinitionRow>();
  for (const d of allDefs) defMap.set(d.attribute_id, d);

  const cache: Record<string, unknown> = {};
  const searchParts: string[] = [];

  for (const v of values) {
    const def = defMap.get(v.attribute_id);
    if (!def) continue;
    const resolvedValue = resolveValue(v, def);
    cache[def.attribute_key] = resolvedValue;
    if (def.is_searchable && resolvedValue != null) {
      searchParts.push(String(resolvedValue));
    }
  }

  const searchText = searchParts.length > 0 ? searchParts.join(' ') : null;

  const sql = `UPDATE inventory_skus SET metadata_cache = $1, search_text = $2, updated_at = now() WHERE sku_id = $3`;
  if (client) {
    await client.query(sql, [JSON.stringify(cache), searchText, skuId]);
  } else {
    await query(sql, [JSON.stringify(cache), searchText, skuId]);
  }
}

function resolveValue(v: SkuAttributeValueRow, def: AttributeDefinitionRow): unknown {
  switch (def.data_type) {
    case 'STRING': return v.value_string;
    case 'TEXT': return v.value_text;
    case 'INTEGER': return v.value_integer;
    case 'DECIMAL': return v.value_decimal;
    case 'BOOLEAN': return v.value_boolean;
    case 'DATE': return v.value_date;
    case 'DATETIME': return v.value_datetime;
    case 'JSON': return v.value_json;
    case 'ENUM': return v.value_enum;
    default: return v.value_string;
  }
}

/**
 * Format EAV values into a clean key→value map for API responses.
 */
export function formatMetadataForResponse(
  values: SkuAttributeValueRow[],
  definitions: AttributeDefinitionRow[],
): Record<string, unknown> {
  const defMap = new Map<string, AttributeDefinitionRow>();
  for (const d of definitions) defMap.set(d.attribute_id, d);

  const result: Record<string, unknown> = {};
  for (const v of values) {
    const def = defMap.get(v.attribute_id);
    if (!def) continue;
    result[def.attribute_key] = resolveValue(v, def);
  }
  return result;
}

