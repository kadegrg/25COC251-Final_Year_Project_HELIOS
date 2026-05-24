import { useAuthStore } from '@/stores/auth.store';
import { PageHeader, SectionCard, AALBadge, AutoStatusBadge } from '@/components/common';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const aal = useAuthStore((s) => s.aal);

  if (!user) return null;

  const fields = [
    { label: 'Email', value: user.email },
    { label: 'Username', value: user.username },
    { label: 'Display Name', value: user.displayName },
    { label: 'Status', value: <AutoStatusBadge status={user.status} /> },
    { label: 'Email Verified', value: user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : 'Not verified' },
    { label: 'Account Created', value: new Date(user.createdAt).toLocaleDateString() },
    { label: 'Current AAL', value: <AALBadge level={aal} /> },
  ];

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your account information"
        breadcrumbs={[{ label: 'Profile' }]}
      />

      <SectionCard title="Account Details">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-sm font-medium text-muted-foreground">{f.label}</dt>
              <dd className="mt-1 text-sm">{f.value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
    </>
  );
}

