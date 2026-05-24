import type { Request, Response, NextFunction } from 'express';
import * as attributesService from './attributes.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listAttributesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await attributesService.listAttributes(req.query.categoryId as string)); } catch (err) { next(err); }
}

export async function createAttributeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await attributesService.createAttribute(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function updateAttributeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await attributesService.updateAttribute(req.params.attributeId as string, req.body, req.ctx)); } catch (err) { next(err); }
}

