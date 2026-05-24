import { useState } from 'react';
import { useReceiveStock } from '@/hooks/use-stock-movements';
import { FormField } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StockActionLayout } from './stock-action-layout';
import { STOCK_STATUS_CODES, STOCK_PERMISSIONS } from '@/types/stock-movements.types';
import type { ReceiveStockRequest } from '@/types/stock-movements.types';

export function ReceiveStockPage() {
  const mutation = useReceiveStock();
  const [form, setForm] = useState<ReceiveStockRequest>({
    siteId: '', locationId: '', skuId: '', quantity: 1,
  });
  const [successId, setSuccessId] = useState<string>();

  const set = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    mutation.mutate(form, {
      onSuccess: (res: any) => setSuccessId(res.movementId),
    });
  };

  return (
    <StockActionLayout
      title="Receive Stock" description="Receive goods into inventory" breadcrumbLabel="Receive"
      isPending={mutation.isPending} error={mutation.error} onSubmit={handleSubmit} successMovementId={successId}
      requiredPermission={STOCK_PERMISSIONS.STOCK_RECEIVE}
    >
      <FormField label="Site ID" required><Input value={form.siteId} onChange={(e) => set('siteId', e.target.value)} required /></FormField>
      <FormField label="Location ID" required><Input value={form.locationId} onChange={(e) => set('locationId', e.target.value)} required /></FormField>
      <FormField label="SKU ID" required><Input value={form.skuId} onChange={(e) => set('skuId', e.target.value)} required /></FormField>
      <FormField label="Quantity" required><Input type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} required /></FormField>
      <FormField label="Stock Status Code">
        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.stockStatusCode ?? 'AWAITING_PUTAWAY'} onChange={(e) => set('stockStatusCode', e.target.value)}>
          {STOCK_STATUS_CODES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FormField>
      <FormField label="Serial Number"><Input value={form.serialNumber ?? ''} onChange={(e) => set('serialNumber', e.target.value)} /></FormField>
      <FormField label="Batch Number"><Input value={form.batchNumber ?? ''} onChange={(e) => set('batchNumber', e.target.value)} /></FormField>
      <FormField label="Expiry Date"><Input type="date" value={form.expiryDate ?? ''} onChange={(e) => set('expiryDate', e.target.value)} /></FormField>
      <FormField label="Notes"><Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></FormField>
    </StockActionLayout>
  );
}

