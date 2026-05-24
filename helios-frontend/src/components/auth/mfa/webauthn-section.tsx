import { useState } from 'react';
import { webAuthnApi } from '@/lib/auth-api';
import { parseApiError } from '@/lib/api-errors';
import { SectionCard, FormField, ConfirmDialog } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Trash2, Plus } from 'lucide-react';
import type { MfaFactor } from '@/types/auth.types';

interface Props {
  factors: MfaFactor[];
  onChanged: () => void;
}

export function WebAuthnSection({ factors, onChanged }: Props) {
  const [friendlyName, setFriendlyName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const { options, factorId, challengeId } = await webAuthnApi.registerOptions({
        friendlyName: friendlyName.trim() || undefined,
      });

      const credential = await navigator.credentials.create({ publicKey: options });
      if (!credential) throw new Error('No credential returned');

      const pubKeyCred = credential as PublicKeyCredential;
      const response = pubKeyCred.response as AuthenticatorAttestationResponse;
      const serialized = {
        id: pubKeyCred.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(pubKeyCred.rawId))),
        type: pubKeyCred.type,
        response: {
          attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
        },
      };

      await webAuthnApi.registerVerify({ factorId, challengeId, credential: serialized });
      setShowAdd(false);
      setFriendlyName('');
      onChanged();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Security key registration was cancelled.');
      } else {
        setError(parseApiError(err).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (factorId: string) => {
    await webAuthnApi.remove(factorId);
    onChanged();
  };

  return (
    <SectionCard
      title="Security Keys"
      description="Hardware security keys for two-factor authentication"
      actions={
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Key
        </Button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}

      {showAdd && (
        <div className="mb-4 space-y-3 rounded-md border p-4">
          <FormField label="Key name (optional)" htmlFor="key-name">
            <Input
              id="key-name"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              placeholder="Security Key"
              maxLength={100}
              autoFocus
            />
          </FormField>
          <div className="flex gap-2">
            <Button onClick={handleRegister} disabled={loading}>
              {loading ? 'Waiting for key…' : 'Register Key'}
            </Button>
            <Button variant="outline" onClick={() => { setShowAdd(false); setFriendlyName(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {factors.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground">No security keys registered.</p>
      )}

      {factors.length > 0 && (
        <div className="space-y-3">
          {factors.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{f.friendlyName}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(f.createdAt).toLocaleDateString()}
                    {f.webauthn?.deviceType && ` · ${f.webauthn.deviceType}`}
                  </p>
                </div>
              </div>
              <ConfirmDialog
                trigger={<Button variant="destructive" size="icon-sm"><Trash2 className="h-3.5 w-3.5" /></Button>}
                title="Remove Security Key"
                description={`Remove "${f.friendlyName}"? You will no longer be able to use this key for authentication.`}
                confirmLabel="Remove"
                variant="destructive"
                onConfirm={() => handleRemove(f.id)}
              />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

