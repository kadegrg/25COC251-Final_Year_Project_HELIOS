import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSkuList, useCategories } from '@/hooks/use-sku-metadata';
import { useHasPermission } from '@/hooks/use-has-permission';
import type { Sku, ListSkusParams } from '@/types/sku-metadata.types';
import { TRACKING_MODES, SKU_STATUSES, SKU_METADATA_PERMISSIONS } from '@/types/sku-metadata.types';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { DataTable, type Column } from '@/components/common/data-table';
import { Toolbar } from '@/components/common/toolbar';
import { SearchInput } from '@/components/common/search-input';
import { PaginationFooter } from '@/components/common/pagination-footer';
import { AutoStatusBadge } from '@/components/common/status-badge';
import { QueryResult } from '@/components/common/query-result';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function SkusListPage() {
  const navigate = useNavigate();
  const canCreate = useHasPermission(SKU_METADATA_PERMISSIONS.SKU_CREATE);
  const categoriesQ = useCategories();
  const categories = categoriesQ.data ?? [];
  const categoryMap = new Map(categories.map((c) => [c.categoryId, c.categoryName]));

  const [params, setParams] = useState<ListSkusParams>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');

  const q = useSkuList({ ...params, search: search || undefined });

  const columns: Column<Sku>[] = [
    { id: 'code', header: 'SKU Code', cell: (r) => <code className="text-xs">{r.skuCode}</code> },
    { id: 'name', header: 'Name', cell: (r) => r.skuName },
    { id: 'category', header: 'Category', cell: (r) => (r.categoryId ? categoryMap.get(r.categoryId) ?? '—' : '—') },
    { id: 'tracking', header: 'Tracking', cell: (r) => r.trackingMode },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
    { id: 'uom', header: 'UoM', cell: (r) => r.defaultUom },
  ];

  const pagination = q.data?.meta?.pagination;

  return (
    <>
      <PageHeader
        title="SKUs"
        description="Manage product SKU definitions"
        breadcrumbs={[
          { label: 'Catalogue', href: '/inventory/catalogue' },
          { label: 'SKUs' },
        ]}
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => navigate('/inventory/catalogue/skus/new')}>
              <Plus className="mr-1.5 h-4 w-4" /> Create SKU
            </Button>
          ) : undefined
        }
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setParams((p) => ({ ...p, page: 1 })); }}
          placeholder="Search SKUs…"
          className="w-64"
        />
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.status ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All statuses</option>
          {SKU_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.categoryId ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, categoryId: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
          ))}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={params.trackingMode ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, trackingMode: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All tracking modes</option>
          {TRACKING_MODES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={q.data?.data ?? []}
            keyField="skuId"
            onRowClick={(r) => navigate(`/inventory/catalogue/skus/${r.skuId}`)}
            emptyTitle="No SKUs found"
            emptyDescription="Create your first SKU or adjust filters."
          />
          {pagination && (
            <PaginationFooter
              page={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          )}
        </SectionCard>
      </QueryResult>
    </>
  );
}
