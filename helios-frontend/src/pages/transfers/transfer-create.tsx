import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTransfer } from '@/hooks/use-transfers';
import { parseApiError } from '@/lib/api-errors';
import type { CreateTransferLineRequest, CreateTransferRequest } from '@/types/transfers.types';
import { PageHeader, SectionCard, FormField } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const emptyLine = (): CreateTransferLineRequest => ({
  skuId: '', requestedQuantity: 1,
});

export function TransferCreatePage() {
  const navigate = useNavigate();
  const mutation = useCreateTransfer();

  const [form, setForm] = useState<CreateTransferRequest>({
    fromSiteId: '', toSiteId: '', reasonCode: '', notes: '',
    lines: [emptyLine()],
  });

  const set = (field: keyof CreateTransferRequest, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setLine = (idx: number, field: keyof CreateTransferLineRequest, value: string | number) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }));

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  const removeLine = (idx: number) => setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => navigate('/inventory/transfers'),
    });
  };

  const errorMsg = mutation.error ? parseApiError(mutation.error).message : null;

  return (
    <>
      <PageHeader
        title="New Transfer"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Transfers', href: '/inventory/transfers' }, { label: 'New' }]}
      />
      <form onSubmit={handleSubmit}>
        <SectionCard title="Transfer Details">
          {errorMsg && <p className="mb-4 rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMsg}</p>}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="From Site ID" required>
              <Input value={form.fromSiteId} onChange={(e) => set('fromSiteId', e.target.value)} required />
            </FormField>
            <FormField label="To Site ID" required>
              <Input value={form.toSiteId} onChange={(e) => set('toSiteId', e.target.value)} required />
            </FormField>
            <FormField label="Reason Code" required>
              <Input value={form.reasonCode} onChange={(e) => set('reasonCode', e.target.value)} required />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </FormField>
        </SectionCard>

        <SectionCard title="Lines" className="mt-4">
          {form.lines.map((line, idx) => (
            <div key={idx} className="flex items-end gap-3 mb-3 pb-3 border-b last:border-b-0">
              <div className="flex-1">
                <FormField label="SKU ID" required>
                  <Input value={line.skuId} onChange={(e) => setLine(idx, 'skuId', e.target.value)} required />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="Stock Item ID">
                  <Input value={line.stockItemId ?? ''} onChange={(e) => setLine(idx, 'stockItemId', e.target.value || undefined as any)} />
                </FormField>
              </div>
              <div className="w-24">
                <FormField label="Qty" required>
                  <Input type="number" min={1} value={line.requestedQuantity} onChange={(e) => setLine(idx, 'requestedQuantity', Number(e.target.value))} required />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="From Status">
                  <Input placeholder="SELLABLE" value={line.fromStatusCode ?? ''} onChange={(e) => setLine(idx, 'fromStatusCode', e.target.value || undefined as any)} />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="To Status">
                  <Input placeholder="AWAITING_PUTAWAY" value={line.toStatusCode ?? ''} onChange={(e) => setLine(idx, 'toStatusCode', e.target.value || undefined as any)} />
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
          <Button type="button" variant="outline" onClick={() => navigate('/inventory/transfers')}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create Transfer'}
          </Button>
        </div>
      </form>
    </>
  );
}
