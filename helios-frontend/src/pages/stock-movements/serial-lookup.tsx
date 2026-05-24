import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStockItemBySerial } from '@/hooks/use-stock-movements';
import { PageHeader, SectionCard, FormField, DetailPanel, QueryResult, AutoStatusBadge } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SerialLookupPage() {
  const navigate = useNavigate();
  const [serial, setSerial] = useState('');
  const [search, setSearch] = useState('');
  const q = useStockItemBySerial(search);
  const item = q.data;

  return (
    <>
      <PageHeader title="Serial Lookup" breadcrumbs={[{ label: 'Stock', href: '/inventory/stock' }, { label: 'Serial Lookup' }]} />
      <SectionCard className="mb-4">
        <div className="flex items-end gap-2 max-w-md">
          <FormField label="Serial Number">
            <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Enter serial number" />
          </FormField>
          <Button onClick={() => setSearch(serial)} disabled={!serial}>Search</Button>
        </div>
      </SectionCard>
      {search && (
        <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="stock item">
          {item && (
            <SectionCard title="Stock Item">
              <DetailPanel columns={2} fields={[
                { label: 'Item ID', value: <button className="text-primary underline" onClick={() => navigate(`/inventory/stock/items/${item.stockItemId}`)}>{item.stockItemId}</button> },
                { label: 'SKU', value: item.skuId },
                { label: 'Serial', value: item.serialNumber ?? '—' },
                { label: 'Batch', value: item.batchNumber ?? '—' },
                { label: 'Status', value: <AutoStatusBadge status={item.stockStatusCode} /> },
                { label: 'Lifecycle', value: <AutoStatusBadge status={item.lifecycleStatus} /> },
              ]} />
            </SectionCard>
          )}
        </QueryResult>
      )}
    </>
  );
}

