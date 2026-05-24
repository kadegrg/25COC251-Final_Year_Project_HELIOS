import { useState } from 'react';
import type { TransferLine, ReceiveLineInput, ReceiveTransferRequest } from '@/types/transfers.types';
import { useReceiveTransfer } from '@/hooks/use-transfers';
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
  lines: TransferLine[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReceiveDialog({ transferId, lines, open, onOpenChange, onSuccess }: Props) {
  const mutation = useReceiveTransfer();

  const [receiveLines, setReceiveLines] = useState<ReceiveLineInput[]>(
    lines.map((l) => ({ transferLineId: l.transferLineId, receivedQuantity: l.dispatchedQuantity || l.requestedQuantity })),
  );
  const [notes, setNotes] = useState('');

  const setLine = (idx: number, field: keyof ReceiveLineInput, value: string | number) =>
    setReceiveLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));

  const handleSubmit = () => {
    const body: ReceiveTransferRequest = { lines: receiveLines, notes: notes || undefined };
    mutation.mutate({ transferId, body }, { onSuccess: () => { onSuccess(); onOpenChange(false); } });
  };

  const errorMsg = mutation.error ? parseApiError(mutation.error).message : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Transfer</DialogTitle>
        </DialogHeader>
        {errorMsg && <p className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMsg}</p>}
        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div key={line.transferLineId} className="grid grid-cols-4 gap-3 items-end border-b pb-3">
              <div className="text-sm">
                <div className="text-muted-foreground">SKU</div>
                <code className="text-xs">{line.skuId.slice(0, 8)}…</code>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">Dispatched</div>
                {line.dispatchedQuantity}
              </div>
              <FormField label="Received Qty" required>
                <Input
                  type="number" min={0}
                  value={receiveLines[idx]?.receivedQuantity ?? 0}
                  onChange={(e) => setLine(idx, 'receivedQuantity', Number(e.target.value))}
                />
              </FormField>
              <FormField label="Discrepancy Reason">
                <Input
                  placeholder="e.g. COUNT_MISMATCH"
                  value={receiveLines[idx]?.discrepancyReasonCode ?? ''}
                  onChange={(e) => setLine(idx, 'discrepancyReasonCode', e.target.value || undefined as any)}
                />
              </FormField>
            </div>
          ))}
          <FormField label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Receiving…' : 'Confirm Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



