/** Adjustments types */

import type { StockPaginatedResponse } from './stock-movements.types';
export type { StockPaginatedResponse };

// --- Enums ---

export const ADJUSTMENT_TYPES = [
  'INCREASE', 'DECREASE', 'STATUS_CHANGE', 'RECOUNT_RECONCILIATION',
] as const;
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

export const ADJUSTMENT_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const;
export type AdjustmentStatus = (typeof ADJUSTMENT_STATUSES)[number];

// --- Reason codes (seeded reference data) ---

export const ADJUSTMENT_REASON_CODES = [
  'DAMAGE', 'LOSS', 'FOUND', 'CYCLE_COUNT',
  'MANUAL_CORRECTION', 'EXPIRY', 'WRITE_OFF',
] as const;

// --- Stock status codes (seeded) ---

export const STOCK_STATUS_CODES = [
  'SELLABLE', 'RESERVED', 'QUARANTINED', 'DAMAGED', 'RETURNED',
  'IN_TRANSIT', 'ALLOCATED', 'UNAVAILABLE', 'INSPECTION_REQUIRED',
  'AWAITING_PUTAWAY', 'SCRAP',
] as const;

// --- Permission ---

export const ADJUSTMENT_PERMISSION = 'inventory.stock.adjust';

// --- Action availability ---

export const ADJUSTMENT_ACTIONS = {
  approve: { validFrom: ['DRAFT'] as AdjustmentStatus[], aal: 2 },
  post: { validFrom: ['DRAFT'] as AdjustmentStatus[], aal: 2 },
  cancel: { validFrom: ['DRAFT'] as AdjustmentStatus[], aal: 1 },
} as const;

// --- Data Shapes ---

export interface AdjustmentLine {
  adjustmentLineId: string;
  skuId: string;
  stockItemId: string | null;
  fromStatusCode: string | null;
  toStatusCode: string | null;
  quantityDelta: number;
  countedQuantity: number | null;
  expectedQuantity: number | null;
  reasonCode: string;
  notes: string | null;
}

export interface Adjustment {
  adjustmentId: string;
  siteId: string;
  warehouseId: string | null;
  locationId: string | null;
  adjustmentType: AdjustmentType;
  reasonCode: string;
  status: AdjustmentStatus;
  requestedByUserId: string | null;
  approvedByUserId: string | null;
  postedByUserId: string | null;
  requestedAt: string;
  approvedAt: string | null;
  postedAt: string | null;
  notes: string | null;
  lines?: AdjustmentLine[];
  createdAt: string;
  updatedAt: string;
}

// --- Request Bodies ---

export interface CreateAdjustmentLineRequest {
  skuId: string;
  stockItemId?: string;
  fromStatusCode?: string;
  toStatusCode?: string;
  quantityDelta: number;
  countedQuantity?: number;
  expectedQuantity?: number;
  reasonCode: string;
  notes?: string;
}

export interface CreateAdjustmentRequest {
  siteId: string;
  warehouseId?: string;
  locationId?: string;
  adjustmentType: AdjustmentType;
  reasonCode: string;
  notes?: string;
  lines: CreateAdjustmentLineRequest[];
}

// --- Query Params ---

export interface ListAdjustmentsParams {
  page?: number;
  limit?: number;
  siteId?: string;
  status?: string;
  adjustmentType?: string;
}

