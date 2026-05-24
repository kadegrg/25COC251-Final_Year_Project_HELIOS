import type { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service.js';
import { sendSuccess } from '../../../core/http/response.js';

export async function lowStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
    sendSuccess(res, await reportsService.getLowStockReport(req.query.siteId as string, threshold));
  } catch (err) { next(err); }
}

export async function negativeStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await reportsService.getNegativeStockReport(req.query.siteId as string)); } catch (err) { next(err); }
}

export async function discrepanciesReportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await reportsService.getDiscrepancyReport(req.query.siteId as string)); } catch (err) { next(err); }
}

export async function reservedVsAvailableHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await reportsService.getReservedVsAvailableReport(req.query.siteId as string)); } catch (err) { next(err); }
}

export async function recentAdjustmentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await reportsService.getRecentAdjustmentsReport(req.query.siteId as string)); } catch (err) { next(err); }
}

export async function cycleCountVarianceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await reportsService.getCycleCountVarianceReport(req.query.siteId as string)); } catch (err) { next(err); }
}

