import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useCreateSku } from '@/hooks/use-sku-metadata';
import type { CreateSkuRequest, TrackingMode, SkuStatus } from '@/types/sku-metadata.types';
import { TRACKING_MODES, SKU_STATUSES } from '@/types/sku-metadata.types';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseApiError } from '@/lib/api-errors';

export function SkuCreatePage() {
  const navigate = useNavigate();
  const categoriesQ = useCategories();
  const categories = categoriesQ.data ?? [];
  const create = useCreateSku();

  const [form, setForm] = useState({
    skuCode: '',
    skuName: '',
    barcode: '',
    categoryId: '',
    shortDescription: '',
    longDescription: '',
    trackingMode: 'QUANTITY' as TrackingMode,
    status: 'ACTIVE' as SkuStatus,
    defaultUom: '',
    sellableByDefault: true,
    requiresExpiryTracking: false,
    requiresBatchTracking: false,
    weight: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      const body: CreateSkuRequest = {
        skuCode: form.skuCode,
        skuName: form.skuName,
        trackingMode: form.trackingMode,
        defaultUom: form.defaultUom,
        status: form.status,
        sellableByDefault: form.sellableByDefault,
        requiresExpiryTracking: form.requiresExpiryTracking,
        requiresBatchTracking: form.requiresBatchTracking,
      };
      if (form.barcode) body.barcode = form.barcode;
      if (form.categoryId) body.categoryId = form.categoryId;
      if (form.shortDescription) body.shortDescription = form.shortDescription;
      if (form.longDescription) body.longDescription = form.longDescription;
      if (form.weight) body.weight = parseFloat(form.weight);
      const sku = await create.mutateAsync(body);
      navigate(`/inventory/catalogue/skus/${sku.skuId}`);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <PageHeader
        title="Create SKU"
        breadcrumbs={[
          { label: 'Catalogue', href: '/inventory/catalogue' },
          { label: 'SKUs', href: '/inventory/catalogue/skus' },
          { label: 'Create' },
        ]}
      />
      <SectionCard title="SKU Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl">
          <FormField label="SKU Code" htmlFor="skuCode" required>
            <Input id="skuCode" value={form.skuCode} onChange={(e) => set('skuCode', e.target.value)} maxLength={100} />
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
          <FormField label="Tracking Mode" htmlFor="trackingMode" required>
            <select id="trackingMode" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.trackingMode} onChange={(e) => set('trackingMode', e.target.value)}>
              {TRACKING_MODES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Status" htmlFor="status">
            <select id="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {SKU_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Default UoM" htmlFor="defaultUom" required>
            <Input id="defaultUom" value={form.defaultUom} onChange={(e) => set('defaultUom', e.target.value)} maxLength={20} placeholder="e.g. EACH, KG, L" />
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
          <Button variant="outline" onClick={() => navigate('/inventory/catalogue/skus')}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={create.isPending || !form.skuCode || !form.skuName || !form.defaultUom}>
            {create.isPending ? 'Creating…' : 'Create SKU'}
          </Button>
        </div>
      </SectionCard>
    </>
  );
}

