import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as skuApi from '@/lib/sku-metadata-api';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  CreateSkuRequest,
  UpdateSkuRequest,
  ListSkusParams,
  SkuMetadata,
} from '@/types/sku-metadata.types';

// --- Query keys ---

export const skuKeys = {
  categories: ['sku', 'categories'] as const,
  attributes: (categoryId?: string) => ['sku', 'attributes', categoryId] as const,
  skus: ['sku', 'skus'] as const,
  skuList: (p: ListSkusParams) => ['sku', 'skus', 'list', p] as const,
  skuDetail: (id: string) => ['sku', 'skus', id] as const,
  skuMetadata: (id: string) => ['sku', 'skus', id, 'metadata'] as const,
};

// --- Categories ---

export function useCategories() {
  return useQuery({ queryKey: skuKeys.categories, queryFn: skuApi.listCategories });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryRequest) => skuApi.createCategory(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: skuKeys.categories }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, body }: { categoryId: string; body: UpdateCategoryRequest }) =>
      skuApi.updateCategory(categoryId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: skuKeys.categories }),
  });
}

// --- Attributes ---

export function useAttributes(categoryId?: string) {
  return useQuery({
    queryKey: skuKeys.attributes(categoryId),
    queryFn: () => skuApi.listAttributes(categoryId),
  });
}

export function useCreateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAttributeRequest) => skuApi.createAttribute(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sku', 'attributes'] }),
  });
}

export function useUpdateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, body }: { attributeId: string; body: UpdateAttributeRequest }) =>
      skuApi.updateAttribute(attributeId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sku', 'attributes'] }),
  });
}

// --- SKUs ---

export function useSkuList(params: ListSkusParams) {
  return useQuery({
    queryKey: skuKeys.skuList(params),
    queryFn: () => skuApi.listSkus(params),
  });
}

export function useSkuDetail(skuId: string) {
  return useQuery({
    queryKey: skuKeys.skuDetail(skuId),
    queryFn: () => skuApi.getSku(skuId),
    enabled: !!skuId,
  });
}

export function useCreateSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSkuRequest) => skuApi.createSku(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: skuKeys.skus }),
  });
}

export function useUpdateSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skuId, body }: { skuId: string; body: UpdateSkuRequest }) =>
      skuApi.updateSku(skuId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: skuKeys.skus });
      qc.invalidateQueries({ queryKey: skuKeys.skuDetail(vars.skuId) });
    },
  });
}

export function useArchiveSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skuId: string) => skuApi.archiveSku(skuId),
    onSuccess: () => qc.invalidateQueries({ queryKey: skuKeys.skus }),
  });
}

// --- SKU Metadata ---

export function useSkuMetadata(skuId: string) {
  return useQuery({
    queryKey: skuKeys.skuMetadata(skuId),
    queryFn: () => skuApi.getSkuMetadata(skuId),
    enabled: !!skuId,
  });
}

export function useSetSkuMetadata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skuId, body }: { skuId: string; body: SkuMetadata }) =>
      skuApi.setSkuMetadata(skuId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: skuKeys.skuMetadata(vars.skuId) });
      qc.invalidateQueries({ queryKey: skuKeys.skuDetail(vars.skuId) });
    },
  });
}

