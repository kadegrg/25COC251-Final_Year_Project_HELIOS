import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateSite, useSite, useUpdateSite } from '@/hooks/use-inventory-structure';
import { PageHeader, FormField, SectionCard, QueryResult } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseApiError } from '@/lib/api-errors';
import type { SiteType } from '@/types/inventory-structure.types';

function tryParseJson(s: string): Record<string, unknown> | undefined {
  if (!s.trim()) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
}

export function CreateSitePage() {
  return <SiteFormInner mode="create" />;
}

export function EditSitePage() {
  const { siteId } = useParams<{ siteId: string }>();
  const query = useSite(siteId!);
  return (
    <QueryResult isLoading={query.isLoading} error={query.error} data={query.data} notFoundNoun="site" onRetry={() => query.refetch()}>
      {query.data && <SiteFormInner mode="edit" siteId={siteId!} initial={query.data} />}
    </QueryResult>
  );
}

interface SiteFormInnerProps {
  mode: 'create' | 'edit';
  siteId?: string;
  initial?: {
    siteId: string;
    siteName: string;
    siteType: SiteType;
    status: string;
    timezone: string | null;
    addressJson: Record<string, unknown> | null;
    contactJson: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
  };
}

function SiteFormInner({ mode, siteId, initial }: SiteFormInnerProps) {
  const navigate = useNavigate();
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite(siteId ?? '');
  const isPending = mode === 'create' ? createMutation.isPending : updateMutation.isPending;

  const [siteIdField, setSiteIdField] = useState(initial?.siteId ?? '');
  const [siteName, setSiteName] = useState(initial?.siteName ?? '');
  const [siteType, setSiteType] = useState<SiteType>(initial?.siteType ?? 'OTHER');
  const [status, setStatus] = useState(initial?.status ?? 'ACTIVE');
  const [timezone, setTimezone] = useState(initial?.timezone ?? '');
  const [addressJson, setAddressJson] = useState(initial?.addressJson ? JSON.stringify(initial.addressJson, null, 2) : '');
  const [contactJson, setContactJson] = useState(initial?.contactJson ? JSON.stringify(initial.contactJson, null, 2) : '');
  const [metadata, setMetadata] = useState(initial?.metadata ? JSON.stringify(initial.metadata, null, 2) : '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // validate JSON fields
    for (const [label, val] of [['Address', addressJson], ['Contact', contactJson], ['Metadata', metadata]] as const) {
      if (val.trim() && !tryParseJson(val)) {
        setError(`${label} JSON is invalid.`);
        return;
      }
    }

    try {
      if (mode === 'create') {
        const site = await createMutation.mutateAsync({
          siteId: siteIdField,
          siteName,
          siteType,
          status: status as 'ACTIVE' | 'INACTIVE',
          timezone: timezone || undefined,
          addressJson: tryParseJson(addressJson),
          contactJson: tryParseJson(contactJson),
          metadata: tryParseJson(metadata),
        });
        navigate(`/inventory/structure/sites/${site.siteId}`);
      } else {
        await updateMutation.mutateAsync({
          siteName,
          siteType,
          status: status as 'ACTIVE' | 'INACTIVE',
          timezone: timezone || undefined,
          addressJson: tryParseJson(addressJson),
          contactJson: tryParseJson(contactJson),
          metadata: tryParseJson(metadata),
        });
        navigate(`/inventory/structure/sites/${siteId}`);
      }
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader
        title={mode === 'create' ? 'Create Site' : 'Edit Site'}
        breadcrumbs={[
          { label: 'Sites', href: '/inventory/structure/sites' },
          { label: mode === 'create' ? 'Create' : `Edit ${siteId}` },
        ]}
      />
      <SectionCard className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <FormField label="Site ID" htmlFor="siteId" required>
              <Input id="siteId" value={siteIdField} onChange={(e) => setSiteIdField(e.target.value)} maxLength={50} required />
            </FormField>
          )}
          <FormField label="Site Name" htmlFor="siteName" required>
            <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} maxLength={200} required />
          </FormField>
          <FormField label="Site Type" htmlFor="siteType" required>
            <select id="siteType" value={siteType} onChange={(e) => setSiteType(e.target.value as SiteType)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
              <option value="SUPER">Super</option>
              <option value="EDGE">Edge</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>
          <FormField label="Status" htmlFor="status">
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </FormField>
          <FormField label="Timezone" htmlFor="timezone">
            <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} maxLength={100} placeholder="e.g. Europe/London" />
          </FormField>
          <FormField label="Address JSON" htmlFor="addressJson">
            <Textarea id="addressJson" value={addressJson} onChange={(e) => setAddressJson(e.target.value)} rows={3} placeholder='{"line1":"..."}' />
          </FormField>
          <FormField label="Contact JSON" htmlFor="contactJson">
            <Textarea id="contactJson" value={contactJson} onChange={(e) => setContactJson(e.target.value)} rows={3} placeholder='{"email":"..."}' />
          </FormField>
          <FormField label="Metadata" htmlFor="metadata">
            <Textarea id="metadata" value={metadata} onChange={(e) => setMetadata(e.target.value)} rows={3} placeholder='{"key":"value"}' />
          </FormField>
          {error && <p className="text-sm text-destructive-foreground">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (mode === 'create' ? 'Creating…' : 'Saving…') : (mode === 'create' ? 'Create Site' : 'Save Changes')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(mode === 'create' ? '/inventory/structure/sites' : `/inventory/structure/sites/${siteId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

