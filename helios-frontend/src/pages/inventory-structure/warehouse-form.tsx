import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateWarehouse, useWarehouse, useUpdateWarehouse, useSites } from '@/hooks/use-inventory-structure';
import { PageHeader, FormField, SectionCard, QueryResult } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseApiError } from '@/lib/api-errors';
import type { WarehouseStatus } from '@/types/inventory-structure.types';

function tryParseJson(s: string): Record<string, unknown> | undefined {
  if (!s.trim()) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
}

export function CreateWarehousePage() {
  return <WarehouseFormInner mode="create" />;
}

export function EditWarehousePage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const query = useWarehouse(warehouseId!);
  return (
    <QueryResult isLoading={query.isLoading} error={query.error} data={query.data} notFoundNoun="warehouse" onRetry={() => query.refetch()}>
      {query.data && <WarehouseFormInner mode="edit" warehouseId={warehouseId!} initial={query.data} />}
    </QueryResult>
  );
}

interface WarehouseFormInnerProps {
  mode: 'create' | 'edit';
  warehouseId?: string;
  initial?: {
    siteId: string;
    warehouseCode: string;
    warehouseName: string;
    status: string;
    metadata: Record<string, unknown> | null;
  };
}

function WarehouseFormInner({ mode, warehouseId, initial }: WarehouseFormInnerProps) {
  const navigate = useNavigate();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse(warehouseId ?? '');
  const sitesQuery = useSites({ limit: 100 });
  const isPending = mode === 'create' ? createMutation.isPending : updateMutation.isPending;

  const [siteId, setSiteId] = useState(initial?.siteId ?? '');
  const [warehouseCode, setWarehouseCode] = useState(initial?.warehouseCode ?? '');
  const [warehouseName, setWarehouseName] = useState(initial?.warehouseName ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'ACTIVE');
  const [metadata, setMetadata] = useState(initial?.metadata ? JSON.stringify(initial.metadata, null, 2) : '');
  const [error, setError] = useState('');

  const sites = sitesQuery.data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (metadata.trim() && !tryParseJson(metadata)) { setError('Metadata JSON is invalid.'); return; }

    try {
      if (mode === 'create') {
        const wh = await createMutation.mutateAsync({
          siteId,
          warehouseCode,
          warehouseName,
          status: status as WarehouseStatus,
          metadata: tryParseJson(metadata),
        });
        navigate(`/inventory/structure/warehouses/${wh.warehouseId}`);
      } else {
        await updateMutation.mutateAsync({
          warehouseName,
          status: status as WarehouseStatus,
          metadata: tryParseJson(metadata),
        });
        navigate(`/inventory/structure/warehouses/${warehouseId}`);
      }
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader
        title={mode === 'create' ? 'Create Warehouse' : 'Edit Warehouse'}
        breadcrumbs={[
          { label: 'Warehouses', href: '/inventory/structure/warehouses' },
          { label: mode === 'create' ? 'Create' : `Edit ${warehouseId}` },
        ]}
      />
      <SectionCard className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <>
              <FormField label="Site" htmlFor="siteId" required>
                <select id="siteId" value={siteId} onChange={(e) => setSiteId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs" required>
                  <option value="">Select site…</option>
                  {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteName} ({s.siteId})</option>)}
                </select>
              </FormField>
              <FormField label="Warehouse Code" htmlFor="warehouseCode" required>
                <Input id="warehouseCode" value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value)} maxLength={50} required />
              </FormField>
            </>
          )}
          <FormField label="Warehouse Name" htmlFor="warehouseName" required>
            <Input id="warehouseName" value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} maxLength={200} required />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </FormField>
          <FormField label="Metadata" htmlFor="metadata">
            <Textarea id="metadata" value={metadata} onChange={(e) => setMetadata(e.target.value)} rows={3} placeholder='{"key":"value"}' />
          </FormField>
          {error && <p className="text-sm text-destructive-foreground">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (mode === 'create' ? 'Creating…' : 'Saving…') : (mode === 'create' ? 'Create Warehouse' : 'Save Changes')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(mode === 'create' ? '/inventory/structure/warehouses' : `/inventory/structure/warehouses/${warehouseId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

