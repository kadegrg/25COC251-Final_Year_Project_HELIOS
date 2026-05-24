import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adjustmentsApi from '@/lib/adjustments-api';
import type { ListAdjustmentsParams, CreateAdjustmentRequest } from '@/types/adjustments.types';

export const adjustmentKeys = {
  all: ['inventory', 'adjustments'] as const,
  list: (p: ListAdjustmentsParams) => ['inventory', 'adjustments', 'list', p] as const,
  detail: (id: string) => ['inventory', 'adjustments', id] as const,
};

export function useAdjustmentList(params: ListAdjustmentsParams = {}) {
  return useQuery({ queryKey: adjustmentKeys.list(params), queryFn: () => adjustmentsApi.listAdjustments(params) });
}

export function useAdjustment(adjustmentId: string) {
  return useQuery({ queryKey: adjustmentKeys.detail(adjustmentId), queryFn: () => adjustmentsApi.getAdjustment(adjustmentId), enabled: !!adjustmentId });
}

function useAdjustmentAction<T = void>(mutationFn: (args: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adjustmentKeys.all });
    },
  });
}

export function useCreateAdjustment() {
  return useAdjustmentAction<CreateAdjustmentRequest>(adjustmentsApi.createAdjustment);
}

export function useApproveAdjustment() {
  return useAdjustmentAction<string>(adjustmentsApi.approveAdjustment);
}

export function usePostAdjustment() {
  return useAdjustmentAction<string>(adjustmentsApi.postAdjustment);
}

export function useCancelAdjustment() {
  return useAdjustmentAction<string>(adjustmentsApi.cancelAdjustment);
}

