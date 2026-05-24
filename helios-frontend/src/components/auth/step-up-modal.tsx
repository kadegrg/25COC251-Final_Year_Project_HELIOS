import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { authApi, totpApi, webAuthnApi, recoveryApi, factorsApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth.store';
import { parseApiError } from '@/lib/api-errors';
import { api } from '@/lib/api-client';
import type { MfaMethod } from '@/types/auth.types';

export function StepUpModal() {
  const [open, setOpen] = useState(false);
  const [requiredAAL, setRequiredAAL] = useState<number>(2);
  const [originalRequest, setOriginalRequest] = useState<any>(null);
  const [availableMethods, setAvailableMethods] = useState<MfaMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInsufficientAAL = useCallback(async (e: Event) => {
    const detail = (e as CustomEvent).detail;
    setRequiredAAL(detail.requiredAAL ?? 2);
    setOriginalRequest(detail.originalRequest);
    setOpen(true);

    // Determine available methods from factors
    try {
      const factors = await factorsApi.list();
      const methods: MfaMethod[] = [];
      if (factors.some((f) => f.factorType === 'totp' && f.isVerified)) methods.push('totp');
      if (factors.some((f) => f.factorType === 'webauthn' && f.isVerified)) methods.push('webauthn');
      if (factors.some((f) => f.factorType === 'recovery' && f.isVerified)) methods.push('recovery');
      setAvailableMethods(methods);
    } catch {
      setAvailableMethods(['totp', 'recovery']); // fallback
    }
  }, []);

  useEffect(() => {
    window.addEventListener('helios:insufficient-aal', handleInsufficientAAL);
    return () => window.removeEventListener('helios:insufficient-aal', handleInsufficientAAL);
  }, [handleInsufficientAAL]);

  const handleSuccess = async (accessToken: string, expiresIn: number) => {
    useAuthStore.getState().setAuth(accessToken, expiresIn);

    // Replay original request
    if (originalRequest) {
      try {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        await api(originalRequest);
      } catch {
        // If replay fails, user will see the error in context
      }
    }

    setOpen(false);
    setOriginalRequest(null);
    // Refresh /me to update AAL
    try {
      const me = await authApi.me();
      useAuthStore.getState().setUserFromMe(me);
    } catch { /* ignore */ }
  };

  const handleClose = () => {
    setOpen(false);
    setOriginalRequest(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Additional Verification Required</DialogTitle>
          <DialogDescription>
            This action requires AAL {requiredAAL}. Please verify your identity.
          </DialogDescription>
        </DialogHeader>

        <StepUpForm
          availableMethods={availableMethods}
          onSuccess={handleSuccess}
          loading={loading}
          setLoading={setLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

function StepUpForm({
  availableMethods,
  onSuccess,
  loading,
  setLoading,
}: {
  availableMethods: MfaMethod[];
  onSuccess: (t: string, e: number) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const defaultTab = availableMethods[0] ?? 'totp';

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await totpApi.verify({ code });
      onSuccess(res.accessToken, res.expiresIn);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await recoveryApi.use({ code });
      onSuccess(res.accessToken, res.expiresIn);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleWebAuthn = async () => {
    setError('');
    setLoading(true);
    try {
      const { options, challengeId } = await webAuthnApi.authenticateOptions({});
      const credential = await navigator.credentials.get({ publicKey: options });
      if (!credential) throw new Error('No credential returned');
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
      const res = await webAuthnApi.authenticateVerify({ challengeId, credential: serialized });
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

  if (availableMethods.length === 0) {
    return <p className="text-sm text-muted-foreground">No MFA methods available. Contact an administrator.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}

      <Tabs defaultValue={defaultTab} onValueChange={() => { setCode(''); setError(''); }}>
        <TabsList className="w-full">
          {availableMethods.includes('totp') && <TabsTrigger value="totp">Authenticator</TabsTrigger>}
          {availableMethods.includes('webauthn') && <TabsTrigger value="webauthn">Security Key</TabsTrigger>}
          {availableMethods.includes('recovery') && <TabsTrigger value="recovery">Recovery</TabsTrigger>}
        </TabsList>

        {availableMethods.includes('totp') && (
          <TabsContent value="totp">
            <form onSubmit={handleTotp} className="mt-3 space-y-3">
              <FormField label="6-digit code" htmlFor="stepup-totp">
                <Input
                  id="stepup-totp"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </FormField>
              <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
                {loading ? 'Verifying…' : 'Verify'}
              </Button>
            </form>
          </TabsContent>
        )}

        {availableMethods.includes('webauthn') && (
          <TabsContent value="webauthn">
            <div className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">Use your security key to verify.</p>
              <Button onClick={handleWebAuthn} disabled={loading} className="w-full">
                {loading ? 'Waiting…' : 'Use Security Key'}
              </Button>
            </div>
          </TabsContent>
        )}

        {availableMethods.includes('recovery') && (
          <TabsContent value="recovery">
            <form onSubmit={handleRecovery} className="mt-3 space-y-3">
              <FormField label="Recovery code" htmlFor="stepup-recovery">
                <Input
                  id="stepup-recovery"
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}



