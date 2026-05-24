/** Inventory Structure types*/

import type { PaginatedResponse, SingleResponse } from './iam.types';

export type { PaginatedResponse, SingleResponse };

// --- Sites ---

export type SiteType = 'SUPER' | 'EDGE' | 'VIRTUAL' | 'OTHER';
export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';

export interface Site {
  inventorySiteId: string;
  siteId: string;
  siteName: string;
  siteType: SiteType;
  status: SiteStatus;
  timezone: string | null;
  addressJson: Record<string, unknown> | null;
  contactJson: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteRequest {
  siteId: string;
  siteName: string;
  siteType: SiteType;
  status?: 'ACTIVE' | 'INACTIVE';
  timezone?: string;
  addressJson?: Record<string, unknown>;
  contactJson?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateSiteRequest {
  siteName?: string;
  siteType?: SiteType;
  status?: 'ACTIVE' | 'INACTIVE';
  timezone?: string;
  addressJson?: Record<string, unknown>;
  contactJson?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// --- Warehouses ---

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export interface Warehouse {
  warehouseId: string;
  siteId: string;
  warehouseCode: string;
  warehouseName: string;
  status: WarehouseStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseRequest {
  siteId: string;
  warehouseCode: string;
  warehouseName: string;
  status?: WarehouseStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateWarehouseRequest {
  warehouseName?: string;
  status?: WarehouseStatus;
  metadata?: Record<string, unknown>;
}

// --- Locations ---

export type LocationStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface Location {
  locationId: string;
  siteId: string;
  warehouseId: string;
  parentLocationId: string | null;
  locationCode: string;
  locationName: string;
  locationType: string;
  status: LocationStatus;
  isPickable: boolean;
  isReceivable: boolean;
  isDispatchable: boolean;
  isQuarantine: boolean;
  capacityJson: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  siteId: string;
  warehouseId: string;
  parentLocationId?: string;
  locationCode: string;
  locationName: string;
  locationType: string;
  status?: LocationStatus;
  isPickable?: boolean;
  isReceivable?: boolean;
  isDispatchable?: boolean;
  isQuarantine?: boolean;
  capacityJson?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateLocationRequest {
  locationName?: string;
  locationType?: string;
  status?: LocationStatus;
  isPickable?: boolean;
  isReceivable?: boolean;
  isDispatchable?: boolean;
  isQuarantine?: boolean;
  capacityJson?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

// --- Location Tree ---

export interface LocationTreeNode {
  locationId: string;
  locationCode: string;
  locationName: string;
  locationType: string;
  status: string;
  isPickable: boolean;
  isReceivable: boolean;
  isDispatchable: boolean;
  isQuarantine: boolean;
  children: LocationTreeNode[];
}

// --- Query Params ---

export interface ListSitesParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ListWarehousesParams {
  page?: number;
  limit?: number;
  siteId?: string;
  status?: string;
}

export interface ListLocationsParams {
  page?: number;
  limit?: number;
  siteId?: string;
  warehouseId?: string;
  parentLocationId?: string;
  locationType?: string;
  status?: string;
}

export interface LocationTreeParams {
  siteId?: string;
  warehouseId?: string;
}

