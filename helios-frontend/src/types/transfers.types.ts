/** Transfers types */

import type { StockPaginatedResponse } from './stock-movements.types';
export type { StockPaginatedResponse };

// --- Statuses ---

export const TRANSFER_STATUSES = [
  'DRAFT', 'REQUESTED', 'APPROVED', 'PICKED', 'DISPATCHED',
  'IN_TRANSIT', 'PART_RECEIVED', 'RECEIVED', 'RECONCILED', 'CANCELLED',
] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

// --- Permissions ---

export const TRANSFER_PERMISSIONS = {
  READ: 'inventory.stock.read',
  REQUEST: 'inventory.stock.transfer.request',
  APPROVE: 'inventory.stock.transfer.approve',
  DISPATCH: 'inventory.stock.transfer.dispatch',
  RECEIVE: 'inventory.stock.transfer.receive',
  RECONCILE: 'inventory.stock.transfer.reconcile',
} as const;

// --- Action availability by current status ---

export const TRANSFER_ACTIONS = {
  approve: { validFrom: ['REQUESTED'] as TransferStatus[], permission: TRANSFER_PERMISSIONS.APPROVE, aal: 2 },
  dispatch: { validFrom: ['APPROVED', 'PICKED'] as TransferStatus[], permission: TRANSFER_PERMISSIONS.DISPATCH, aal: 1 },
  receive: { validFrom: ['DISPATCHED', 'IN_TRANSIT', 'PART_RECEIVED'] as TransferStatus[], permission: TRANSFER_PERMISSIONS.RECEIVE, aal: 1 },
  reconcile: { validFrom: ['PART_RECEIVED', 'RECEIVED'] as TransferStatus[], permission: TRANSFER_PERMISSIONS.RECONCILE, aal: 2 },
  cancel: { validFrom: ['DRAFT', 'REQUESTED', 'APPROVED', 'PICKED'] as TransferStatus[], permission: TRANSFER_PERMISSIONS.REQUEST, aal: 1 },
} as const;

// --- Data Shapes ---

export interface TransferLine {
  transferLineId: string;
  skuId: string;
  stockItemId: string | null;
  requestedQuantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  discrepancyQuantity: number;
  discrepancyReasonCode: string | null;
}

export interface Transfer {
  transferId: string;
  transferNumber: string;
  fromSiteId: string;
  toSiteId: string;
  status: TransferStatus;
  reasonCode: string;
  requestedByUserId: string | null;
  approvedByUserId: string | null;
  dispatchedByUserId: string | null;
  receivedByUserId: string | null;
  requestedAt: string;
  approvedAt: string | null;
  dispatchedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  lines?: TransferLine[];
  createdAt: string;
  updatedAt: string;
}

export interface TransferDiscrepancy {
  transfer_discrepancy_id: string;
  transfer_id: string;
  transfer_line_id: string | null;
  discrepancy_type: string;
  expected_quantity: number | null;
  actual_quantity: number | null;
  stock_item_id: string | null;
  reason_code: string;
  notes: string | null;
  reported_by_user_id: string | null;
  reported_at: string;
  details_json: Record<string, unknown> | null;
}

// --- Request Bodies ---

export interface CreateTransferLineRequest {
  skuId: string;
  stockItemId?: string;
  requestedQuantity: number;
  fromStatusCode?: string;
  toStatusCode?: string;
  notes?: string;
}

export interface CreateTransferRequest {
  fromSiteId: string;
  toSiteId: string;
  reasonCode: string;
  notes?: string;
  lines: CreateTransferLineRequest[];
}

export interface ReceiveLineInput {
  transferLineId: string;
  receivedQuantity: number;
  discrepancyReasonCode?: string;
}

export interface ReceiveTransferRequest {
  lines: ReceiveLineInput[];
  notes?: string;
}

export interface CreateDiscrepancyRequest {
  transferLineId?: string;
  discrepancyType: string;
  expectedQuantity?: number;
  actualQuantity?: number;
  stockItemId?: string;
  reasonCode: string;
  notes?: string;
}

// --- Query Params ---

export interface ListTransfersParams {
  page?: number;
  limit?: number;
  fromSiteId?: string;
  toSiteId?: string;
  status?: string;
}

