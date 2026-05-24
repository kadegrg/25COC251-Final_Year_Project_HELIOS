import { type ReactNode, useState } from 'react';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FormDialogProps {
  trigger: ReactNode;
  title: string;
  children: (opts: { close: () => void }) => ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FormDialog({ trigger, title, children, open: controlledOpen, onOpenChange }: FormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement}>{null}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children({ close: () => setOpen(false) })}
      </DialogContent>
    </Dialog>
  );
}

