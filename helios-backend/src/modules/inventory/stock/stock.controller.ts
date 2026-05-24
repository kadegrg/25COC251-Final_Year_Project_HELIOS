import type { Request, Response, NextFunction } from 'express';
import * as stockService from './stock.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function queryStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await stockService.queryStock({
      siteId: req.query.siteId as string,
      warehouseId: req.query.warehouseId as string,
      locationId: req.query.locationId as string,
      skuId: req.query.skuId as string,
      stockStatusCode: req.query.stockStatusCode as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    });
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function stockSummaryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await stockService.getStockSummary(req.query.siteId as string)); } catch (err) { next(err); }
}

export async function stockByLocationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await stockService.queryStock({ locationId: req.params.locationId as string, page: 1, limit: 200 });
    sendSuccess(res, result.data);
  } catch (err) { next(err); }
}

export async function stockByWarehouseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await stockService.queryStock({ warehouseId: req.params.warehouseId as string, page: 1, limit: 200 });
    sendSuccess(res, result.data);
  } catch (err) { next(err); }
}

export async function stockBySiteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await stockService.queryStock({ siteId: req.params.siteId as string, page: 1, limit: 200 });
    sendSuccess(res, result.data);
  } catch (err) { next(err); }
}

export async function stockBySkuHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await stockService.queryStock({ skuId: req.params.skuId as string, page: 1, limit: 200 });
    sendSuccess(res, result.data);
  } catch (err) { next(err); }
}

export async function stockItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await stockService.getStockItem(req.params.stockItemId as string)); } catch (err) { next(err); }
}

export async function stockItemBySerialHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await stockService.getStockItemBySerial(req.params.serialNumber as string)); } catch (err) { next(err); }
}

// ── Operations ────────────────────────────────────────

export async function receiveStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await stockService.receiveStock(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function moveStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await stockService.moveStock(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function reserveStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await stockService.reserveStock(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function unreserveStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await stockService.unreserveStock(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function quarantineStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await stockService.quarantineStock(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function releaseQuarantineHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await stockService.releaseQuarantine(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function writeOffHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await stockService.writeOff(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function statusChangeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await stockService.statusChange(req.body, req.ctx)); } catch (err) { next(err); }
}
