import { useState } from 'react';
import {
  useAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useCategories,
} from '@/hooks/use-sku-metadata';
import type {
  AttributeDefinition,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  AttributeDataType,
} from '@/types/sku-metadata.types';
import { ATTRIBUTE_DATA_TYPES } from '@/types/sku-metadata.types';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { DataTable, type Column } from '@/components/common/data-table';
import { QueryResult } from '@/components/common/query-result';
import { Toolbar } from '@/components/common/toolbar';
import { FormField } from '@/components/common/form-field';
import { ActionMenu } from '@/components/common/action-menu';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil } from 'lucide-react';
import { parseApiError } from '@/lib/api-errors';
import { useHasPermission } from '@/hooks/use-has-permission';
import { SKU_METADATA_PERMISSIONS } from '@/types/sku-metadata.types';

export function AttributesListPage() {
  const categoriesQ = useCategories();
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const q = useAttributes(filterCategoryId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttributeDefinition | null>(null);
  const canManage = useHasPermission(SKU_METADATA_PERMISSIONS.METADATA_MANAGE);

  const categories = categoriesQ.data ?? [];
  const categoryMap = new Map(categories.map((c) => [c.categoryId, c.categoryName]));
  const attributes = q.data ?? [];

  const columns: Column<AttributeDefinition>[] = [
    { id: 'key', header: 'Key', cell: (r) => <code className="text-xs">{r.attributeKey}</code> },
    { id: 'name', header: 'Name', cell: (r) => r.attributeName },
    { id: 'dataType', header: 'Type', cell: (r) => <StatusBadge label={r.dataType} variant="default" /> },
    { id: 'category', header: 'Category', cell: (r) => (r.categoryId ? categoryMap.get(r.categoryId) ?? '—' : 'Global') },
    { id: 'required', header: 'Required', cell: (r) => (r.isRequired ? 'Yes' : 'No') },
    { id: 'filterable', header: 'Filterable', cell: (r) => (r.isFilterable ? 'Yes' : 'No') },
    { id: 'sortOrder', header: 'Sort', cell: (r) => r.sortOrder },
    {
      id: 'actions',
      header: '',
      className: 'w-10',
      cell: (r) => (
        canManage ? (
          <ActionMenu
            actions={[
              {
                label: 'Edit',
                icon: Pencil,
                onClick: () => {
                  setEditing(r);
                  setDialogOpen(true);
                },
              },
            ]}
          />
        ) : null
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Attributes"
        description="Manage attribute definitions for SKU metadata"
        breadcrumbs={[
          { label: 'Catalogue', href: '/inventory/catalogue' },
          { label: 'Attributes' },
        ]}
        actions={
          canManage ? (
            <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Attribute
            </Button>
          ) : undefined
        }
      />
      <Toolbar>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.categoryName}
            </option>
          ))}
        </select>
      </Toolbar>
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={attributes}
            keyField="attributeId"
            emptyTitle="No attributes"
            emptyDescription="Create your first attribute definition."
          />
        </SectionCard>
      </QueryResult>
      <AttributeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        categories={categories}
      />
    </>
  );
}

function AttributeFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AttributeDefinition | null;
  categories: { categoryId: string; categoryName: string }[];
}) {
  const create = useCreateAttribute();
  const update = useUpdateAttribute();
  const isEdit = !!editing;

  const [form, setForm] = useState({
    attributeKey: '',
    attributeName: '',
    categoryId: '',
    dataType: 'STRING' as AttributeDataType,
    isRequired: false,
    isFilterable: true,
    isSearchable: false,
    enumValues: '',
    unitLabel: '',
    sortOrder: 0,
  });
  const [error, setError] = useState('');

  const handleOpenChange = (v: boolean) => {
    if (v) {
      if (editing) {
        setForm({
          attributeKey: editing.attributeKey,
          attributeName: editing.attributeName,
          categoryId: editing.categoryId ?? '',
          dataType: editing.dataType,
          isRequired: editing.isRequired,
          isFilterable: editing.isFilterable,
          isSearchable: editing.isSearchable,
          enumValues: editing.enumValues?.join(', ') ?? '',
          unitLabel: editing.unitLabel ?? '',
          sortOrder: editing.sortOrder,
        });
      } else {
        setForm({
          attributeKey: '',
          attributeName: '',
          categoryId: '',
          dataType: 'STRING',
          isRequired: false,
          isFilterable: true,
          isSearchable: false,
          enumValues: '',
          unitLabel: '',
          sortOrder: 0,
        });
      }
      setError('');
    }
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      if (isEdit) {
        const body: UpdateAttributeRequest = {
          attributeName: form.attributeName,
          isRequired: form.isRequired,
          isFilterable: form.isFilterable,
          isSearchable: form.isSearchable,
          unitLabel: form.unitLabel || undefined,
          sortOrder: form.sortOrder,
        };
        if (form.dataType === 'ENUM' && form.enumValues) {
          body.enumValues = form.enumValues.split(',').map((s) => s.trim()).filter(Boolean);
        }
        await update.mutateAsync({ attributeId: editing!.attributeId, body });
      } else {
        const body: CreateAttributeRequest = {
          attributeKey: form.attributeKey,
          attributeName: form.attributeName,
          dataType: form.dataType,
          isRequired: form.isRequired,
          isFilterable: form.isFilterable,
          isSearchable: form.isSearchable,
          sortOrder: form.sortOrder,
        };
        if (form.categoryId) body.categoryId = form.categoryId;
        if (form.unitLabel) body.unitLabel = form.unitLabel;
        if (form.dataType === 'ENUM' && form.enumValues) {
          body.enumValues = form.enumValues.split(',').map((s) => s.trim()).filter(Boolean);
        }
        await create.mutateAsync(body);
      }
      onOpenChange(false);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    }
  };

  const loading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Attribute' : 'Create Attribute'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <FormField label="Attribute Key" htmlFor="attributeKey" required={!isEdit}>
            <Input
              id="attributeKey"
              value={form.attributeKey}
              onChange={(e) => setForm((f) => ({ ...f, attributeKey: e.target.value }))}
              disabled={isEdit}
              maxLength={100}
            />
          </FormField>
          <FormField label="Attribute Name" htmlFor="attributeName" required>
            <Input
              id="attributeName"
              value={form.attributeName}
              onChange={(e) => setForm((f) => ({ ...f, attributeName: e.target.value }))}
              maxLength={200}
            />
          </FormField>
          <FormField label="Category" htmlFor="attrCategoryId">
            <select
              id="attrCategoryId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              disabled={isEdit}
            >
              <option value="">Global (all SKUs)</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Data Type" htmlFor="dataType" required={!isEdit}>
            <select
              id="dataType"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.dataType}
              onChange={(e) => setForm((f) => ({ ...f, dataType: e.target.value as AttributeDataType }))}
              disabled={isEdit}
            >
              {ATTRIBUTE_DATA_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </FormField>
          {form.dataType === 'ENUM' && (
            <FormField label="Enum Values" htmlFor="enumValues">
              <Input
                id="enumValues"
                value={form.enumValues}
                onChange={(e) => setForm((f) => ({ ...f, enumValues: e.target.value }))}
                placeholder="Comma-separated: Black, White, Silver"
              />
            </FormField>
          )}
          <FormField label="Unit Label" htmlFor="unitLabel">
            <Input
              id="unitLabel"
              value={form.unitLabel}
              onChange={(e) => setForm((f) => ({ ...f, unitLabel: e.target.value }))}
              placeholder="e.g. months, V, kg"
              maxLength={50}
            />
          </FormField>
          <FormField label="Sort Order" htmlFor="sortOrder">
            <Input
              id="sortOrder"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
            />
          </FormField>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFilterable}
                onChange={(e) => setForm((f) => ({ ...f, isFilterable: e.target.checked }))}
              />
              Filterable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isSearchable}
                onChange={(e) => setForm((f) => ({ ...f, isSearchable: e.target.checked }))}
              />
              Searchable
            </label>
          </div>
          {error && <p className="text-sm text-destructive-foreground">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.attributeName}>
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

