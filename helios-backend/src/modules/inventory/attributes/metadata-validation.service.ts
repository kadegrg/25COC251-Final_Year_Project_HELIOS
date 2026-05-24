// ═══════════════════════════════════════════════════════════════════════
// Metadata validation service — validates EAV values against definitions
// ═══════════════════════════════════════════════════════════════════════

import type { AttributeDefinitionRow } from '../inventory.types.js';
import { MetadataValidationError } from '../inventory.errors.js';

/**
 * Maps attribute data type to the column name used in inventory_sku_attribute_values.
 */
export function getValueColumn(dataType: string): string {
  switch (dataType) {
    case 'STRING': return 'value_string';
    case 'TEXT': return 'value_text';
    case 'INTEGER': return 'value_integer';
    case 'DECIMAL': return 'value_decimal';
    case 'BOOLEAN': return 'value_boolean';
    case 'DATE': return 'value_date';
    case 'DATETIME': return 'value_datetime';
    case 'JSON': return 'value_json';
    case 'ENUM': return 'value_enum';
    default: return 'value_string';
  }
}

/**
 * Coerce and validate a single attribute value against its definition.
 * Returns the coerced value ready for storage.
 * Throws MetadataValidationError on failure.
 */
export function validateAttributeValue(
  definition: AttributeDefinitionRow,
  rawValue: unknown,
): unknown {
  const errors: Record<string, string[]> = {};
  const key = definition.attribute_key;

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    if (definition.is_required) {
      errors[key] = [`Attribute '${key}' is required`];
      throw new MetadataValidationError(errors);
    }
    return null;
  }

  switch (definition.data_type) {
    case 'STRING': {
      if (typeof rawValue !== 'string') { errors[key] = ['Expected string']; break; }
      const rules = definition.validation_rules as { minLength?: number; maxLength?: number } | null;
      if (rules?.minLength && rawValue.length < rules.minLength) errors[key] = [`Minimum length ${rules.minLength}`];
      if (rules?.maxLength && rawValue.length > rules.maxLength) errors[key] = [`Maximum length ${rules.maxLength}`];
      return rawValue;
    }
    case 'TEXT':
      if (typeof rawValue !== 'string') { errors[key] = ['Expected text string']; break; }
      return rawValue;
    case 'INTEGER': {
      const num = Number(rawValue);
      if (!Number.isInteger(num)) { errors[key] = ['Expected integer']; break; }
      return num;
    }
    case 'DECIMAL': {
      const num = Number(rawValue);
      if (isNaN(num)) { errors[key] = ['Expected decimal number']; break; }
      return num;
    }
    case 'BOOLEAN': {
      if (typeof rawValue === 'boolean') return rawValue;
      if (rawValue === 'true') return true;
      if (rawValue === 'false') return false;
      errors[key] = ['Expected boolean'];
      break;
    }
    case 'DATE': {
      const d = new Date(rawValue as string);
      if (isNaN(d.getTime())) { errors[key] = ['Expected date (YYYY-MM-DD)']; break; }
      return (rawValue as string).substring(0, 10); // date only
    }
    case 'DATETIME': {
      const d = new Date(rawValue as string);
      if (isNaN(d.getTime())) { errors[key] = ['Expected datetime (ISO 8601)']; break; }
      return d;
    }
    case 'JSON':
      if (typeof rawValue === 'object') return JSON.stringify(rawValue);
      try { JSON.parse(rawValue as string); return rawValue; }
      catch { errors[key] = ['Expected valid JSON']; break; }
      break;
    case 'ENUM': {
      const allowed = definition.enum_values ?? [];
      if (!allowed.includes(rawValue as string)) {
        errors[key] = [`Value must be one of: ${allowed.join(', ')}`];
        break;
      }
      return rawValue;
    }
    default:
      return rawValue;
  }

  if (Object.keys(errors).length > 0) throw new MetadataValidationError(errors);
  return rawValue;
}

