import * as importsRepo from './imports.repository.js';
import * as skusRepo from '../skus/skus.repository.js';
import * as stockService from '../stock/stock.service.js';
import { withTransaction } from '../../../db/transaction.js';
import { NotFoundError } from '../../../core/errors/app-error.js';
import { logInventoryAudit } from '../audit/inventory-audit.service.js';
import { logger } from '../../../core/logging/logger.js';
import { runInterceptors, emitEvent } from '../../../core/plugins/hook-executor.js';
import { buildHookContext } from '../../../core/plugins/plugin-context.js';
import { BuiltInHooks } from '../../../core/plugins/hook-types.js';
import type { RequestContext } from '../../../types/request-context.js';
import type { ValidateImportInput } from './imports.schemas.js';
import type { ImportJobRow, ImportRowRow } from '../inventory.types.js';

export async function validateImport(input: ValidateImportInput, ctx: RequestContext) {
  // Interceptor hook: plugins can validate/deny before import validation
  await runInterceptors(BuiltInHooks.IMPORT_BEFORE_VALIDATE, input, buildHookContext(ctx));

  return withTransaction(async (client) => {
    const job = await importsRepo.createImportJob({
      siteId: input.siteId,
      importType: input.importType,
      status: 'VALIDATING',
      sourceFilename: input.sourceFilename,
      sourceFormat: input.sourceFormat,
      requestedByUserId: ctx.userId,
    }, client);

    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < input.rows.length; i++) {
      const rowData = input.rows[i];
      const errors: Record<string, string[]> = {};

      // Basic validation based on import type
      if (input.importType === 'SKU_IMPORT') {
        if (!rowData.skuCode) errors.skuCode = ['skuCode is required'];
        if (!rowData.skuName) errors.skuName = ['skuName is required'];
        if (!rowData.trackingMode) errors.trackingMode = ['trackingMode is required'];
        if (!rowData.defaultUom) errors.defaultUom = ['defaultUom is required'];
      } else if (input.importType === 'GOODS_RECEIPT') {
        if (!rowData.skuCode && !rowData.skuId) errors.sku = ['skuCode or skuId is required'];
        if (!rowData.quantity || Number(rowData.quantity) <= 0) errors.quantity = ['Positive quantity required'];
        if (!rowData.locationId) errors.locationId = ['locationId is required'];
      }

      const isValid = Object.keys(errors).length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      await importsRepo.createImportRow({
        importJobId: job.import_job_id,
        rowNumber: i + 1,
        rowData,
        validationStatus: isValid ? 'VALID' : 'INVALID',
        validationErrors: isValid ? undefined : errors,
      }, client);
    }

    const finalStatus = invalidCount === 0 ? 'VALID' : (validCount > 0 ? 'PARTIALLY_VALID' : 'FAILED');
    const updated = await importsRepo.updateImportJobStatus(job.import_job_id, finalStatus, {
      summaryJson: { totalRows: input.rows.length, validRows: validCount, invalidRows: invalidCount },
    }, client);

    await logInventoryAudit(ctx, 'inventory.import.validated', 'SUCCESS', {
      importJobId: job.import_job_id, siteId: input.siteId,
      details: { importType: input.importType, totalRows: input.rows.length, validRows: validCount, invalidRows: invalidCount },
    }, client);

    logger.info({ importJobId: job.import_job_id, validCount, invalidCount }, 'Import validation complete');

    const rows = await importsRepo.getImportRows(job.import_job_id);
    return { job: formatJob(updated!), rows: rows.map(formatRow) };
  });
}

