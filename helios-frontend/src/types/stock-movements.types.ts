/** Stock & Movements types */

import type { SingleResponse } from './iam.types';
export type { SingleResponse };

// Stock-movements uses a different pagination envelope than IAM
export interface StockPaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// --- Enums / Constants ---

export const STOCK_STATUS_CODES = [
  'SELLABLE', 'RESERVED', 'QUARANTINED', 'DAMAGED', 'RETURNED', 'IN_TRANSIT',
  'ALLOCATED', 'UNAVAILABLE', 'INSPECTION_REQUIRED', 'AWAITING_PUTAWAY', 'SCRAP',
] as const;
export type StockStatusCode = (typeof STOCK_STATUS_CODES)[number];

export const MOVEMENT_TYPES = [
  'RECEIPT', 'INTERNAL_MOVE', 'ALLOCATION', 'DEALLOCATION', 'PICK', 'PACK', 'DISPATCH',
  'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE',
  'STATUS_CHANGE', 'QUARANTINE', 'RELEASE_QUARANTINE', 'RETURN_RECEIPT', 'CYCLE_COUNT', 'WRITE_OFF',
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const LIFECYCLE_STATUSES = ['ACTIVE', 'IN_TRANSIT', 'CONSUMED', 'SCRAPPED', 'LOST', 'ARCHIVED'] as const;
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export const IMPORT_TYPES = [
  'GOODS_RECEIPT', 'SKU_IMPORT', 'STOCK_BALANCE_IMPORT', 'TRANSFER_RECEIPT', 'ADJUSTMENT_IMPORT',
] as const;
export type ImportType = (typeof IMPORT_TYPES)[number];

export const IMPORT_STATUSES = [
  'PENDING', 'VALIDATING', 'PARTIALLY_VALID', 'VALID', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED',
] as const;
export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export const IMPORT_ROW_STATUSES = ['PENDING', 'VALID', 'INVALID', 'PROCESSED'] as const;
export type ImportRowStatus = (typeof IMPORT_ROW_STATUSES)[number];

export const AUDIT_EVENT_TYPES = [
  'inventory.stock.received', 'inventory.stock.moved', 'inventory.stock.reserved',
  'inventory.stock.unreserved', 'inventory.stock.quarantined', 'inventory.stock.released_quarantine',
  'inventory.stock.written_off', 'inventory.stock.status_changed',
  'inventory.import.validated', 'inventory.import.processed',
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export const AUDIT_EVENT_RESULTS = ['SUCCESS', 'FAILURE', 'DENIED'] as const;

// --- Permissions ---

export const STOCK_PERMISSIONS = {
  STOCK_READ: 'inventory.stock.read',
  STOCK_RECEIVE: 'inventory.stock.receive',
  STOCK_MOVE: 'inventory.stock.move',
  STOCK_RESERVE: 'inventory.stock.reserve',
  STOCK_UNRESERVE: 'inventory.stock.unreserve',
  STOCK_ADJUST: 'inventory.stock.adjust',
  STOCK_IMPORT: 'inventory.stock.import',
  REPORT_READ: 'inventory.stock.report.read',
  AUDIT_READ: 'inventory.stock.audit.read',
} as const;

// --- Data Shapes ---

export interface StockBalance {
  stockBalanceId: string;
  siteId: string;
  warehouseId: string | null;
  locationId: string | null;
  skuId: string;
  stockStatusCode: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityInbound: number;
  quantityOutbound: number;
  lastMovementAt: string | null;
  updatedAt: string;
}

export interface StockItem {
  stockItemId: string;
  siteId: string;
  skuId: string;
  serialNumber: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  currentLocationId: string | null;
  currentWarehouseId: string | null;
  stockStatusCode: string;
  lifecycleStatus: LifecycleStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  movementId: string;
  siteId: string;
  skuId: string;
  stockItemId: string | null;
  movementType: string;
  movementReasonCode: string | null;
  fromLocationId: string | null;
  toLocationId: string | null;
  fromStockStatusCode: string | null;
  toStockStatusCode: string | null;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  transferId: string | null;
  adjustmentId: string | null;
  notes: string | null;
  performedBy: string | null;
  createdAt: string;
}

export interface ImportJob {
  importJobId: string;
  siteId: string;
  importType: string;
  status: string;
  sourceFilename: string | null;
  sourceFormat: string | null;
  summaryJson: { totalRows: number; validRows: number; invalidRows: number } | null;
  errorJson: unknown | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ImportRow {
  importRowId: string;
  rowNumber: number;
  rowData: Record<string, unknown>;
  validationStatus: string;
  validationErrors: unknown | null;
  resultReferenceType: string | null;
  resultReferenceId: string | null;
}

export interface AuditEvent {
  auditEventId: string;
  siteId: string;
  eventType: string;
  eventResult: string;
  userId: string | null;
  skuId: string | null;
  stockItemId: string | null;
  transferId: string | null;
  adjustmentId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface SummaryRow {
  siteId?: string;
  skuId?: string;
  stockStatusCode: string;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
}

// --- Query Params ---

export interface ListStockParams {
  siteId?: string;
  warehouseId?: string;
  locationId?: string;
  skuId?: string;
  stockStatusCode?: string;
  page?: number;
  limit?: number;
}

export interface ListMovementsParams {
  siteId?: string;
  skuId?: string;
  stockItemId?: string;
  locationId?: string;
  movementType?: string;
  transferId?: string;
  adjustmentId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface ListImportsParams {
  siteId?: string;
  status?: string;
  importType?: string;
  page?: number;
  limit?: number;
}

export interface ListAuditEventsParams {
  siteId?: string;
  eventType?: string;
  userId?: string;
  skuId?: string;
  transferId?: string;
  adjustmentId?: string;
  limit?: number;
  offset?: number;
}

export interface ReportParams {
  siteId?: string;
  threshold?: number;
}

// --- Action Request Bodies ---

export interface ReceiveStockRequest {
  siteId: string;
  warehouseId?: string;
  locationId: string;
  skuId: string;
  quantity: number;
  stockStatusCode?: string;
  serialNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface MoveStockRequest {
  siteId: string;
  skuId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  stockStatusCode?: string;
  stockItemId?: string;
  notes?: string;
}

export interface ReserveStockRequest {
  siteId: string;
  locationId?: string;
  skuId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  stockItemId?: string;
  notes?: string;
}

export interface UnreserveStockRequest {
  siteId: string;
  locationId?: string;
  skuId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  stockItemId?: string;
  notes?: string;
}

export interface QuarantineStockRequest {
  siteId: string;
  locationId: string;
  skuId: string;
  quantity: number;
  fromStatusCode?: string;
  stockItemId?: string;
  notes?: string;
}

export interface ReleaseQuarantineRequest {
  siteId: string;
  locationId: string;
  skuId: string;
  quantity: number;
  toStatusCode?: string;
  stockItemId?: string;
  notes?: string;
}

export interface WriteOffRequest {
  siteId: string;
  locationId: string;
  skuId: string;
  quantity: number;
  fromStatusCode?: string;
  reasonCode?: string;
  stockItemId?: string;
  notes?: string;
}

export interface StatusChangeRequest {
  siteId: string;
  locationId: string;
  skuId: string;
  quantity: number;
  fromStatusCode: string;
  toStatusCode: string;
  stockItemId?: string;
  notes?: string;
}

export interface ValidateImportRequest {
  siteId: string;
  importType: ImportType;
  sourceFilename?: string;
  sourceFormat?: string;
  rows: Record<string, unknown>[];
}

export interface ProcessImportRequest {
  importJobId: string;
}

// --- Action Responses ---

export interface StockActionResponse {
  movementId: string;
  stockItemId?: string;
  quantity?: number;
}

export interface ValidateImportResponse {
  job: ImportJob;
  rows: ImportRow[];
}

export interface ImportDetailResponse {
  job: ImportJob;
  rows: ImportRow[];
}

// --- Offset-based pagination (audit events) ---

export interface OffsetPaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}


