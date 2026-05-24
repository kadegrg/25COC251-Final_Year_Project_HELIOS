import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as invApi from '@/lib/inventory-structure-api';
import type {
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
} from '@/types/inventory-structure.types';

// --- Keys ---

export const invKeys = {
  sites: ['inventory', 'sites'] as const,
  siteList: (p: ListSitesParams) => ['inventory', 'sites', 'list', p] as const,
  siteDetail: (id: string) => ['inventory', 'sites', id] as const,
  warehouses: ['inventory', 'warehouses'] as const,
  warehouseList: (p: ListWarehousesParams) => ['inventory', 'warehouses', 'list', p] as const,
  warehouseDetail: (id: string) => ['inventory', 'warehouses', id] as const,
  locations: ['inventory', 'locations'] as const,
  locationList: (p: ListLocationsParams) => ['inventory', 'locations', 'list', p] as const,
  locationDetail: (id: string) => ['inventory', 'locations', id] as const,
  locationTree: (p: LocationTreeParams) => ['inventory', 'locations', 'tree', p] as const,
};

// --- Sites ---

export function useSites(params: ListSitesParams = {}) {
  return useQuery({
    queryKey: invKeys.siteList(params),
    queryFn: () => invApi.listSites(params),
  });
}

export function useSite(siteId: string) {
  return useQuery({
    queryKey: invKeys.siteDetail(siteId),
    queryFn: () => invApi.getSite(siteId),
    enabled: !!siteId,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSiteRequest) => invApi.createSite(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: invKeys.sites }),
  });
}

export function useUpdateSite(siteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSiteRequest) => invApi.updateSite(siteId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invKeys.siteDetail(siteId) });
      qc.invalidateQueries({ queryKey: invKeys.sites });
    },
  });
}

export function useArchiveSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (siteId: string) => invApi.archiveSite(siteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: invKeys.sites }),
  });
}

// --- Warehouses ---

export function useWarehouses(params: ListWarehousesParams = {}) {
  return useQuery({
    queryKey: invKeys.warehouseList(params),
    queryFn: () => invApi.listWarehouses(params),
  });
}

export function useWarehouse(warehouseId: string) {
  return useQuery({
    queryKey: invKeys.warehouseDetail(warehouseId),
    queryFn: () => invApi.getWarehouse(warehouseId),
    enabled: !!warehouseId,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWarehouseRequest) => invApi.createWarehouse(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: invKeys.warehouses }),
  });
}

export function useUpdateWarehouse(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateWarehouseRequest) => invApi.updateWarehouse(warehouseId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invKeys.warehouseDetail(warehouseId) });
      qc.invalidateQueries({ queryKey: invKeys.warehouses });
    },
  });
}

export function useArchiveWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) => invApi.archiveWarehouse(warehouseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: invKeys.warehouses }),
  });
}

// --- Locations ---

export function useLocations(params: ListLocationsParams = {}) {
  return useQuery({
    queryKey: invKeys.locationList(params),
    queryFn: () => invApi.listLocations(params),
  });
}

export function useLocation(locationId: string) {
  return useQuery({
    queryKey: invKeys.locationDetail(locationId),
    queryFn: () => invApi.getLocation(locationId),
    enabled: !!locationId,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLocationRequest) => invApi.createLocation(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: invKeys.locations }),
  });
}

export function useUpdateLocation(locationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateLocationRequest) => invApi.updateLocation(locationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invKeys.locationDetail(locationId) });
      qc.invalidateQueries({ queryKey: invKeys.locations });
    },
  });
}

export function useArchiveLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (locationId: string) => invApi.archiveLocation(locationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: invKeys.locations }),
  });
}

// --- Location Tree ---

export function useLocationTree(params: LocationTreeParams = {}) {
  return useQuery({
    queryKey: invKeys.locationTree(params),
    queryFn: () => invApi.getLocationTree(params),
  });
}

