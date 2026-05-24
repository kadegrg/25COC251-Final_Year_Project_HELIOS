import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationTree, useSites, useWarehouses } from '@/hooks/use-inventory-structure';
import { PageHeader, SectionCard, ErrorState } from '@/components/common';
import { AutoStatusBadge } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import type { LocationTreeNode } from '@/types/inventory-structure.types';

export function LocationTreePage() {
  const [siteId, setSiteId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const sitesQuery = useSites({ limit: 100 });
  const warehousesQuery = useWarehouses({ limit: 100, siteId: siteId || undefined });
  const treeQuery = useLocationTree({
    siteId: siteId || undefined,
    warehouseId: warehouseId || undefined,
  });

  const sites = sitesQuery.data?.data ?? [];
  const warehouses = warehousesQuery.data?.data ?? [];
  const tree = treeQuery.data ?? [];

  if (treeQuery.error) {
    return <ErrorState message="Failed to load location tree" onRetry={() => treeQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader title="Location Tree" description="Hierarchical view of inventory locations" />
      <div className="mb-4 flex gap-3">
        <select value={siteId} onChange={(e) => { setSiteId(e.target.value); setWarehouseId(''); }} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
          <option value="">All Sites</option>
          {sites.map((s) => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
        </select>
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs">
          <option value="">All Warehouses</option>
          {warehouses.map((w) => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
        </select>
      </div>
      <SectionCard>
        {treeQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tree.length === 0 ? (
          <p className="text-sm text-muted-foreground">No locations found.</p>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => <TreeNodeRow key={node.locationId} node={node} depth={0} />)}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function TreeNodeRow({ node, depth }: { node: LocationTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const navigate = useNavigate();
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="w-4 h-4 flex items-center justify-center"
          disabled={!hasChildren}
        >
          {hasChildren ? (expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <MapPin className="h-3 w-3 text-muted-foreground" />}
        </button>
        <span className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/inventory/structure/locations/${node.locationId}`)}>
          {node.locationCode}
        </span>
        <span className="text-muted-foreground">{node.locationName}</span>
        <Badge variant="outline" className="text-xs">{node.locationType}</Badge>
        <AutoStatusBadge status={node.status} />
        {node.isQuarantine && <Badge variant="destructive" className="text-xs">Q</Badge>}
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <TreeNodeRow key={child.locationId} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

