import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateAdjustment } from '@/hooks/use-adjustments';
import { parseApiError } from '@/lib/api-errors';
import { ADJUSTMENT_TYPES, ADJUSTMENT_REASON_CODES, STOCK_STATUS_CODES } from '@/types/adjustments.types';
import type { AdjustmentType, CreateAdjustmentRequest, CreateAdjustmentLineRequest } from '@/types/adjustments.types';
import { PageHeader, SectionCard, FormField } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const emptyLine = (): CreateAdjustmentLineRequest => ({
  skuId: '', quantityDelta: 0, reasonCode: '',
});

/** Which line fields are relevant per adjustment type */
function lineFieldVisibility(type: AdjustmentType) {
  return {
    fromStatusCode: type === 'DECREASE' || type === 'STATUS_CHANGE' || type === 'RECOUNT_RECONCILIATION',
    toStatusCode: type === 'INCREASE' || type === 'STATUS_CHANGE',
    quantityDelta: true,
    countedQuantity: type === 'RECOUNT_RECONCILIATION',
    expectedQuantity: type === 'RECOUNT_RECONCILIATION',
  };
}

export function AdjustmentCreatePage() {
  const navigate = useNavigate();
  const mutation = useCreateAdjustment();

  const [form, setForm] = useState<CreateAdjustmentRequest>({
    siteId: '', adjustmentType: 'INCREASE', reasonCode: '', notes: '',
    lines: [emptyLine()],
  });

  const set = <K extends keyof CreateAdjustmentRequest>(field: K, value: CreateAdjustmentRequest[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setLine = (idx: number, field: keyof CreateAdjustmentLineRequest, value: string | number | undefined) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }));

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  const removeLine = (idx: number) => setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));

  const vis = lineFieldVisibility(form.adjustmentType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: (data) => navigate(`/inventory/adjustments/${(data as any).adjustmentId ?? ''}`),
    });
  };

  const errorMsg = mutation.error ? parseApiError(mutation.error).message : null;

  return (
    <>
      <PageHeader
        title="New Adjustment"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Adjustments', href: '/inventory/adjustments' }, { label: 'New' }]}
      />
      <form onSubmit={handleSubmit}>
        <SectionCard title="Adjustment Details">
          {errorMsg && <p className="mb-4 rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMsg}</p>}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Site ID" required>
              <Input value={form.siteId} onChange={(e) => set('siteId', e.target.value)} required />
            </FormField>
            <FormField label="Adjustment Type" required>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.adjustmentType}
                onChange={(e) => set('adjustmentType', e.target.value as AdjustmentType)}
                required
              >
                {ADJUSTMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Reason Code" required>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.reasonCode}
                onChange={(e) => set('reasonCode', e.target.value)}
                required
              >
                <option value="">Select reason…</option>
                {ADJUSTMENT_REASON_CODES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Warehouse ID">
              <Input value={form.warehouseId ?? ''} onChange={(e) => set('warehouseId', e.target.value || undefined)} />
            </FormField>
            <FormField label="Location ID">
              <Input value={form.locationId ?? ''} onChange={(e) => set('locationId', e.target.value || undefined)} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </FormField>
        </SectionCard>

        <SectionCard title="Lines" className="mt-4">
          {form.lines.map((line, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-3 mb-3 pb-3 border-b last:border-b-0">
              <div className="w-40">
                <FormField label="SKU ID" required>
                  <Input value={line.skuId} onChange={(e) => setLine(idx, 'skuId', e.target.value)} required />
                </FormField>
              </div>
              <div className="w-36">
                <FormField label="Stock Item ID">
                  <Input value={line.stockItemId ?? ''} onChange={(e) => setLine(idx, 'stockItemId', e.target.value || undefined)} />
                </FormField>
              </div>
              {vis.fromStatusCode && (
                <div className="w-36">
                  <FormField label="From Status">
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={line.fromStatusCode ?? ''} onChange={(e) => setLine(idx, 'fromStatusCode', e.target.value || undefined)}>
                      <option value="">Default (SELLABLE)</option>
                      {STOCK_STATUS_CODES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormField>
                </div>
              )}
              {vis.toStatusCode && (
                <div className="w-36">
                  <FormField label="To Status">
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={line.toStatusCode ?? ''} onChange={(e) => setLine(idx, 'toStatusCode', e.target.value || undefined)}>
                      <option value="">Default (SELLABLE)</option>
                      {STOCK_STATUS_CODES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormField>
                </div>
              )}
              <div className="w-24">
                <FormField label="Qty Delta" required>
                  <Input type="number" value={line.quantityDelta} onChange={(e) => setLine(idx, 'quantityDelta', Number(e.target.value))} required />
                </FormField>
              </div>
              {vis.countedQuantity && (
                <div className="w-24">
                  <FormField label="Counted">
                    <Input type="number" value={line.countedQuantity ?? ''} onChange={(e) => setLine(idx, 'countedQuantity', e.target.value ? Number(e.target.value) : undefined)} />
                  </FormField>
                </div>
              )}
              {vis.expectedQuantity && (
                <div className="w-24">
                  <FormField label="Expected">
                    <Input type="number" value={line.expectedQuantity ?? ''} onChange={(e) => setLine(idx, 'expectedQuantity', e.target.value ? Number(e.target.value) : undefined)} />
                  </FormField>
                </div>
              )}
              <div className="w-36">
                <FormField label="Line Reason" required>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={line.reasonCode} onChange={(e) => setLine(idx, 'reasonCode', e.target.value)} required>
                    <option value="">Select…</option>
                    {ADJUSTMENT_REASON_CODES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="w-32">
                <FormField label="Line Notes">
                  <Input value={line.notes ?? ''} onChange={(e) => setLine(idx, 'notes', e.target.value || undefined)} />
                </FormField>
              </div>
              {form.lines.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)} className="mb-1">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="mr-1 h-4 w-4" />Add Line
          </Button>
        </SectionCard>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/inventory/adjustments')}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create Adjustment'}
          </Button>
        </div>
      </form>
    </>
  );
}

