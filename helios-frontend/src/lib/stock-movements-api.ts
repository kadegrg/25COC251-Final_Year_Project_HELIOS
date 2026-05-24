import { api } from './api-client';
import type {
  StockBalance, StockItem, StockMovement, ImportJob, AuditEvent, SummaryRow,
  ListStockParams, ListMovementsParams, ListImportsParams, ListAuditEventsParams, ReportParams,
  ReceiveStockRequest, MoveStockRequest, ReserveStockRequest, UnreserveStockRequest,
  QuarantineStockRequest, ReleaseQuarantineRequest, WriteOffRequest, StatusChangeRequest,
  ValidateImportRequest, ProcessImportRequest,
  StockActionResponse, ValidateImportResponse, ImportDetailResponse,
  StockPaginatedResponse, SingleResponse, OffsetPaginatedResponse,
} from '@/types/stock-movements.types';

const BASE = '/v1/inventory';

// --- Stock Queries ---

export async function listStock(params: ListStockParams = {}) {
  const res = await api.get<StockPaginatedResponse<StockBalance>>(`${BASE}/stock`, { params });
  return res.data;
}

export async function getStockSummary(siteId?: string) {
  const res = await api.get<{ data: SummaryRow[] }>(`${BASE}/stock/summary`, { params: siteId ? { siteId } : {} });
  return res.data.data;
}

export async function getStockBySite(siteId: string) {
  const res = await api.get<{ data: StockBalance[] }>(`${BASE}/stock/by-site/${siteId}`);
  return res.data.data;
}

export async function getStockByWarehouse(warehouseId: string) {
  const res = await api.get<{ data: StockBalance[] }>(`${BASE}/stock/by-warehouse/${warehouseId}`);
  return res.data.data;
}

export async function getStockByLocation(locationId: string) {
  const res = await api.get<{ data: StockBalance[] }>(`${BASE}/stock/by-location/${locationId}`);
  return res.data.data;
}

export async function getStockBySku(skuId: string) {
  const res = await api.get<{ data: StockBalance[] }>(`${BASE}/stock/by-sku/${skuId}`);
  return res.data.data;
}

export async function getStockItem(stockItemId: string) {
  const res = await api.get<SingleResponse<StockItem>>(`${BASE}/stock/items/${stockItemId}`);
  return res.data.data;
}

export async function getStockItemBySerial(serialNumber: string) {
  const res = await api.get<SingleResponse<StockItem>>(`${BASE}/stock/items/serial/${serialNumber}`);
  return res.data.data;
}

// --- Stock Actions ---

export async function receiveStock(body: ReceiveStockRequest) {
  const res = await api.post<StockActionResponse>(`${BASE}/stock/receive`, body);
  return res.data;
}

export async function moveStock(body: MoveStockRequest) {
  const res = await api.post<StockActionResponse>(`${BASE}/stock/move`, body);
  return res.data;
}

export async function reserveStock(body: ReserveStockRequest) {
  const res = await api.post<StockActionResponse>(`${BASE}/stock/reserve`, body);
  return res.data;
}

export async function unreserveStock(body: UnreserveStockRequest) {
  const res = await api.post<StockActionResponse>(`${BASE}/stock/unreserve`, body);
  return res.data;
}

export async function quarantineStock(body: QuarantineStockRequest) {
  const res = await api.post<StockActionResponse>(`${BASE}/stock/quarantine`, body);
  return res.data;
}

export async function releaseQuarantine(body: ReleaseQuarantineRequest) {
  const res = await api.post<StockActionResponse>(`${BASE}/stock/release-quarantine`, body);
  return res.data;
}

export async function writeOffStock(body: WriteOffRequest) {
  const res = await api.post<StockActionResponse>(`${BASE}/stock/write-off`, body);
  return res.data;
}

export async function changeStockStatus(body: StatusChangeRequest) {
  const res = await api.post<StockActionResponse>(`${BASE}/stock/status-change`, body);
  return res.data;
}

// --- Movements ---

export async function listMovements(params: ListMovementsParams = {}) {
  const res = await api.get<StockPaginatedResponse<StockMovement>>(`${BASE}/movements`, { params });
  return res.data;
}

export async function getMovement(movementId: string) {
  const res = await api.get<SingleResponse<StockMovement>>(`${BASE}/movements/${movementId}`);
  return res.data.data;
}

// --- Imports ---

export async function listImports(params: ListImportsParams = {}) {
  const res = await api.get<StockPaginatedResponse<ImportJob>>(`${BASE}/imports`, { params });
  return res.data;
}

export async function getImportJob(importJobId: string) {
  const res = await api.get<{ data: ImportDetailResponse }>(`${BASE}/imports/${importJobId}`);
  return res.data.data;
}

export async function validateImport(body: ValidateImportRequest) {
  const res = await api.post<ValidateImportResponse>(`${BASE}/imports/validate`, body);
  return res.data;
}

export async function processImport(body: ProcessImportRequest) {
  const res = await api.post<{ data: ImportJob }>(`${BASE}/imports/process`, body);
  return res.data.data;
}

// --- Reports ---

export async function getReportLowStock(params: ReportParams = {}) {
  const res = await api.get<{ data: StockBalance[] }>(`${BASE}/reports/low-stock`, { params });
  return res.data.data;
}

export async function getReportNegativeStock(params: ReportParams = {}) {
  const res = await api.get<{ data: StockBalance[] }>(`${BASE}/reports/negative-stock`, { params });
  return res.data.data;
}

export async function getReportDiscrepancies(params: ReportParams = {}) {
  const res = await api.get<{ data: unknown[] }>(`${BASE}/reports/discrepancies`, { params });
  return res.data.data;
}

export async function getReportReservedVsAvailable(params: ReportParams = {}) {
  const res = await api.get<{ data: unknown[] }>(`${BASE}/reports/reserved-vs-available`, { params });
  return res.data.data;
}

export async function getReportRecentAdjustments(params: ReportParams = {}) {
  const res = await api.get<{ data: unknown[] }>(`${BASE}/reports/recent-adjustments`, { params });
  return res.data.data;
}

export async function getReportCycleCountVariance(params: ReportParams = {}) {
  const res = await api.get<{ data: unknown[] }>(`${BASE}/reports/cycle-count-variance`, { params });
  return res.data.data;
}

// --- Audit Events ---

export async function listAuditEvents(params: ListAuditEventsParams = {}) {
  const res = await api.get<OffsetPaginatedResponse<AuditEvent>>(`${BASE}/audit-events`, { params });
  return res.data;
}


