import { STOCK_PERMISSIONS } from '@/types/stock-movements.types';
import { useState } from 'react';
import { useReserveStock } from '@/hooks/use-stock-movements';
import { FormField } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StockActionLayout } from './stock-action-layout';
import type { ReserveStockRequest } from '@/types/stock-movements.types';

export function ReserveStockPage() {
  const mutation = useReserveStock();
  const [form, setForm] = useState<ReserveStockRequest>({ siteId: '', skuId: '', quantity: 1 });
  const [successId, setSuccessId] = useState<string>();
  const set = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <StockActionLayout
      title="Reserve Stock" description="Reserve stock for an order or reference" breadcrumbLabel="Reserve"
      isPending={mutation.isPending} error={mutation.error} successMovementId={successId}
      requiredPermission={STOCK_PERMISSIONS.STOCK_RESERVE}
      onSubmit={() => mutation.mutate(form, { onSuccess: (r: any) => setSuccessId(r.movementId) })}
    >
      <FormField label="Site ID" required><Input value={form.siteId} onChange={(e) => set('siteId', e.target.value)} required /></FormField>
      <FormField label="SKU ID" required><Input value={form.skuId} onChange={(e) => set('skuId', e.target.value)} required /></FormField>
      <FormField label="Quantity" required><Input type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} required /></FormField>
      <FormField label="Location ID"><Input value={form.locationId ?? ''} onChange={(e) => set('locationId', e.target.value)} /></FormField>
      <FormField label="Reference Type"><Input value={form.referenceType ?? ''} onChange={(e) => set('referenceType', e.target.value)} /></FormField>
      <FormField label="Reference ID"><Input value={form.referenceId ?? ''} onChange={(e) => set('referenceId', e.target.value)} /></FormField>
      <FormField label="Stock Item ID"><Input value={form.stockItemId ?? ''} onChange={(e) => set('stockItemId', e.target.value)} /></FormField>
      <FormField label="Notes"><Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></FormField>
    </StockActionLayout>
  );
}

