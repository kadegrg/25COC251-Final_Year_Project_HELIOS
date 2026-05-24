import { useState } from 'react';
import { totpApi } from '@/lib/auth-api';
import { parseApiError } from '@/lib/api-errors';
import { SectionCard, FormField, ConfirmDialog } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Check, Trash2 } from 'lucide-react';
import type { MfaFactor, TotpEnrolStartResponse } from '@/types/auth.types';

interface Props {
  factor?: MfaFactor;
  onChanged: () => void;
}

export function TotpSection({ factor, onChanged }: Props) {
  const [enrolData, setEnrolData] = useState<TotpEnrolStartResponse | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startEnrol = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await totpApi.enrolStart();
      setEnrolData(data);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === 'TOTP_ALREADY_ENROLLED') {
        setError('TOTP is already enrolled.');
      } else {
        setError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyEnrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrolData) return;
    setError('');
    setLoading(true);
    try {
      await totpApi.enrolVerify({ factorId: enrolData.factorId, code });
      setEnrolData(null);
      setCode('');
      onChanged();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!factor) return;
    await totpApi.remove(factor.id);
    onChanged();
  };

  return (
    <SectionCard
      title="Authenticator App"
      description="Use a TOTP authenticator app for two-factor authentication"
      actions={
        factor ? (
          <ConfirmDialog
            trigger={<Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3.5 w-3.5" /> Remove</Button>}
            title="Remove Authenticator"
            description="This will disable TOTP-based two-factor authentication. You will no longer be able to use your authenticator app to sign in."
            confirmLabel="Remove"
            variant="destructive"
            onConfirm={handleRemove}
          />
        ) : undefined
      }
    >
      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}

      {factor && !enrolData && (
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium">Authenticator app is enabled</p>
            <p className="text-xs text-muted-foreground">Added {new Date(factor.createdAt).toLocaleDateString()}</p>
          </div>
          <Check className="ml-auto h-5 w-5 text-green-600" />
        </div>
      )}

      {!factor && !enrolData && (
        <Button onClick={startEnrol} disabled={loading} variant="outline">
          <Smartphone className="mr-1.5 h-4 w-4" />
          {loading ? 'Starting…' : 'Set up authenticator'}
        </Button>
      )}

      {enrolData && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app:</p>
          <div className="flex justify-center">
            <img src={enrolData.qrCodeDataUrl} alt="TOTP QR Code" className="h-48 w-48 rounded border" />
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Can't scan? Enter manually</summary>
            <code className="mt-1 block break-all rounded bg-muted p-2 font-mono text-xs">{enrolData.secret}</code>
          </details>
          <form onSubmit={verifyEnrol} className="space-y-3">
            <FormField label="Verification code" htmlFor="totp-verify" required>
              <Input
                id="totp-verify"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
            </FormField>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || code.length !== 6}>
                {loading ? 'Verifying…' : 'Verify & Enable'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setEnrolData(null); setCode(''); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </SectionCard>
  );
}

