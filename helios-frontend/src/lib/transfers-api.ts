import { api } from './api-client';
import type {
  Transfer, TransferDiscrepancy, CreateTransferRequest,
  ReceiveTransferRequest, CreateDiscrepancyRequest, ListTransfersParams,
  StockPaginatedResponse,
} from '@/types/transfers.types';

const BASE = '/v1/inventory/transfers';

// --- Queries ---

export async function listTransfers(params: ListTransfersParams = {}) {
  const res = await api.get<StockPaginatedResponse<Transfer>>(BASE, { params });
  return res.data;
}

export async function getTransfer(transferId: string) {
  const res = await api.get<{ success: boolean; data: Transfer }>(`${BASE}/${transferId}`);
  return res.data.data;
}

export async function getDiscrepancies(transferId: string) {
  const res = await api.get<{ success: boolean; data: TransferDiscrepancy[] }>(`${BASE}/${transferId}/discrepancies`);
  return res.data.data;
}

// --- Mutations ---

export async function createTransfer(body: CreateTransferRequest) {
  const res = await api.post<{ success: boolean; data: Transfer }>(BASE, body);
  return res.data.data;
}

export async function approveTransfer(transferId: string) {
  const res = await api.post<{ success: boolean; data: Transfer }>(`${BASE}/${transferId}/approve`);
  return res.data.data;
}

export async function dispatchTransfer(transferId: string) {
  const res = await api.post<{ success: boolean; data: Transfer }>(`${BASE}/${transferId}/dispatch`);
  return res.data.data;
}

export async function receiveTransfer(transferId: string, body: ReceiveTransferRequest) {
  const res = await api.post<{ success: boolean; data: Transfer }>(`${BASE}/${transferId}/receive`, body);
  return res.data.data;
}

export async function reconcileTransfer(transferId: string) {
  const res = await api.post<{ success: boolean; data: Transfer }>(`${BASE}/${transferId}/reconcile`);
  return res.data.data;
}

export async function cancelTransfer(transferId: string) {
  const res = await api.post<{ success: boolean; data: Transfer }>(`${BASE}/${transferId}/cancel`);
  return res.data.data;
}

export async function addDiscrepancy(transferId: string, body: CreateDiscrepancyRequest) {
  const res = await api.post<{ success: boolean; data: TransferDiscrepancy }>(`${BASE}/${transferId}/discrepancies`, body);
  return res.data.data;
}

