import type { Request, Response, NextFunction } from 'express';
import * as skusService from './skus.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listSkusHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await skusService.listSkus(page, limit, {
      status: req.query.status as string,
      categoryId: req.query.categoryId as string,
      trackingMode: req.query.trackingMode as string,
      search: req.query.search as string,
    });
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getSkuHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await skusService.getSku(req.params.skuId as string)); } catch (err) { next(err); }
}

export async function createSkuHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await skusService.createSku(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function updateSkuHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await skusService.updateSku(req.params.skuId as string, req.body, req.ctx)); } catch (err) { next(err); }
}

export async function archiveSkuHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await skusService.archiveSku(req.params.skuId as string, req.ctx)); } catch (err) { next(err); }
}

export async function getSkuMetadataHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await skusService.getSkuMetadata(req.params.skuId as string)); } catch (err) { next(err); }
}

export async function setSkuMetadataHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await skusService.setSkuMetadata(req.params.skuId as string, req.body, req.ctx)); } catch (err) { next(err); }
}
