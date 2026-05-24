import type { Request, Response, NextFunction } from 'express';
import * as stockService from '../stock/stock.service.js';
import { sendSuccess } from '../../../core/http/response.js';

export async function listMovementsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await stockService.queryMovements({
      siteId: req.query.siteId as string,
      skuId: req.query.skuId as string,
      stockItemId: req.query.stockItemId as string,
      locationId: req.query.locationId as string,
      movementType: req.query.movementType as string,
      transferId: req.query.transferId as string,
      adjustmentId: req.query.adjustmentId as string,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    });
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getMovementHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await stockService.getMovement(req.params.movementId as string)); } catch (err) { next(err); }
}

