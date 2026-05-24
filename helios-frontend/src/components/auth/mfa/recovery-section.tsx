import { useState } from 'react';
import { recoveryApi } from '@/lib/auth-api';
import { parseApiError } from '@/lib/api-errors';
import { SectionCard, ConfirmDialog } from '@/components/common';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Download } from 'lucide-react';
import type { MfaFactor } from '@/types/auth.types';

interface Props {
  factor?: MfaFactor;
  onChanged: () => void;
}

export function RecoverySection({ factor, onChanged }: Props) {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRegenerate = async () => {
    setError('');
    try {
      const data = await recoveryApi.regenerate();
      setCodes(data.codes);
      onChanged();
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const handleCopy = async () => {
    if (!codes) return;
    await navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!codes) return;
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'helios-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionCard
      title="Recovery Codes"
      description="Backup codes for account recovery when other MFA methods are unavailable"
      actions={
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
            </Button>
          }
          title="Regenerate Recovery Codes"
          description="This will invalidate all existing recovery codes and generate new ones. Make sure to save the new codes."
          confirmLabel="Regenerate"
          onConfirm={handleRegenerate}
        />
      }
    >
      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}

      {codes && (
        <div className="space-y-3">
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Save these codes in a secure location. They will not be shown again.
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-md border p-4 font-mono text-sm">
            {codes.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-1 h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1 h-3.5 w-3.5" /> Download
            </Button>
          </div>
        </div>
      )}

      {!codes && factor && (
        <p className="text-sm text-muted-foreground">
          {factor.remainingCodes !== undefined
            ? `${factor.remainingCodes} recovery codes remaining.`
            : 'Recovery codes are active.'}
        </p>
      )}

      {!codes && !factor && (
        <p className="text-sm text-muted-foreground">
          No recovery codes generated. Use &quot;Regenerate&quot; to create new codes.
        </p>
      )}
    </SectionCard>
  );
}

