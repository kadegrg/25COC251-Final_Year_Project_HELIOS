import { api } from './api-client';
import type {
  Adjustment, CreateAdjustmentRequest, ListAdjustmentsParams,
  StockPaginatedResponse,
} from '@/types/adjustments.types';

const BASE = '/v1/inventory/adjustments';

// --- Queries ---

export async function listAdjustments(params: ListAdjustmentsParams = {}) {
  const res = await api.get<StockPaginatedResponse<Adjustment>>(BASE, { params });
  return res.data;
}

export async function getAdjustment(adjustmentId: string) {
  const res = await api.get<{ success: boolean; data: Adjustment }>(`${BASE}/${adjustmentId}`);
  return res.data.data;
}

// --- Mutations ---

export async function createAdjustment(body: CreateAdjustmentRequest) {
  const res = await api.post<{ success: boolean; data: Adjustment }>(BASE, body);
  return res.data.data;
}

export async function approveAdjustment(adjustmentId: string) {
  const res = await api.post<{ success: boolean; data: Adjustment }>(`${BASE}/${adjustmentId}/approve`);
  return res.data.data;
}

export async function postAdjustment(adjustmentId: string) {
  const res = await api.post<{ success: boolean; data: Adjustment }>(`${BASE}/${adjustmentId}/post`);
  return res.data.data;
}

export async function cancelAdjustment(adjustmentId: string) {
  const res = await api.post<{ success: boolean; data: Adjustment }>(`${BASE}/${adjustmentId}/cancel`);
  return res.data.data;
}

