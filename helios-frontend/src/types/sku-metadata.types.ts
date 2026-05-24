/** SKU & Metadata types */

export const SKU_METADATA_PERMISSIONS = {
  SKU_READ: 'inventory.sku.read',
  SKU_CREATE: 'inventory.sku.create',
  SKU_UPDATE: 'inventory.sku.update',
  SKU_ARCHIVE: 'inventory.sku.archive',
  METADATA_READ: 'inventory.metadata.read',
  METADATA_MANAGE: 'inventory.metadata.manage',
} as const;

// --- Categories ---

export interface Category {
  categoryId: string;
  categoryKey: string;
  categoryName: string;
  description: string | null;
  parentCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  categoryKey: string;
  categoryName: string;
  description?: string;
  parentCategoryId?: string;
}

export interface UpdateCategoryRequest {
  categoryName?: string;
  description?: string;
  parentCategoryId?: string | null;
}

// --- Attributes ---

export type AttributeDataType =
  | 'STRING'
  | 'TEXT'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'JSON'
  | 'ENUM';

export const ATTRIBUTE_DATA_TYPES: AttributeDataType[] = [
  'STRING', 'TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME', 'JSON', 'ENUM',
];

export interface AttributeDefinition {
  attributeId: string;
  attributeKey: string;
  attributeName: string;
  categoryId: string | null;
  dataType: AttributeDataType;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  validationRules: Record<string, unknown> | null;
  enumValues: string[] | null;
  unitLabel: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttributeRequest {
  attributeKey: string;
  attributeName: string;
  categoryId?: string;
  dataType: AttributeDataType;
  isRequired?: boolean;
  isFilterable?: boolean;
  isSearchable?: boolean;
  validationRules?: Record<string, unknown>;
  enumValues?: string[];
  unitLabel?: string;
  sortOrder?: number;
}

export interface UpdateAttributeRequest {
  attributeName?: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  isSearchable?: boolean;
  validationRules?: Record<string, unknown>;
  enumValues?: string[];
  unitLabel?: string;
  sortOrder?: number;
}

// --- SKUs ---

export type TrackingMode = 'QUANTITY' | 'SERIALIZED' | 'BATCH';
export type SkuStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

export const TRACKING_MODES: TrackingMode[] = ['QUANTITY', 'SERIALIZED', 'BATCH'];
export const SKU_STATUSES: SkuStatus[] = ['ACTIVE', 'INACTIVE', 'DISCONTINUED'];
export const SKU_UPDATE_STATUSES: ('ACTIVE' | 'INACTIVE')[] = ['ACTIVE', 'INACTIVE'];

export interface Sku {
  skuId: string;
  skuCode: string;
  barcode: string | null;
  categoryId: string | null;
  skuName: string;
  shortDescription: string | null;
  longDescription: string | null;
  trackingMode: TrackingMode;
  status: SkuStatus;
  defaultUom: string;
  sellableByDefault: boolean;
  requiresExpiryTracking: boolean;
  requiresBatchTracking: boolean;
  weight: number | null;
  dimensionsJson: Record<string, unknown> | null;
  metadataCache: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkuRequest {
  skuCode: string;
  barcode?: string;
  categoryId?: string;
  skuName: string;
  shortDescription?: string;
  longDescription?: string;
  trackingMode: TrackingMode;
  status?: SkuStatus;
  defaultUom: string;
  sellableByDefault?: boolean;
  requiresExpiryTracking?: boolean;
  requiresBatchTracking?: boolean;
  weight?: number;
  dimensionsJson?: Record<string, unknown>;
}

export interface UpdateSkuRequest {
  barcode?: string;
  categoryId?: string | null;
  skuName?: string;
  shortDescription?: string;
  longDescription?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  defaultUom?: string;
  sellableByDefault?: boolean;
  requiresExpiryTracking?: boolean;
  requiresBatchTracking?: boolean;
  weight?: number | null;
  dimensionsJson?: Record<string, unknown>;
}

export interface ListSkusParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  trackingMode?: string;
  search?: string;
}

// --- Metadata ---

export type SkuMetadata = Record<string, unknown>;

// --- API envelopes ---

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

