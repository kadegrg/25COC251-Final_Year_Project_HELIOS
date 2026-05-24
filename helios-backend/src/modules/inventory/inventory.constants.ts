// ═══════════════════════════════════════════════════════════════════════
// HELIOS Inventory — Constants
// ═══════════════════════════════════════════════════════════════════════

/** All recognised stock status codes */
export const STOCK_STATUS_CODES = [
  'SELLABLE',
  'RESERVED',
  'QUARANTINED',
  'DAMAGED',
  'RETURNED',
  'IN_TRANSIT',
  'ALLOCATED',
  'UNAVAILABLE',
  'INSPECTION_REQUIRED',
  'AWAITING_PUTAWAY',
  'SCRAP',
] as const;
export type StockStatusCode = (typeof STOCK_STATUS_CODES)[number];

/** Movement types for the immutable ledger */
export const MOVEMENT_TYPES = [
  'RECEIPT',
  'INTERNAL_MOVE',
  'ALLOCATION',
  'DEALLOCATION',
  'PICK',
  'PACK',
  'DISPATCH',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT_INCREASE',
  'ADJUSTMENT_DECREASE',
  'STATUS_CHANGE',
  'QUARANTINE',
  'RELEASE_QUARANTINE',
  'RETURN_RECEIPT',
  'CYCLE_COUNT',
  'WRITE_OFF',
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

/** Valid transfer status transitions */
export const TRANSFER_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REQUESTED', 'CANCELLED'],
  REQUESTED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['PICKED', 'DISPATCHED', 'CANCELLED'],
  PICKED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT'],
  IN_TRANSIT: ['PART_RECEIVED', 'RECEIVED'],
  PART_RECEIVED: ['RECEIVED', 'RECONCILED'],
  RECEIVED: ['RECONCILED'],
  RECONCILED: [],
  CANCELLED: [],
};

/** Valid adjustment status transitions */
export const ADJUSTMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['POSTED', 'CANCELLED'],
  POSTED: [],
  CANCELLED: [],
};

/** Location type constants */
export const LOCATION_TYPES = [
  'AISLE',
  'BAY',
  'SHELF',
  'BIN',
  'STAGING',
  'QUARANTINE',
  'RETURNS',
  'DISPATCH',
  'RECEIVING',
  'BULK',
  'ZONE',
  'OTHER',
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

/** Default reorder threshold for low-stock reporting (placeholder) */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

/** Maximum rows per import batch */
export const MAX_IMPORT_ROWS = 5000;

