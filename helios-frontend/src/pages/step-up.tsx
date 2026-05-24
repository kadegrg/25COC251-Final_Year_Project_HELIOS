import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { totpApi, webAuthnApi, recoveryApi, factorsApi, authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth.store';
import { parseApiError } from '@/lib/api-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { MfaMethod } from '@/types/auth.types';

export function StepUpPage() {
  const [params] = useSearchParams();
  const required = params.get('required') || '2';
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUserFromMe = useAuthStore((s) => s.setUserFromMe);

  const [methods, setMethods] = useState<MfaMethod[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [factorsLoading, setFactorsLoading] = useState(true);

  useEffect(() => {
    factorsApi.list().then((factors) => {
      const m: MfaMethod[] = [];
      if (factors.some((f) => f.factorType === 'totp' && f.isVerified)) m.push('totp');
      if (factors.some((f) => f.factorType === 'webauthn' && f.isVerified)) m.push('webauthn');
      if (factors.some((f) => f.factorType === 'recovery' && f.isVerified)) m.push('recovery');
      setMethods(m);
    }).catch(() => {
      setMethods(['totp', 'recovery']);
    }).finally(() => setFactorsLoading(false));
  }, []);

  const handleSuccess = async (accessToken: string, expiresIn: number) => {
    setAuth(accessToken, expiresIn);
    try {
      const me = await authApi.me();
      setUserFromMe(me);
    } catch { /* continue */ }
    navigate(-1);
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await totpApi.verify({ code });
      await handleSuccess(res.accessToken, res.expiresIn);
    } catch (err) { setError(parseApiError(err).message); } finally { setLoading(false); }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await recoveryApi.use({ code });
      await handleSuccess(res.accessToken, res.expiresIn);
    } catch (err) { setError(parseApiError(err).message); } finally { setLoading(false); }
  };

  const handleWebAuthn = async () => {
    setError('');
    setLoading(true);
    try {
      const { options, challengeId } = await webAuthnApi.authenticateOptions({});
      const credential = await navigator.credentials.get({ publicKey: options });
      if (!credential) throw new Error('No credential');
      const pk = credential as PublicKeyCredential;
      const resp = pk.response as AuthenticatorAssertionResponse;
      const serialized = {
        id: pk.id, rawId: btoa(String.fromCharCode(...new Uint8Array(pk.rawId))), type: pk.type,
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(resp.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(resp.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(resp.signature))),
          userHandle: resp.userHandle ? btoa(String.fromCharCode(...new Uint8Array(resp.userHandle))) : null,
        },
      };
      const res = await webAuthnApi.authenticateVerify({ challengeId, credential: serialized });
      await handleSuccess(res.accessToken, res.expiresIn);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') setError('Cancelled.');
      else setError(parseApiError(err).message);
    } finally { setLoading(false); }
  };

  const defaultTab = methods[0] ?? 'totp';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Additional Verification Required</h1>
          <p className="text-sm text-muted-foreground">
            This action requires AAL{required}. Please verify your identity.
          </p>
        </div>

        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}

        {factorsLoading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : methods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No MFA methods available.</p>
        ) : (
          <Tabs defaultValue={defaultTab} onValueChange={() => { setCode(''); setError(''); }}>
            <TabsList className="w-full">
              {methods.includes('totp') && <TabsTrigger value="totp">Code</TabsTrigger>}
              {methods.includes('webauthn') && <TabsTrigger value="webauthn">Key</TabsTrigger>}
              {methods.includes('recovery') && <TabsTrigger value="recovery">Recovery</TabsTrigger>}
            </TabsList>

            {methods.includes('totp') && (
              <TabsContent value="totp">
                <form onSubmit={handleTotp} className="mt-3 space-y-3">
                  <FormField label="6-digit code" htmlFor="su-totp">
                    <Input id="su-totp" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus />
                  </FormField>
                  <Button type="submit" disabled={loading || code.length !== 6} className="w-full">{loading ? 'Verifying…' : 'Verify'}</Button>
                </form>
              </TabsContent>
            )}

            {methods.includes('webauthn') && (
              <TabsContent value="webauthn">
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-muted-foreground">Use your security key.</p>
                  <Button onClick={handleWebAuthn} disabled={loading} className="w-full">{loading ? 'Waiting…' : 'Use Security Key'}</Button>
                </div>
              </TabsContent>
            )}

            {methods.includes('recovery') && (
              <TabsContent value="recovery">
                <form onSubmit={handleRecovery} className="mt-3 space-y-3">
                  <FormField label="Recovery code" htmlFor="su-recovery">
                    <Input id="su-recovery" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" autoFocus />
                  </FormField>
                  <Button type="submit" disabled={loading || !code.trim()} className="w-full">{loading ? 'Verifying…' : 'Use Code'}</Button>
                </form>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
}
