import type { Request, Response, NextFunction } from 'express';
import * as locationsService from './locations.service.js';
import { sendSuccess, sendCreated } from '../../../core/http/response.js';

export async function listLocationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await locationsService.listLocations(page, limit, {
      siteId: req.query.siteId as string,
      warehouseId: req.query.warehouseId as string,
      parentLocationId: req.query.parentLocationId as string,
      locationType: req.query.locationType as string,
      status: req.query.status as string,
    });
    sendSuccess(res, result.data, 200, { pagination: result.pagination });
  } catch (err) { next(err); }
}

export async function getLocationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const loc = await locationsService.getLocation(req.params.locationId as string);
    sendSuccess(res, loc);
  } catch (err) { next(err); }
}

export async function getLocationTreeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tree = await locationsService.getLocationTree(req.query.siteId as string, req.query.warehouseId as string);
    sendSuccess(res, tree);
  } catch (err) { next(err); }
}

export async function createLocationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const loc = await locationsService.createLocation(req.body, req.ctx);
    sendCreated(res, loc);
  } catch (err) { next(err); }
}

export async function updateLocationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const loc = await locationsService.updateLocation(req.params.locationId as string, req.body, req.ctx);
    sendSuccess(res, loc);
  } catch (err) { next(err); }
}

export async function archiveLocationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const loc = await locationsService.archiveLocation(req.params.locationId as string, req.ctx);
    sendSuccess(res, loc);
  } catch (err) { next(err); }
}

