import { api } from './api-client';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  AttributeDefinition,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  Sku,
  CreateSkuRequest,
  UpdateSkuRequest,
  ListSkusParams,
  SkuMetadata,
  SingleResponse,
  PaginatedResponse,
} from '@/types/sku-metadata.types';

const BASE = '/v1/inventory';

// --- Categories ---

export async function listCategories() {
  const res = await api.get<SingleResponse<Category[]>>(`${BASE}/categories`);
  return res.data.data;
}

export async function createCategory(body: CreateCategoryRequest) {
  const res = await api.post<SingleResponse<Category>>(`${BASE}/categories`, body);
  return res.data.data;
}

export async function updateCategory(categoryId: string, body: UpdateCategoryRequest) {
  const res = await api.patch<SingleResponse<Category>>(`${BASE}/categories/${categoryId}`, body);
  return res.data.data;
}

// --- Attributes ---

export async function listAttributes(categoryId?: string) {
  const params = categoryId ? { categoryId } : {};
  const res = await api.get<SingleResponse<AttributeDefinition[]>>(`${BASE}/attributes`, { params });
  return res.data.data;
}

export async function createAttribute(body: CreateAttributeRequest) {
  const res = await api.post<SingleResponse<AttributeDefinition>>(`${BASE}/attributes`, body);
  return res.data.data;
}

export async function updateAttribute(attributeId: string, body: UpdateAttributeRequest) {
  const res = await api.patch<SingleResponse<AttributeDefinition>>(`${BASE}/attributes/${attributeId}`, body);
  return res.data.data;
}

// --- SKUs ---

export async function listSkus(params: ListSkusParams = {}) {
  const res = await api.get<PaginatedResponse<Sku>>(`${BASE}/skus`, { params });
  return res.data;
}

export async function getSku(skuId: string) {
  const res = await api.get<SingleResponse<Sku>>(`${BASE}/skus/${skuId}`);
  return res.data.data;
}

export async function createSku(body: CreateSkuRequest) {
  const res = await api.post<SingleResponse<Sku>>(`${BASE}/skus`, body);
  return res.data.data;
}

export async function updateSku(skuId: string, body: UpdateSkuRequest) {
  const res = await api.patch<SingleResponse<Sku>>(`${BASE}/skus/${skuId}`, body);
  return res.data.data;
}

export async function archiveSku(skuId: string) {
  const res = await api.delete<SingleResponse<Sku>>(`${BASE}/skus/${skuId}`);
  return res.data.data;
}

// --- SKU Metadata ---

export async function getSkuMetadata(skuId: string) {
  const res = await api.get<SingleResponse<SkuMetadata>>(`${BASE}/skus/${skuId}/metadata`);
  return res.data.data;
}

export async function setSkuMetadata(skuId: string, body: SkuMetadata) {
  const res = await api.put<SingleResponse<SkuMetadata>>(`${BASE}/skus/${skuId}/metadata`, body);
  return res.data.data;
}

