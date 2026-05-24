import type { Request, Response, NextFunction } from 'express';
import * as importsService from './imports.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listImportsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await importsService.listImportJobs(page, limit, {
      siteId: req.query.siteId as string, status: req.query.status as string, importType: req.query.importType as string,
    });
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getImportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await importsService.getImportJob(req.params.importJobId as string)); } catch (err) { next(err); }
}

export async function validateImportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await importsService.validateImport(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function processImportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await importsService.processImport(req.body.importJobId, req.ctx)); } catch (err) { next(err); }
}

