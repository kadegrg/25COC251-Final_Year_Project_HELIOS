import { useState } from 'react';
import type { CreateDiscrepancyRequest } from '@/types/transfers.types';
import { useAddDiscrepancy } from '@/hooks/use-transfers';
import { parseApiError } from '@/lib/api-errors';
import { FormField } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  transferId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DiscrepancyDialog({ transferId, open, onOpenChange, onSuccess }: Props) {
  const mutation = useAddDiscrepancy();
  const [form, setForm] = useState<CreateDiscrepancyRequest>({
    discrepancyType: '', reasonCode: '',
  });

  const set = (field: keyof CreateDiscrepancyRequest, value: string | number | undefined) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    mutation.mutate({ transferId, body: form }, {
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        setForm({ discrepancyType: '', reasonCode: '' });
      },
    });
  };

  const errorMsg = mutation.error ? parseApiError(mutation.error).message : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Discrepancy</DialogTitle>
        </DialogHeader>
        {errorMsg && <p className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMsg}</p>}
        <div className="space-y-3">
          <FormField label="Discrepancy Type" required>
            <Input value={form.discrepancyType} onChange={(e) => set('discrepancyType', e.target.value)} required />
          </FormField>
          <FormField label="Reason Code" required>
            <Input value={form.reasonCode} onChange={(e) => set('reasonCode', e.target.value)} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Expected Quantity">
              <Input type="number" value={form.expectedQuantity ?? ''} onChange={(e) => set('expectedQuantity', e.target.value ? Number(e.target.value) : undefined)} />
            </FormField>
            <FormField label="Actual Quantity">
              <Input type="number" value={form.actualQuantity ?? ''} onChange={(e) => set('actualQuantity', e.target.value ? Number(e.target.value) : undefined)} />
            </FormField>
          </div>
          <FormField label="Transfer Line ID">
            <Input value={form.transferLineId ?? ''} onChange={(e) => set('transferLineId', e.target.value || undefined)} />
          </FormField>
          <FormField label="Stock Item ID">
            <Input value={form.stockItemId ?? ''} onChange={(e) => set('stockItemId', e.target.value || undefined)} />
          </FormField>
          <FormField label="Notes">
            <Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value || undefined)} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || !form.discrepancyType || !form.reasonCode}>
            {mutation.isPending ? 'Adding…' : 'Add Discrepancy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



