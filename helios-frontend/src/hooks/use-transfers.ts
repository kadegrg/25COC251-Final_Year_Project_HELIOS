import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transfersApi from '@/lib/transfers-api';
import type {
  ListTransfersParams, CreateTransferRequest,
  ReceiveTransferRequest, CreateDiscrepancyRequest,
} from '@/types/transfers.types';

export const transferKeys = {
  all: ['inventory', 'transfers'] as const,
  list: (p: ListTransfersParams) => ['inventory', 'transfers', 'list', p] as const,
  detail: (id: string) => ['inventory', 'transfers', id] as const,
  discrepancies: (id: string) => ['inventory', 'transfers', id, 'discrepancies'] as const,
};

export function useTransferList(params: ListTransfersParams = {}) {
  return useQuery({ queryKey: transferKeys.list(params), queryFn: () => transfersApi.listTransfers(params) });
}

export function useTransfer(transferId: string) {
  return useQuery({ queryKey: transferKeys.detail(transferId), queryFn: () => transfersApi.getTransfer(transferId), enabled: !!transferId });
}

export function useDiscrepancies(transferId: string) {
  return useQuery({ queryKey: transferKeys.discrepancies(transferId), queryFn: () => transfersApi.getDiscrepancies(transferId), enabled: !!transferId });
}

function useTransferAction<T = void>(mutationFn: (args: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transferKeys.all });
    },
  });
}

export function useCreateTransfer() {
  return useTransferAction<CreateTransferRequest>(transfersApi.createTransfer);
}

export function useApproveTransfer() {
  return useTransferAction<string>(transfersApi.approveTransfer);
}

export function useDispatchTransfer() {
  return useTransferAction<string>(transfersApi.dispatchTransfer);
}

export function useReceiveTransfer() {
  return useTransferAction<{ transferId: string; body: ReceiveTransferRequest }>(
    ({ transferId, body }) => transfersApi.receiveTransfer(transferId, body),
  );
}

export function useReconcileTransfer() {
  return useTransferAction<string>(transfersApi.reconcileTransfer);
}

export function useCancelTransfer() {
  return useTransferAction<string>(transfersApi.cancelTransfer);
}

export function useAddDiscrepancy() {
  return useTransferAction<{ transferId: string; body: CreateDiscrepancyRequest }>(
    ({ transferId, body }) => transfersApi.addDiscrepancy(transferId, body),
  );
}

