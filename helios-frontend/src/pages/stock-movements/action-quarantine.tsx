import { useState } from 'react';
import { useQuarantineStock } from '@/hooks/use-stock-movements';
import { FormField } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StockActionLayout } from './stock-action-layout';
import { STOCK_STATUS_CODES, STOCK_PERMISSIONS } from '@/types/stock-movements.types';
import type { QuarantineStockRequest } from '@/types/stock-movements.types';

export function QuarantineStockPage() {
  const mutation = useQuarantineStock();
  const [form, setForm] = useState<QuarantineStockRequest>({ siteId: '', locationId: '', skuId: '', quantity: 1 });
  const [successId, setSuccessId] = useState<string>();
  const set = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <StockActionLayout
      title="Quarantine Stock" description="Move stock to quarantine status" breadcrumbLabel="Quarantine"
      isPending={mutation.isPending} error={mutation.error} successMovementId={successId}
      requiredPermission={STOCK_PERMISSIONS.STOCK_MOVE}
      onSubmit={() => mutation.mutate(form, { onSuccess: (r: any) => setSuccessId(r.movementId) })}
    >
      <FormField label="Site ID" required><Input value={form.siteId} onChange={(e) => set('siteId', e.target.value)} required /></FormField>
      <FormField label="Location ID" required><Input value={form.locationId} onChange={(e) => set('locationId', e.target.value)} required /></FormField>
      <FormField label="SKU ID" required><Input value={form.skuId} onChange={(e) => set('skuId', e.target.value)} required /></FormField>
      <FormField label="Quantity" required><Input type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} required /></FormField>
      <FormField label="From Status Code">
        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.fromStatusCode ?? 'SELLABLE'} onChange={(e) => set('fromStatusCode', e.target.value)}>
          {STOCK_STATUS_CODES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FormField>
      <FormField label="Stock Item ID"><Input value={form.stockItemId ?? ''} onChange={(e) => set('stockItemId', e.target.value)} /></FormField>
      <FormField label="Notes"><Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></FormField>
    </StockActionLayout>
  );
}

