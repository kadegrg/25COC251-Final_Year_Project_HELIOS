import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateLocation, useLocation as useLocationQuery, useUpdateLocation, useSites, useWarehouses, useLocations } from '@/hooks/use-inventory-structure';
import { PageHeader, FormField, SectionCard, QueryResult } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseApiError } from '@/lib/api-errors';
import type { LocationStatus } from '@/types/inventory-structure.types';

function tryParseJson(s: string): Record<string, unknown> | undefined {
  if (!s.trim()) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
}

export function CreateLocationPage() {
  return <LocationFormInner mode="create" />;
}

export function EditLocationPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const query = useLocationQuery(locationId!);
  return (
    <QueryResult isLoading={query.isLoading} error={query.error} data={query.data} notFoundNoun="location" onRetry={() => query.refetch()}>
      {query.data && <LocationFormInner mode="edit" locationId={locationId!} initial={query.data} />}
    </QueryResult>
  );
}

interface LocationFormInnerProps {
  mode: 'create' | 'edit';
  locationId?: string;
  initial?: {
    siteId: string;
    warehouseId: string;
    parentLocationId: string | null;
    locationCode: string;
    locationName: string;
    locationType: string;
    status: string;
    isPickable: boolean;
    isReceivable: boolean;
    isDispatchable: boolean;
    isQuarantine: boolean;
    capacityJson: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
  };
}

function LocationFormInner({ mode, locationId, initial }: LocationFormInnerProps) {
  const navigate = useNavigate();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation(locationId ?? '');
  const isPending = mode === 'create' ? createMutation.isPending : updateMutation.isPending;

  const [siteId, setSiteId] = useState(initial?.siteId ?? '');
  const [warehouseId, setWarehouseId] = useState(initial?.warehouseId ?? '');
  const [parentLocationId, setParentLocationId] = useState(initial?.parentLocationId ?? '');
  const [locationCode, setLocationCode] = useState(initial?.locationCode ?? '');
  const [locationName, setLocationName] = useState(initial?.locationName ?? '');
  const [locationType, setLocationType] = useState(initial?.locationType ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'ACTIVE');
  const [isPickable, setIsPickable] = useState(initial?.isPickable ?? true);
  const [isReceivable, setIsReceivable] = useState(initial?.isReceivable ?? true);
  const [isDispatchable, setIsDispatchable] = useState(initial?.isDispatchable ?? true);
  const [isQuarantine, setIsQuarantine] = useState(initial?.isQuarantine ?? false);
  const [capacityJson, setCapacityJson] = useState(initial?.capacityJson ? JSON.stringify(initial.capacityJson, null, 2) : '');
  const [metadata, setMetadata] = useState(initial?.metadata ? JSON.stringify(initial.metadata, null, 2) : '');
  const [error, setError] = useState('');

  const sitesQuery = useSites({ limit: 100 });
  const warehousesQuery = useWarehouses({ limit: 100, siteId: siteId || undefined });
  const parentLocationsQuery = useLocations({ limit: 100, warehouseId: warehouseId || undefined });

  const sites = sitesQuery.data?.data ?? [];
  const warehouses = warehousesQuery.data?.data ?? [];
  const parentLocations = parentLocationsQuery.data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    for (const [label, val] of [['Capacity', capacityJson], ['Metadata', metadata]] as const) {
      if (val.trim() && !tryParseJson(val)) { setError(`${label} JSON is invalid.`); return; }
    }

    try {
      if (mode === 'create') {
        const loc = await createMutation.mutateAsync({
          siteId,
          warehouseId,
          parentLocationId: parentLocationId || undefined,
          locationCode,
          locationName,
          locationType,
          status: status as LocationStatus,
          isPickable,
          isReceivable,
          isDispatchable,
          isQuarantine,
          capacityJson: tryParseJson(capacityJson),
          metadata: tryParseJson(metadata),
        });
        navigate(`/inventory/structure/locations/${loc.locationId}`);
      } else {
        await updateMutation.mutateAsync({
          locationName,
          locationType,
          status: status as LocationStatus,
          isPickable,
          isReceivable,
          isDispatchable,
          isQuarantine,
          capacityJson: tryParseJson(capacityJson) ?? null,
          metadata: tryParseJson(metadata) ?? null,
        });
        navigate(`/inventory/structure/locations/${locationId}`);
      }
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const selectClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs';

  return (
    <div>
      <PageHeader
        title={mode === 'create' ? 'Create Location' : 'Edit Location'}
        breadcrumbs={[
          { label: 'Locations', href: '/inventory/structure/locations' },
          { label: mode === 'create' ? 'Create' : `Edit` },
        ]}
      />
      <SectionCard className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <>
              <FormField label="Site" htmlFor="siteId" required>
                <select id="siteId" value={siteId} onChange={(e) => { setSiteId(e.target.value); setWarehouseId(''); setParentLocationId(''); }} className={selectClass} required>
                  <option value="">Select site…</option>
                  {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteName} ({s.siteId})</option>)}
                </select>
              </FormField>
              <FormField label="Warehouse" htmlFor="warehouseId" required>
                <select id="warehouseId" value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setParentLocationId(''); }} className={selectClass} required>
                  <option value="">Select warehouse…</option>
                  {warehouses.map((w) => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName} ({w.warehouseCode})</option>)}
                </select>
              </FormField>
              <FormField label="Parent Location" htmlFor="parentLocationId">
                <select id="parentLocationId" value={parentLocationId} onChange={(e) => setParentLocationId(e.target.value)} className={selectClass}>
                  <option value="">None (root)</option>
                  {parentLocations.map((l) => <option key={l.locationId} value={l.locationId}>{l.locationName} ({l.locationCode})</option>)}
                </select>
              </FormField>
              <FormField label="Location Code" htmlFor="locationCode" required>
                <Input id="locationCode" value={locationCode} onChange={(e) => setLocationCode(e.target.value)} maxLength={50} required />
              </FormField>
            </>
          )}
          <FormField label="Location Name" htmlFor="locationName" required>
            <Input id="locationName" value={locationName} onChange={(e) => setLocationName(e.target.value)} maxLength={200} required />
          </FormField>
          <FormField label="Location Type" htmlFor="locationType" required>
            <Input id="locationType" value={locationType} onChange={(e) => setLocationType(e.target.value)} maxLength={50} placeholder="e.g. ZONE, AISLE, RACK, BIN" required />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPickable} onChange={(e) => setIsPickable(e.target.checked)} /> Pickable</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isReceivable} onChange={(e) => setIsReceivable(e.target.checked)} /> Receivable</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isDispatchable} onChange={(e) => setIsDispatchable(e.target.checked)} /> Dispatchable</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isQuarantine} onChange={(e) => setIsQuarantine(e.target.checked)} /> Quarantine</label>
          </div>
          <FormField label="Capacity JSON" htmlFor="capacityJson">
            <Textarea id="capacityJson" value={capacityJson} onChange={(e) => setCapacityJson(e.target.value)} rows={3} placeholder='{"maxWeight":1000}' />
          </FormField>
          <FormField label="Metadata" htmlFor="metadata">
            <Textarea id="metadata" value={metadata} onChange={(e) => setMetadata(e.target.value)} rows={3} placeholder='{"key":"value"}' />
          </FormField>
          {error && <p className="text-sm text-destructive-foreground">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (mode === 'create' ? 'Creating…' : 'Saving…') : (mode === 'create' ? 'Create Location' : 'Save Changes')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(mode === 'create' ? '/inventory/structure/locations' : `/inventory/structure/locations/${locationId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

