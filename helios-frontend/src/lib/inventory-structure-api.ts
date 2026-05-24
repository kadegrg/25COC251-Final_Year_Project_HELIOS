import { api } from './api-client';
import type {
  Site,
  Warehouse,
  Location,
  LocationTreeNode,
  CreateSiteRequest,
  UpdateSiteRequest,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  CreateLocationRequest,
  UpdateLocationRequest,
  ListSitesParams,
  ListWarehousesParams,
  ListLocationsParams,
  LocationTreeParams,
  PaginatedResponse,
  SingleResponse,
} from '@/types/inventory-structure.types';

const BASE = '/v1/inventory';

// --- Sites ---

export async function listSites(params: ListSitesParams = {}) {
  const res = await api.get<PaginatedResponse<Site>>(`${BASE}/sites`, { params });
  return res.data;
}

export async function getSite(siteId: string) {
  const res = await api.get<SingleResponse<Site>>(`${BASE}/sites/${siteId}`);
  return res.data.data;
}

export async function createSite(body: CreateSiteRequest) {
  const res = await api.post<SingleResponse<Site>>(`${BASE}/sites`, body);
  return res.data.data;
}

export async function updateSite(siteId: string, body: UpdateSiteRequest) {
  const res = await api.patch<SingleResponse<Site>>(`${BASE}/sites/${siteId}`, body);
  return res.data.data;
}

export async function archiveSite(siteId: string) {
  const res = await api.delete<SingleResponse<Site>>(`${BASE}/sites/${siteId}`);
  return res.data.data;
}

// --- Warehouses ---

export async function listWarehouses(params: ListWarehousesParams = {}) {
  const res = await api.get<PaginatedResponse<Warehouse>>(`${BASE}/warehouses`, { params });
  return res.data;
}

export async function getWarehouse(warehouseId: string) {
  const res = await api.get<SingleResponse<Warehouse>>(`${BASE}/warehouses/${warehouseId}`);
  return res.data.data;
}

export async function createWarehouse(body: CreateWarehouseRequest) {
  const res = await api.post<SingleResponse<Warehouse>>(`${BASE}/warehouses`, body);
  return res.data.data;
}

export async function updateWarehouse(warehouseId: string, body: UpdateWarehouseRequest) {
  const res = await api.patch<SingleResponse<Warehouse>>(`${BASE}/warehouses/${warehouseId}`, body);
  return res.data.data;
}

export async function archiveWarehouse(warehouseId: string) {
  const res = await api.delete<SingleResponse<Warehouse>>(`${BASE}/warehouses/${warehouseId}`);
  return res.data.data;
}

// --- Locations ---

export async function listLocations(params: ListLocationsParams = {}) {
  const res = await api.get<PaginatedResponse<Location>>(`${BASE}/locations`, { params });
  return res.data;
}

export async function getLocation(locationId: string) {
  const res = await api.get<SingleResponse<Location>>(`${BASE}/locations/${locationId}`);
  return res.data.data;
}

export async function createLocation(body: CreateLocationRequest) {
  const res = await api.post<SingleResponse<Location>>(`${BASE}/locations`, body);
  return res.data.data;
}

export async function updateLocation(locationId: string, body: UpdateLocationRequest) {
  const res = await api.patch<SingleResponse<Location>>(`${BASE}/locations/${locationId}`, body);
  return res.data.data;
}

export async function archiveLocation(locationId: string) {
  const res = await api.delete<SingleResponse<Location>>(`${BASE}/locations/${locationId}`);
  return res.data.data;
}

// --- Location Tree ---

export async function getLocationTree(params: LocationTreeParams = {}) {
  const res = await api.get<SingleResponse<LocationTreeNode[]>>(`${BASE}/locations/tree`, { params });
  return res.data.data;
}

