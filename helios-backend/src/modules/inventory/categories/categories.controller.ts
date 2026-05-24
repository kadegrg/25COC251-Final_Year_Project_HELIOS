import type { Request, Response, NextFunction } from 'express';
import * as categoriesService from './categories.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listCategoriesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await categoriesService.listCategories()); } catch (err) { next(err); }
}

export async function createCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendCreated(res, await categoriesService.createCategory(req.body, req.ctx)); } catch (err) { next(err); }
}

export async function updateCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await categoriesService.updateCategory(req.params.categoryId as string, req.body, req.ctx)); } catch (err) { next(err); }
}

