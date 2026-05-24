import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSkuDetail, useUpdateSku, useCategories } from '@/hooks/use-sku-metadata';
import type { UpdateSkuRequest } from '@/types/sku-metadata.types';
import { SKU_UPDATE_STATUSES } from '@/types/sku-metadata.types';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { FormField } from '@/components/common/form-field';
import { QueryResult } from '@/components/common/query-result';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseApiError } from '@/lib/api-errors';

export function SkuEditPage() {
  const { skuId } = useParams<{ skuId: string }>();
  const navigate = useNavigate();
  const q = useSkuDetail(skuId!);
  const categoriesQ = useCategories();
  const categories = categoriesQ.data ?? [];
  const update = useUpdateSku();
  const sku = q.data;

  const [form, setForm] = useState({
    skuName: '', barcode: '', categoryId: '', shortDescription: '', longDescription: '',
    status: '' as 'ACTIVE' | 'INACTIVE', defaultUom: '', sellableByDefault: true,
    requiresExpiryTracking: false, requiresBatchTracking: false, weight: '',
  });
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (sku && !initialized) {
      setForm({
        skuName: sku.skuName,
        barcode: sku.barcode ?? '',
        categoryId: sku.categoryId ?? '',
        shortDescription: sku.shortDescription ?? '',
        longDescription: sku.longDescription ?? '',
        status: (sku.status === 'DISCONTINUED' ? 'INACTIVE' : sku.status) as 'ACTIVE' | 'INACTIVE',
        defaultUom: sku.defaultUom,
        sellableByDefault: sku.sellableByDefault,
        requiresExpiryTracking: sku.requiresExpiryTracking,
        requiresBatchTracking: sku.requiresBatchTracking,
        weight: sku.weight?.toString() ?? '',
      });
      setInitialized(true);
    }
  }, [sku, initialized]);

  const handleSubmit = async () => {
    setError('');
    try {
      const body: UpdateSkuRequest = {
        skuName: form.skuName,
        barcode: form.barcode || undefined,
        categoryId: form.categoryId || null,
        shortDescription: form.shortDescription || undefined,
        longDescription: form.longDescription || undefined,
        status: form.status,
        defaultUom: form.defaultUom,
        sellableByDefault: form.sellableByDefault,
        requiresExpiryTracking: form.requiresExpiryTracking,
        requiresBatchTracking: form.requiresBatchTracking,
        weight: form.weight ? parseFloat(form.weight) : null,
      };
      await update.mutateAsync({ skuId: skuId!, body });
      navigate(`/inventory/catalogue/skus/${skuId}`);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="SKU">
      <PageHeader
        title={`Edit ${sku?.skuCode ?? 'SKU'}`}
        breadcrumbs={[
          { label: 'Catalogue', href: '/inventory/catalogue' },
          { label: 'SKUs', href: '/inventory/catalogue/skus' },
          { label: sku?.skuCode ?? '', href: `/inventory/catalogue/skus/${skuId}` },
          { label: 'Edit' },
        ]}
      />
      <SectionCard title="SKU Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl">
          <FormField label="SKU Code">
            <Input value={sku?.skuCode ?? ''} disabled />
          </FormField>
          <FormField label="Tracking Mode">
            <Input value={sku?.trackingMode ?? ''} disabled />
          </FormField>
          <FormField label="SKU Name" htmlFor="skuName" required>
            <Input id="skuName" value={form.skuName} onChange={(e) => set('skuName', e.target.value)} maxLength={300} />
          </FormField>
          <FormField label="Barcode" htmlFor="barcode">
            <Input id="barcode" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} maxLength={100} />
          </FormField>
          <FormField label="Category" htmlFor="categoryId">
            <select id="categoryId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
            </select>
          </FormField>
          <FormField label="Status" htmlFor="status">
            <select id="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {SKU_UPDATE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Default UoM" htmlFor="defaultUom" required>
            <Input id="defaultUom" value={form.defaultUom} onChange={(e) => set('defaultUom', e.target.value)} maxLength={20} />
          </FormField>
          <FormField label="Weight" htmlFor="weight">
            <Input id="weight" type="number" step="0.01" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Short Description" htmlFor="shortDescription">
              <Textarea id="shortDescription" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} maxLength={500} rows={2} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Long Description" htmlFor="longDescription">
              <Textarea id="longDescription" value={form.longDescription} onChange={(e) => set('longDescription', e.target.value)} maxLength={5000} rows={3} />
            </FormField>
          </div>
          <div className="sm:col-span-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.sellableByDefault} onChange={(e) => set('sellableByDefault', e.target.checked)} />
              Sellable by default
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.requiresExpiryTracking} onChange={(e) => set('requiresExpiryTracking', e.target.checked)} />
              Requires expiry tracking
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.requiresBatchTracking} onChange={(e) => set('requiresBatchTracking', e.target.checked)} />
              Requires batch tracking
            </label>
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-destructive-foreground">{error}</p>}
        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/inventory/catalogue/skus/${skuId}`)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={update.isPending || !form.skuName || !form.defaultUom}>
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </SectionCard>
    </QueryResult>
  );
}