export async function processImport(importJobId: string, ctx: RequestContext) {
  const job = await importsRepo.findImportJobById(importJobId);
  if (!job) throw new NotFoundError('Import job');
  if (!['VALID', 'PARTIALLY_VALID'].includes(job.status)) {
    throw new Error(`Import job is in status ${job.status}, cannot process`);
  }

  // Interceptor hook: plugins can validate/deny before import processing
  await runInterceptors(BuiltInHooks.IMPORT_BEFORE_PROCESS, { importJobId, importType: job.import_type }, buildHookContext(ctx));

  await importsRepo.updateImportJobStatus(importJobId, 'PROCESSING', { processedByUserId: ctx.userId });

  const rows = await importsRepo.getImportRows(importJobId);
  let processedCount = 0;
  let failedCount = 0;

  for (const row of rows) {
    if (row.validation_status !== 'VALID') continue;

    try {
      if (job.import_type === 'SKU_IMPORT') {
        const data = row.row_data as Record<string, any>;
        const sku = await skusRepo.createSku({
          skuCode: data.skuCode,
          barcode: data.barcode,
          categoryId: data.categoryId,
          skuName: data.skuName,
          shortDescription: data.shortDescription,
          longDescription: data.longDescription,
          trackingMode: data.trackingMode || 'QUANTITY',
          status: data.status || 'ACTIVE',
          defaultUom: data.defaultUom || 'EACH',
          sellableByDefault: data.sellableByDefault ?? true,
        });
        await importsRepo.updateImportRowStatus(row.import_row_id, 'PROCESSED', undefined, 'SKU', sku.sku_id);
        processedCount++;
      } else if (job.import_type === 'GOODS_RECEIPT') {
        const data = row.row_data as Record<string, any>;
        let skuId = data.skuId;
        if (!skuId && data.skuCode) {
          const sku = await skusRepo.findSkuByCode(data.skuCode);
          if (sku) skuId = sku.sku_id;
        }
        if (skuId) {
          await stockService.receiveStock({
            siteId: job.site_id,
            locationId: data.locationId,
            skuId,
            quantity: Number(data.quantity),
            stockStatusCode: data.stockStatusCode || 'AWAITING_PUTAWAY',
            serialNumber: data.serialNumber,
            batchNumber: data.batchNumber,
            expiryDate: data.expiryDate,
            notes: `Import job ${importJobId} row ${row.row_number}`,
          }, ctx);
          await importsRepo.updateImportRowStatus(row.import_row_id, 'PROCESSED');
          processedCount++;
        } else {
          await importsRepo.updateImportRowStatus(row.import_row_id, 'INVALID', { sku: ['SKU not found'] });
          failedCount++;
        }
      }
      // TODO: support other import types
    } catch (err: any) {
      logger.warn({ err, rowId: row.import_row_id }, 'Import row processing failed');
      await importsRepo.updateImportRowStatus(row.import_row_id, 'INVALID', { _error: [err.message] });
      failedCount++;
    }
  }

  const finalStatus = failedCount === 0 ? 'COMPLETED' : 'FAILED';
  const updated = await importsRepo.updateImportJobStatus(importJobId, finalStatus, {
    summaryJson: { processedCount, failedCount, totalValid: rows.filter(r => r.validation_status === 'VALID').length },
  });

  await logInventoryAudit(ctx, 'inventory.import.processed', failedCount > 0 ? 'FAILURE' : 'SUCCESS', {
    importJobId, siteId: job.site_id,
    details: { processedCount, failedCount },
  });

  // Event hook: notify plugins that import completed (non-blocking)
  emitEvent(BuiltInHooks.IMPORT_AFTER_COMPLETED, {
    importJobId, status: finalStatus, processedCount, failedCount, siteId: job.site_id,
  }, buildHookContext(ctx)).catch(() => {});
  logger.info({ importJobId, processedCount, failedCount }, 'Import processing complete');

  return formatJob(updated!);
}

export async function getImportJob(importJobId: string) {
  const job = await importsRepo.findImportJobById(importJobId);
  if (!job) throw new NotFoundError('Import job');
  const rows = await importsRepo.getImportRows(importJobId);
  return { job: formatJob(job), rows: rows.map(formatRow) };
}

export async function listImportJobs(page: number, limit: number, filters: { siteId?: string; status?: string; importType?: string }) {
  const offset = (page - 1) * limit;
  const { rows, total } = await importsRepo.listImportJobs({ ...filters, limit, offset });
  return {
    data: rows.map(formatJob),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

function formatJob(row: ImportJobRow) {
  return {
    importJobId: row.import_job_id,
    siteId: row.site_id,
    importType: row.import_type,
    status: row.status,
    sourceFilename: row.source_filename,
    sourceFormat: row.source_format,
    summaryJson: row.summary_json,
    errorJson: row.error_json,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

function formatRow(row: ImportRowRow) {
  return {
    importRowId: row.import_row_id,
    rowNumber: row.row_number,
    rowData: row.row_data,
    validationStatus: row.validation_status,
    validationErrors: row.validation_errors,
    resultReferenceType: row.result_reference_type,
    resultReferenceId: row.result_reference_id,
  };
}




