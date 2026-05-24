import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as stockApi from '@/lib/stock-movements-api';
import type {
  ListStockParams, ListMovementsParams, ListImportsParams, ListAuditEventsParams, ReportParams,
  ReceiveStockRequest, MoveStockRequest, ReserveStockRequest, UnreserveStockRequest,
  QuarantineStockRequest, ReleaseQuarantineRequest, WriteOffRequest, StatusChangeRequest,
  ValidateImportRequest, ProcessImportRequest,
} from '@/types/stock-movements.types';

// --- Query Keys ---

export const stockKeys = {
  stock: ['inventory', 'stock'] as const,
  stockList: (p: ListStockParams) => ['inventory', 'stock', 'list', p] as const,
  stockSummary: (siteId?: string) => ['inventory', 'stock', 'summary', siteId] as const,
  stockBySite: (id: string) => ['inventory', 'stock', 'by-site', id] as const,
  stockByWarehouse: (id: string) => ['inventory', 'stock', 'by-warehouse', id] as const,
  stockByLocation: (id: string) => ['inventory', 'stock', 'by-location', id] as const,
  stockBySku: (id: string) => ['inventory', 'stock', 'by-sku', id] as const,
  stockItem: (id: string) => ['inventory', 'stock', 'items', id] as const,
  stockItemBySerial: (sn: string) => ['inventory', 'stock', 'items', 'serial', sn] as const,
  movements: ['inventory', 'movements'] as const,
  movementList: (p: ListMovementsParams) => ['inventory', 'movements', 'list', p] as const,
  movementDetail: (id: string) => ['inventory', 'movements', id] as const,
  imports: ['inventory', 'imports'] as const,
  importList: (p: ListImportsParams) => ['inventory', 'imports', 'list', p] as const,
  importDetail: (id: string) => ['inventory', 'imports', id] as const,
  auditEvents: (p: ListAuditEventsParams) => ['inventory', 'audit-events', p] as const,
  report: (name: string, p: ReportParams) => ['inventory', 'reports', name, p] as const,
};

// --- Stock Queries ---

export function useStockList(params: ListStockParams = {}) {
  return useQuery({ queryKey: stockKeys.stockList(params), queryFn: () => stockApi.listStock(params) });
}

export function useStockSummary(siteId?: string) {
  return useQuery({ queryKey: stockKeys.stockSummary(siteId), queryFn: () => stockApi.getStockSummary(siteId) });
}

export function useStockBySite(siteId: string) {
  return useQuery({ queryKey: stockKeys.stockBySite(siteId), queryFn: () => stockApi.getStockBySite(siteId), enabled: !!siteId });
}

export function useStockByWarehouse(warehouseId: string) {
  return useQuery({ queryKey: stockKeys.stockByWarehouse(warehouseId), queryFn: () => stockApi.getStockByWarehouse(warehouseId), enabled: !!warehouseId });
}

export function useStockByLocation(locationId: string) {
  return useQuery({ queryKey: stockKeys.stockByLocation(locationId), queryFn: () => stockApi.getStockByLocation(locationId), enabled: !!locationId });
}

export function useStockBySku(skuId: string) {
  return useQuery({ queryKey: stockKeys.stockBySku(skuId), queryFn: () => stockApi.getStockBySku(skuId), enabled: !!skuId });
}

export function useStockItem(stockItemId: string) {
  return useQuery({ queryKey: stockKeys.stockItem(stockItemId), queryFn: () => stockApi.getStockItem(stockItemId), enabled: !!stockItemId });
}

export function useStockItemBySerial(serialNumber: string) {
  return useQuery({ queryKey: stockKeys.stockItemBySerial(serialNumber), queryFn: () => stockApi.getStockItemBySerial(serialNumber), enabled: !!serialNumber });
}

// --- Stock Action Mutations ---

function useStockAction<T>(mutationFn: (body: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stockKeys.stock });
      qc.invalidateQueries({ queryKey: stockKeys.movements });
    },
  });
}

export function useReceiveStock() { return useStockAction<ReceiveStockRequest>(stockApi.receiveStock); }
export function useMoveStock() { return useStockAction<MoveStockRequest>(stockApi.moveStock); }
export function useReserveStock() { return useStockAction<ReserveStockRequest>(stockApi.reserveStock); }
export function useUnreserveStock() { return useStockAction<UnreserveStockRequest>(stockApi.unreserveStock); }
export function useQuarantineStock() { return useStockAction<QuarantineStockRequest>(stockApi.quarantineStock); }
export function useReleaseQuarantine() { return useStockAction<ReleaseQuarantineRequest>(stockApi.releaseQuarantine); }
export function useWriteOffStock() { return useStockAction<WriteOffRequest>(stockApi.writeOffStock); }
export function useStatusChange() { return useStockAction<StatusChangeRequest>(stockApi.changeStockStatus); }

// --- Movements ---

export function useMovementList(params: ListMovementsParams = {}) {
  return useQuery({ queryKey: stockKeys.movementList(params), queryFn: () => stockApi.listMovements(params) });
}

export function useMovement(movementId: string) {
  return useQuery({ queryKey: stockKeys.movementDetail(movementId), queryFn: () => stockApi.getMovement(movementId), enabled: !!movementId });
}

// --- Imports ---

export function useImportList(params: ListImportsParams = {}) {
  return useQuery({ queryKey: stockKeys.importList(params), queryFn: () => stockApi.listImports(params) });
}

export function useImportJob(importJobId: string) {
  return useQuery({ queryKey: stockKeys.importDetail(importJobId), queryFn: () => stockApi.getImportJob(importJobId), enabled: !!importJobId });
}

export function useValidateImport() {
  return useMutation({ mutationFn: (body: ValidateImportRequest) => stockApi.validateImport(body) });
}

export function useProcessImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProcessImportRequest) => stockApi.processImport(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stockKeys.imports });
      qc.invalidateQueries({ queryKey: stockKeys.stock });
    },
  });
}

// --- Reports ---

export function useReportLowStock(params: ReportParams = {}) {
  return useQuery({ queryKey: stockKeys.report('low-stock', params), queryFn: () => stockApi.getReportLowStock(params) });
}

export function useReportNegativeStock(params: ReportParams = {}) {
  return useQuery({ queryKey: stockKeys.report('negative-stock', params), queryFn: () => stockApi.getReportNegativeStock(params) });
}

export function useReportDiscrepancies(params: ReportParams = {}) {
  return useQuery({ queryKey: stockKeys.report('discrepancies', params), queryFn: () => stockApi.getReportDiscrepancies(params) });
}

export function useReportReservedVsAvailable(params: ReportParams = {}) {
  return useQuery({ queryKey: stockKeys.report('reserved-vs-available', params), queryFn: () => stockApi.getReportReservedVsAvailable(params) });
}

export function useReportRecentAdjustments(params: ReportParams = {}) {
  return useQuery({ queryKey: stockKeys.report('recent-adjustments', params), queryFn: () => stockApi.getReportRecentAdjustments(params) });
}

export function useReportCycleCountVariance(params: ReportParams = {}) {
  return useQuery({ queryKey: stockKeys.report('cycle-count-variance', params), queryFn: () => stockApi.getReportCycleCountVariance(params) });
}

// --- Audit Events ---

export function useAuditEvents(params: ListAuditEventsParams = {}) {
  return useQuery({ queryKey: stockKeys.auditEvents(params), queryFn: () => stockApi.listAuditEvents(params) });
}

