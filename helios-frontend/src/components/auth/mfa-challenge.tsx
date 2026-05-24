import { useState } from 'react';
import { parseApiError } from '@/lib/api-errors';
import { totpApi, webAuthnApi, recoveryApi } from '@/lib/auth-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KeyRound, Smartphone, FileKey } from 'lucide-react';
import type { MfaMethod } from '@/types/auth.types';

interface MfaChallengeProps {
  challengeId: string;
  availableMethods: MfaMethod[];
  onSuccess: (accessToken: string, expiresIn: number) => void;
  onCancel: () => void;
}

export function MfaChallenge({ challengeId, availableMethods, onSuccess, onCancel }: MfaChallengeProps) {
  const defaultTab = availableMethods[0] ?? 'totp';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
        <p className="mt-1 text-sm text-muted-foreground">Verify your identity to continue</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full">
          {availableMethods.includes('totp') && (
            <TabsTrigger value="totp">
              <Smartphone className="mr-1 h-3.5 w-3.5" /> Code
            </TabsTrigger>
          )}
          {availableMethods.includes('webauthn') && (
            <TabsTrigger value="webauthn">
              <KeyRound className="mr-1 h-3.5 w-3.5" /> Key
            </TabsTrigger>
          )}
          <TabsTrigger value="recovery">
            <FileKey className="mr-1 h-3.5 w-3.5" /> Recovery
          </TabsTrigger>
        </TabsList>

        {availableMethods.includes('totp') && (
          <TabsContent value="totp">
            <TotpTab challengeId={challengeId} onSuccess={onSuccess} />
          </TabsContent>
        )}
        {availableMethods.includes('webauthn') && (
          <TabsContent value="webauthn">
            <WebAuthnTab challengeId={challengeId} onSuccess={onSuccess} />
          </TabsContent>
        )}
        <TabsContent value="recovery">
          <RecoveryTab challengeId={challengeId} onSuccess={onSuccess} />
        </TabsContent>
      </Tabs>

      <Button variant="ghost" onClick={onCancel} className="w-full">
        Back to login
      </Button>
    </div>
  );
}

function TotpTab({ challengeId, onSuccess }: { challengeId: string; onSuccess: (t: string, e: number) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await totpApi.verify({ code, challengeId });
      onSuccess(res.accessToken, res.expiresIn);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}
      <FormField label="6-digit code" htmlFor="totp-code" required>
        <Input
          id="totp-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
        />
      </FormField>
      <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
        {loading ? 'Verifying…' : 'Verify'}
      </Button>
    </form>
  );
}

function WebAuthnTab({ challengeId, onSuccess }: { challengeId: string; onSuccess: (t: string, e: number) => void }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthenticate = async () => {
    setError('');
    setLoading(true);
    try {
      const { options, challengeId: authChallengeId } = await webAuthnApi.authenticateOptions({ challengeId });

      // Browser WebAuthn ceremony
      const credential = await navigator.credentials.get({ publicKey: options });
      if (!credential) throw new Error('No credential returned');

      // Serialize the credential for the server
      const pubKeyCred = credential as PublicKeyCredential;
      const response = pubKeyCred.response as AuthenticatorAssertionResponse;
      const serialized = {
        id: pubKeyCred.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(pubKeyCred.rawId))),
        type: pubKeyCred.type,
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
          userHandle: response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(response.userHandle))) : null,
        },
      };

      const res = await webAuthnApi.authenticateVerify({ challengeId: authChallengeId, credential: serialized });
      onSuccess(res.accessToken, res.expiresIn);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Security key request was cancelled.');
      } else {
        setError(parseApiError(err).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}
      <p className="text-sm text-muted-foreground">Insert or tap your security key to verify.</p>
      <Button onClick={handleAuthenticate} disabled={loading} className="w-full">
        {loading ? 'Waiting for key…' : 'Use Security Key'}
      </Button>
    </div>
  );
}

function RecoveryTab({ challengeId, onSuccess }: { challengeId: string; onSuccess: (t: string, e: number) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await recoveryApi.use({ code, challengeId });
      onSuccess(res.accessToken, res.expiresIn);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}
      <FormField label="Recovery code" htmlFor="recovery-code" required>
        <Input
          id="recovery-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter recovery code"
          autoFocus
        />
      </FormField>
      <Button type="submit" disabled={loading || !code.trim()} className="w-full">
        {loading ? 'Verifying…' : 'Use Recovery Code'}
      </Button>
    </form>
  );
}

