import { useState } from 'react';
import { useAttributes, useSkuMetadata, useSetSkuMetadata } from '@/hooks/use-sku-metadata';
import type { AttributeDefinition, SkuMetadata } from '@/types/sku-metadata.types';
import { SectionCard } from '@/components/common/section-card';
import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { isAxiosError } from 'axios';

interface SkuMetadataPanelProps {
  skuId: string;
  categoryId: string | null;
}

export function SkuMetadataPanel({ skuId, categoryId }: SkuMetadataPanelProps) {
  const metaQ = useSkuMetadata(skuId);
  const attrsQ = useAttributes(categoryId ?? undefined);
  const setMeta = useSetSkuMetadata();

  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');

  const metadata = metaQ.data ?? {};
  const attributes = attrsQ.data ?? [];
  const sorted = [...attributes].sort((a, b) => a.sortOrder - b.sortOrder || a.attributeName.localeCompare(b.attributeName));

  const startEdit = () => {
    const values: Record<string, unknown> = {};
    for (const attr of sorted) {
      values[attr.attributeKey] = metadata[attr.attributeKey] ?? null;
    }
    setFormValues(values);
    setFieldErrors({});
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setError('');
    setFieldErrors({});
    try {
      const body: SkuMetadata = {};
      for (const attr of sorted) {
        const val = formValues[attr.attributeKey];
        body[attr.attributeKey] = val === '' ? null : val;
      }
      await setMeta.mutateAsync({ skuId, body });
      setEditing(false);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const errData = err.response.data?.error;
        if (errData?.code === 'METADATA_VALIDATION_ERROR' && errData?.details) {
          setFieldErrors(errData.details as Record<string, string[]>);
          return;
        }
      }
      setError(err instanceof Error ? err.message : 'Failed to save metadata');
    }
  };

  const setField = (key: string, value: unknown) => {
    setFormValues((f) => ({ ...f, [key]: value }));
  };

  if (attrsQ.isLoading || metaQ.isLoading) {
    return <SectionCard title="Metadata"><p className="text-sm text-muted-foreground">Loading…</p></SectionCard>;
  }

  if (!editing) {
    return (
      <SectionCard
        title="Metadata"
        actions={
          <Button size="sm" variant="outline" onClick={startEdit}>
            Edit Metadata
          </Button>
        }
      >
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attribute definitions found for this category.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {sorted.map((attr) => {
              const val = metadata[attr.attributeKey];
              return (
                <div key={attr.attributeId}>
                  <dt className="text-sm font-medium text-muted-foreground">
                    {attr.attributeName}
                    {attr.unitLabel && <span className="ml-1 text-xs">({attr.unitLabel})</span>}
                  </dt>
                  <dd className="mt-0.5 text-sm">{formatValue(val)}</dd>
                </div>
              );
            })}
          </dl>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Edit Metadata">
      <div className="space-y-4 max-w-2xl">
        {sorted.map((attr) => (
          <MetadataField
            key={attr.attributeId}
            attr={attr}
            value={formValues[attr.attributeKey]}
            onChange={(v) => setField(attr.attributeKey, v)}
            errors={fieldErrors[attr.attributeKey]}
          />
        ))}
        {error && <p className="text-sm text-destructive-foreground">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setEditing(false)} disabled={setMeta.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={setMeta.isPending}>
            {setMeta.isPending ? 'Saving…' : 'Save Metadata'}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function MetadataField({
  attr,
  value,
  onChange,
  errors,
}: {
  attr: AttributeDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
  errors?: string[];
}) {
  const label = attr.attributeName + (attr.unitLabel ? ` (${attr.unitLabel})` : '');
  const errMsg = errors?.join('; ');

  switch (attr.dataType) {
    case 'STRING':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <Input
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            maxLength={(attr.validationRules?.maxLength as number) ?? undefined}
          />
        </FormField>
      );
    case 'TEXT':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <Textarea value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} rows={3} />
        </FormField>
      );
    case 'INTEGER':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <Input
            type="number"
            step="1"
            value={value != null ? String(value) : ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
          />
        </FormField>
      );
    case 'DECIMAL':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <Input
            type="number"
            step="any"
            value={value != null ? String(value) : ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          />
        </FormField>
      );
    case 'BOOLEAN':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            {label}
          </label>
        </FormField>
      );
    case 'DATE':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <Input
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </FormField>
      );
    case 'DATETIME':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <Input
            type="datetime-local"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </FormField>
      );
    case 'JSON':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <Textarea
            value={value != null ? (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) : ''}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            rows={4}
            className="font-mono text-xs"
          />
        </FormField>
      );
    case 'ENUM':
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">— Select —</option>
            {(attr.enumValues ?? []).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </FormField>
      );
    default:
      return (
        <FormField label={label} required={attr.isRequired} error={errMsg}>
          <Input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
        </FormField>
      );
  }
}

function formatValue(val: unknown): string {
  if (val == null) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

