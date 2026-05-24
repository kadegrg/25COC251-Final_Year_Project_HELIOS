// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Domain-specific error classes
// ═══════════════════════════════════════════════════════════════════════

import { AppError } from '../../core/errors/app-error.js';

export class InsufficientStockError extends AppError {
  constructor(skuId: string, requested: number, available: number) {
    super(
      `Insufficient stock for SKU ${skuId}: requested ${requested}, available ${available}`,
      409, 'INSUFFICIENT_STOCK', true,
      { skuId, requested, available },
    );
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(entity: string, from: string, to: string) {
    super(
      `Invalid ${entity} status transition from '${from}' to '${to}'`,
      422, 'INVALID_STATUS_TRANSITION', true,
      { entity, from, to },
    );
  }
}

export class LocationNotOperableError extends AppError {
  constructor(locationId: string, reason: string) {
    super(
      `Location ${locationId} is not operable: ${reason}`,
      422, 'LOCATION_NOT_OPERABLE', true,
      { locationId, reason },
    );
  }
}

export class SiteScopeMismatchError extends AppError {
  constructor(message = 'Site scope does not match the target resource') {
    super(message, 403, 'SITE_SCOPE_MISMATCH', true);
  }
}

export class MetadataValidationError extends AppError {
  constructor(errors: Record<string, string[]>) {
    super('Metadata validation failed', 422, 'METADATA_VALIDATION_ERROR', true, errors);
  }
}

export class SerializedItemMismatchError extends AppError {
  constructor(message = 'Serialized item does not match expected SKU or location') {
    super(message, 422, 'SERIALIZED_ITEM_MISMATCH', true);
  }
}

export class DuplicateSerialNumberError extends AppError {
  constructor(serialNumber: string) {
    super(
      `Serial number '${serialNumber}' already exists`,
      409, 'DUPLICATE_SERIAL_NUMBER', true,
      { serialNumber },
    );
  }
}

export class NegativeStockPreventedError extends AppError {
  constructor(skuId: string, locationId?: string) {
    super(
      `Operation would result in negative stock for SKU ${skuId}`,
      409, 'NEGATIVE_STOCK_PREVENTED', true,
      { skuId, locationId },
    );
  }
}

export class ApprovalRequiredError extends AppError {
  constructor(entity: string) {
    super(
      `Approval is required before this ${entity} can proceed`,
      422, 'APPROVAL_REQUIRED', true,
      { entity },
    );
  }
}

export class ReconciliationMismatchError extends AppError {
  constructor(transferId: string, details?: unknown) {
    super(
      `Reconciliation mismatch on transfer ${transferId}`,
      422, 'RECONCILIATION_MISMATCH', true,
      { transferId, ...((details as object) || {}) },
    );
  }
}

export class InventoryArchiveBlockedError extends AppError {
  constructor(resource: string, reason: string) {
    super(
      `Cannot archive ${resource}: ${reason}`,
      409, 'ARCHIVE_BLOCKED', true,
      { resource, reason },
    );
  }
}

export class ImportValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'IMPORT_VALIDATION_ERROR', true, details);
  }
}

