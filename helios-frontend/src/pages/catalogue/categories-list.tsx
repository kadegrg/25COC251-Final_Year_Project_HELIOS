import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory } from '@/hooks/use-sku-metadata';
import { useHasPermission } from '@/hooks/use-has-permission';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/sku-metadata.types';
import { SKU_METADATA_PERMISSIONS } from '@/types/sku-metadata.types';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { DataTable, type Column } from '@/components/common/data-table';
import { QueryResult } from '@/components/common/query-result';
import { FormField } from '@/components/common/form-field';
import { ActionMenu } from '@/components/common/action-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil } from 'lucide-react';
import { parseApiError } from '@/lib/api-errors';

export function CategoriesListPage() {
  const q = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const canManage = useHasPermission(SKU_METADATA_PERMISSIONS.METADATA_MANAGE);

  const categories = q.data ?? [];
  const categoryMap = new Map(categories.map((c) => [c.categoryId, c.categoryName]));

  const columns: Column<Category>[] = [
    { id: 'key', header: 'Key', cell: (r) => <code className="text-xs">{r.categoryKey}</code> },
    { id: 'name', header: 'Name', cell: (r) => r.categoryName },
    { id: 'description', header: 'Description', cell: (r) => r.description ?? '—' },
    {
      id: 'parent',
      header: 'Parent',
      cell: (r) => (r.parentCategoryId ? categoryMap.get(r.parentCategoryId) ?? '—' : '—'),
    },
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
        title="Categories"
        description="Manage product categories"
        breadcrumbs={[
          { label: 'Catalogue', href: '/inventory/catalogue' },
          { label: 'Categories' },
        ]}
        actions={
          canManage ? (
            <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Category
            </Button>
          ) : undefined
        }
      />
      <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} onRetry={() => q.refetch()}>
        <SectionCard noPadding>
          <DataTable
            columns={columns}
            data={categories}
            keyField="categoryId"
            emptyTitle="No categories"
            emptyDescription="Create your first category to get started."
          />
        </SectionCard>
      </QueryResult>
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        categories={categories}
      />
    </>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Category | null;
  categories: Category[];
}) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [form, setForm] = useState({ categoryKey: '', categoryName: '', description: '', parentCategoryId: '' });
  const [error, setError] = useState('');

  const isEdit = !!editing;

  // Reset form when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      if (editing) {
        setForm({
          categoryKey: editing.categoryKey,
          categoryName: editing.categoryName,
          description: editing.description ?? '',
          parentCategoryId: editing.parentCategoryId ?? '',
        });
      } else {
        setForm({ categoryKey: '', categoryName: '', description: '', parentCategoryId: '' });
      }
      setError('');
    }
    onOpenChange(v);
  };

  // Also trigger reset when `open` first becomes true from parent
  if (open && !create.isPending && !update.isPending && form.categoryKey === '' && !isEdit) {
    // already reset
  }

  const handleSubmit = async () => {
    setError('');
    try {
      if (isEdit) {
        const body: UpdateCategoryRequest = {};
        if (form.categoryName !== editing!.categoryName) body.categoryName = form.categoryName;
        if (form.description !== (editing!.description ?? '')) body.description = form.description || undefined;
        body.parentCategoryId = form.parentCategoryId || null;
        await update.mutateAsync({ categoryId: editing!.categoryId, body });
      } else {
        const body: CreateCategoryRequest = {
          categoryKey: form.categoryKey,
          categoryName: form.categoryName,
        };
        if (form.description) body.description = form.description;
        if (form.parentCategoryId) body.parentCategoryId = form.parentCategoryId;
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <FormField label="Category Key" htmlFor="categoryKey" required={!isEdit}>
            <Input
              id="categoryKey"
              value={form.categoryKey}
              onChange={(e) => setForm((f) => ({ ...f, categoryKey: e.target.value }))}
              disabled={isEdit}
              maxLength={100}
            />
          </FormField>
          <FormField label="Category Name" htmlFor="categoryName" required>
            <Input
              id="categoryName"
              value={form.categoryName}
              onChange={(e) => setForm((f) => ({ ...f, categoryName: e.target.value }))}
              maxLength={200}
            />
          </FormField>
          <FormField label="Description" htmlFor="description">
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500}
              rows={2}
            />
          </FormField>
          <FormField label="Parent Category" htmlFor="parentCategoryId">
            <select
              id="parentCategoryId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.parentCategoryId}
              onChange={(e) => setForm((f) => ({ ...f, parentCategoryId: e.target.value }))}
            >
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => c.categoryId !== editing?.categoryId)
                .map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
            </select>
          </FormField>
          {error && <p className="text-sm text-destructive-foreground">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.categoryName}>
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
