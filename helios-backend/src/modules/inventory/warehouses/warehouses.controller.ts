import type { Request, Response, NextFunction } from 'express';
import * as warehousesService from './warehouses.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listWarehousesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await warehousesService.listWarehouses(page, limit, req.query.siteId as string, req.query.status as string);
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getWarehouseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wh = await warehousesService.getWarehouse(req.params.warehouseId as string);
    sendSuccess(res, wh);
  } catch (err) { next(err); }
}

export async function createWarehouseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wh = await warehousesService.createWarehouse(req.body, req.ctx);
    sendCreated(res, wh);
  } catch (err) { next(err); }
}

export async function updateWarehouseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wh = await warehousesService.updateWarehouse(req.params.warehouseId as string, req.body, req.ctx);
    sendSuccess(res, wh);
  } catch (err) { next(err); }
}

export async function archiveWarehouseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wh = await warehousesService.archiveWarehouse(req.params.warehouseId as string, req.ctx);
    sendSuccess(res, wh);
  } catch (err) { next(err); }
}

