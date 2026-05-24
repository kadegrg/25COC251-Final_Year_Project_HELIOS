import type { Request, Response, NextFunction } from 'express';
import * as transfersService from './transfers.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listTransfersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await transfersService.listTransfers(page, limit, {
      fromSiteId: req.query.fromSiteId as string, toSiteId: req.query.toSiteId as string, status: req.query.status as string,
    });
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getTransferHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await transfersService.getTransfer(req.params.transferId as string)); } catch (err) { next(err); }
}

export async function createTransferHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await transfersService.createTransfer(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function approveTransferHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await transfersService.approveTransfer(req.params.transferId as string, req.ctx)); } catch (err) { next(err); }
}

export async function dispatchTransferHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await transfersService.dispatchTransfer(req.params.transferId as string, req.ctx)); } catch (err) { next(err); }
}

export async function receiveTransferHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await transfersService.receiveTransfer(req.params.transferId as string, req.body, req.ctx)); } catch (err) { next(err); }
}

export async function reconcileTransferHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await transfersService.reconcileTransfer(req.params.transferId as string, req.ctx)); } catch (err) { next(err); }
}

export async function cancelTransferHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await transfersService.cancelTransfer(req.params.transferId as string, req.ctx)); } catch (err) { next(err); }
}

export async function getDiscrepanciesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await transfersService.getDiscrepancies(req.params.transferId as string)); } catch (err) { next(err); }
}

export async function addDiscrepancyHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await transfersService.addDiscrepancy(req.params.transferId as string, req.body, req.ctx)); } catch (err) { next(err); }
}
