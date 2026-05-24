import { useState, useEffect } from 'react';
import { factorsApi } from '@/lib/auth-api';
import { PageHeader } from '@/components/common';
import { PageLoading } from '@/components/ui/loading';
import { ErrorState } from '@/components/common';
import { TotpSection } from '@/components/auth/mfa/totp-section';
import { WebAuthnSection } from '@/components/auth/mfa/webauthn-section';
import { RecoverySection } from '@/components/auth/mfa/recovery-section';
import type { MfaFactor } from '@/types/auth.types';

export function MfaPage() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFactors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await factorsApi.list();
      setFactors(data);
    } catch {
      setError('Failed to load MFA factors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFactors(); }, []);

  if (loading) return <PageLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchFactors} />;

  const totpFactor = factors.find((f) => f.factorType === 'totp' && f.isVerified);
  const webAuthnFactors = factors.filter((f) => f.factorType === 'webauthn' && f.isVerified);
  const recoveryFactor = factors.find((f) => f.factorType === 'recovery');

  return (
    <>
      <PageHeader
        title="Multi-Factor Authentication"
        description="Manage your MFA methods"
        breadcrumbs={[{ label: 'Profile', href: '/profile' }, { label: 'MFA' }]}
      />

      <div className="space-y-6">
        <TotpSection factor={totpFactor} onChanged={fetchFactors} />
        <WebAuthnSection factors={webAuthnFactors} onChanged={fetchFactors} />
        <RecoverySection factor={recoveryFactor} onChanged={fetchFactors} />
      </div>
    </>
  );
}

