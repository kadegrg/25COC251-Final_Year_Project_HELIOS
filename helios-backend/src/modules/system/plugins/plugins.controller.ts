// ═══════════════════════════════════════════════════════════════════════
// HELIOS System — Plugin admin controller
// ═══════════════════════════════════════════════════════════════════════

import type { Request, Response, NextFunction } from 'express';
import * as pluginsService from './plugins.service.js';
import { sendSuccess } from '../../../core/http/response.js';
import { updatePluginSchema, updatePluginConfigSchema } from './plugins.schemas.js';

function getPluginId(req: Request): string {
  const id = req.params.pluginId;
  return Array.isArray(id) ? id[0] : id;
}

export async function listPlugins(req: Request, res: Response, next: NextFunction) {
  try {
    const plugins = await pluginsService.listPlugins();
    sendSuccess(res, plugins);
  } catch (err) { next(err); }
}

export async function getPlugin(req: Request, res: Response, next: NextFunction) {
  try {
    const plugin = await pluginsService.getPlugin(getPluginId(req));
    sendSuccess(res, plugin);
  } catch (err) { next(err); }
}

export async function updatePlugin(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updatePluginSchema.parse(req.body);
    const plugin = await pluginsService.updatePlugin(getPluginId(req), input);
    sendSuccess(res, plugin);
  } catch (err) { next(err); }
}

export async function getPluginConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await pluginsService.getPluginConfig(getPluginId(req));
    sendSuccess(res, config);
  } catch (err) { next(err); }
}

export async function updatePluginConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updatePluginConfigSchema.parse(req.body);
    const result = await pluginsService.updatePluginConfigAdmin(
      getPluginId(req),
      input.config,
      req.ctx.userId,
    );
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function startPlugin(req: Request, res: Response, next: NextFunction) {
  try {
    const plugin = await pluginsService.startPluginAdmin(getPluginId(req));
    sendSuccess(res, plugin);
  } catch (err) { next(err); }
}

export async function stopPlugin(req: Request, res: Response, next: NextFunction) {
  try {
    const plugin = await pluginsService.stopPluginAdmin(getPluginId(req));
    sendSuccess(res, plugin);
  } catch (err) { next(err); }
}

export async function reloadPlugin(req: Request, res: Response, next: NextFunction) {
  try {
    const plugin = await pluginsService.reloadPluginAdmin(getPluginId(req));
    sendSuccess(res, plugin);
  } catch (err) { next(err); }
}

export async function getPluginJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const jobs = await pluginsService.getPluginJobs(getPluginId(req));
    sendSuccess(res, jobs);
  } catch (err) { next(err); }
}

export async function getHookStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await pluginsService.getHookStats();
    sendSuccess(res, stats);
  } catch (err) { next(err); }
}
