import { useState } from 'react';
import { useMoveStock } from '@/hooks/use-stock-movements';
import { FormField } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StockActionLayout } from './stock-action-layout';
import { STOCK_STATUS_CODES, STOCK_PERMISSIONS } from '@/types/stock-movements.types';
import type { MoveStockRequest } from '@/types/stock-movements.types';

export function MoveStockPage() {
  const mutation = useMoveStock();
  const [form, setForm] = useState<MoveStockRequest>({
    siteId: '', skuId: '', fromLocationId: '', toLocationId: '', quantity: 1,
  });
  const [successId, setSuccessId] = useState<string>();
  const set = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <StockActionLayout
      title="Move Stock" description="Move stock between locations" breadcrumbLabel="Move"
      isPending={mutation.isPending} error={mutation.error} successMovementId={successId}
      requiredPermission={STOCK_PERMISSIONS.STOCK_MOVE}
      onSubmit={() => mutation.mutate(form, { onSuccess: (r: any) => setSuccessId(r.movementId) })}
    >
      <FormField label="Site ID" required><Input value={form.siteId} onChange={(e) => set('siteId', e.target.value)} required /></FormField>
      <FormField label="SKU ID" required><Input value={form.skuId} onChange={(e) => set('skuId', e.target.value)} required /></FormField>
      <FormField label="From Location ID" required><Input value={form.fromLocationId} onChange={(e) => set('fromLocationId', e.target.value)} required /></FormField>
      <FormField label="To Location ID" required><Input value={form.toLocationId} onChange={(e) => set('toLocationId', e.target.value)} required /></FormField>
      <FormField label="Quantity" required><Input type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} required /></FormField>
      <FormField label="Stock Status Code">
        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.stockStatusCode ?? 'SELLABLE'} onChange={(e) => set('stockStatusCode', e.target.value)}>
          {STOCK_STATUS_CODES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FormField>
      <FormField label="Stock Item ID (optional)"><Input value={form.stockItemId ?? ''} onChange={(e) => set('stockItemId', e.target.value)} /></FormField>
      <FormField label="Notes"><Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></FormField>
    </StockActionLayout>
  );
}

