import type { Request, Response, NextFunction } from 'express';
import * as sitesService from './sites.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listSitesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await sitesService.listSites(page, limit, status);
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getSiteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const site = await sitesService.getSite(req.params.siteId as string);
    sendSuccess(res, site);
  } catch (err) { next(err); }
}

export async function createSiteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const site = await sitesService.createSite(req.body, req.ctx);
    sendCreated(res, site);
  } catch (err) { next(err); }
}

export async function updateSiteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const site = await sitesService.updateSite(req.params.siteId as string, req.body, req.ctx);
    sendSuccess(res, site);
  } catch (err) { next(err); }
}

export async function archiveSiteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const site = await sitesService.archiveSite(req.params.siteId as string, req.ctx);
    sendSuccess(res, site);
  } catch (err) { next(err); }
}
