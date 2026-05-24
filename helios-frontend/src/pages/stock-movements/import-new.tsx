import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidateImport, useProcessImport } from '@/hooks/use-stock-movements';
import type { ValidateImportRequest, ImportType } from '@/types/stock-movements.types';
import { IMPORT_TYPES, STOCK_PERMISSIONS } from '@/types/stock-movements.types';
import { PageHeader, SectionCard, FormField, DataTable, AutoStatusBadge, ForbiddenState } from '@/components/common';
import type { Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseApiError } from '@/lib/api-errors';
import { useHasPermission } from '@/hooks/use-has-permission';
import type { ImportRow } from '@/types/stock-movements.types';

export function ImportNewPage() {
  const navigate = useNavigate();
  const canImport = useHasPermission(STOCK_PERMISSIONS.STOCK_IMPORT);
  const validateMutation = useValidateImport();
  const processMutation = useProcessImport();

  const [siteId, setSiteId] = useState('');
  const [importType, setImportType] = useState<ImportType>('GOODS_RECEIPT');
  const [sourceFilename, setSourceFilename] = useState('');
  const [rowsText, setRowsText] = useState('');
  const [validationResult, setValidationResult] = useState<{ jobId: string; rows: ImportRow[] } | null>(null);

  const handleValidate = () => {
    let rows: Record<string, unknown>[];
    try {
      rows = JSON.parse(rowsText);
      if (!Array.isArray(rows)) throw new Error('Must be an array');
    } catch {
      alert('Rows must be valid JSON array');
      return;
    }
    const body: ValidateImportRequest = { siteId, importType, rows, sourceFilename: sourceFilename || undefined };
    validateMutation.mutate(body, {
      onSuccess: (res) => setValidationResult({ jobId: res.job.importJobId, rows: res.rows }),
    });
  };

  const handleProcess = () => {
    if (!validationResult) return;
    processMutation.mutate({ importJobId: validationResult.jobId }, {
      onSuccess: () => navigate(`/inventory/imports/${validationResult.jobId}`),
    });
  };

  const rowColumns: Column<ImportRow>[] = [
    { id: 'row', header: '#', cell: (r) => r.rowNumber },
    { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.validationStatus} /> },
    { id: 'errors', header: 'Errors', cell: (r) => r.validationErrors ? JSON.stringify(r.validationErrors) : '—' },
  ];

  const apiErr = validateMutation.error ? parseApiError(validateMutation.error) : null;

  return (
    <>
      {!canImport ? <ForbiddenState /> : (
      <>
      <PageHeader title="New Import" description="Validate and process a bulk import (AAL 2)" breadcrumbs={[{ label: 'Imports', href: '/inventory/imports' }, { label: 'New' }]} />

      {!validationResult ? (
        <SectionCard>
          <div className="space-y-4 max-w-lg">
            <FormField label="Site ID" required><Input value={siteId} onChange={(e) => setSiteId(e.target.value)} required /></FormField>
            <FormField label="Import Type" required>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={importType} onChange={(e) => setImportType(e.target.value as ImportType)}>
                {IMPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Source Filename"><Input value={sourceFilename} onChange={(e) => setSourceFilename(e.target.value)} /></FormField>
            <FormField label="Rows (JSON array)" required>
              <Textarea rows={10} value={rowsText} onChange={(e) => setRowsText(e.target.value)} placeholder='[{"skuCode":"ABC","quantity":10,"locationId":"..."}]' />
            </FormField>
            {apiErr && <p className="text-sm text-destructive-foreground">{apiErr.message}</p>}
            <Button onClick={handleValidate} disabled={validateMutation.isPending}>
              {validateMutation.isPending ? 'Validating…' : 'Validate'}
            </Button>
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Validation Results" className="mb-4">
            <p className="mb-2 text-sm">Job ID: <code>{validationResult.jobId}</code></p>
            <DataTable columns={rowColumns} data={validationResult.rows} keyField="importRowId" emptyTitle="No rows" />
          </SectionCard>
          <div className="flex gap-2">
            <Button onClick={handleProcess} disabled={processMutation.isPending}>
              {processMutation.isPending ? 'Processing…' : 'Process Import'}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/inventory/imports/${validationResult.jobId}`)}>View Detail</Button>
          </div>
        </>
      )}
      </>
      )}
    </>
  );
}

