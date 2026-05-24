import type { Request, Response, NextFunction } from 'express';
import * as adjustmentsService from './adjustments.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listAdjustmentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await adjustmentsService.listAdjustments(page, limit, {
      siteId: req.query.siteId as string, status: req.query.status as string, adjustmentType: req.query.adjustmentType as string,
    });
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getAdjustmentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await adjustmentsService.getAdjustment(req.params.adjustmentId as string)); } catch (err) { next(err); }
}

export async function createAdjustmentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await adjustmentsService.createAdjustment(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function approveAdjustmentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await adjustmentsService.approveAdjustment(req.params.adjustmentId as string, req.ctx)); } catch (err) { next(err); }
}

export async function postAdjustmentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await adjustmentsService.postAdjustment(req.params.adjustmentId as string, req.ctx)); } catch (err) { next(err); }
}

export async function cancelAdjustmentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await adjustmentsService.cancelAdjustment(req.params.adjustmentId as string, req.ctx)); } catch (err) { next(err); }
}
