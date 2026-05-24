// ═══════════════════════════════════════════════════════════════════════
// HELIOS Plugin System — Plugin job registry & simple scheduler
// ═══════════════════════════════════════════════════════════════════════
//
// Simple in-process interval-based scheduler.
// ═══════════════════════════════════════════════════════════════════════

import { query } from '../../db/index.js';
import { generateId } from '../../utils/ids.js';
import { logger } from '../logging/logger.js';
import { PluginJobError } from './plugin-errors.js';
import type { PluginScheduledJob } from './plugin-types.js';

interface RunningJob {
  pluginId: string;
  job: PluginScheduledJob;
  timerId: ReturnType<typeof setInterval> | null;
  running: boolean;
}

const runningJobs = new Map<string, RunningJob>();

function jobFullKey(pluginId: string, jobKey: string): string {
  return `${pluginId}::${jobKey}`;
}

/**
 * Register and start a scheduled job for a plugin.
 */
export async function registerJob(pluginId: string, job: PluginScheduledJob): Promise<void> {
  const fullKey = jobFullKey(pluginId, job.jobKey);
  if (runningJobs.has(fullKey)) {
    logger.warn({ pluginId, jobKey: job.jobKey }, 'Job already registered, skipping');
    return;
  }

  // Persist job record
  await upsertJobRecord(pluginId, job.jobKey, 'ACTIVE');

  const entry: RunningJob = { pluginId, job, timerId: null, running: false };

  const execute = async () => {
    if (entry.running) return; // Skip if previous run is still in progress
    entry.running = true;
    try {
      logger.debug({ pluginId, jobKey: job.jobKey }, 'Plugin job executing');
      await job.handler();
      await updateJobStatus(pluginId, job.jobKey, 'ACTIVE');
    } catch (err) {
      logger.error({ err, pluginId, jobKey: job.jobKey }, 'Plugin job execution failed');
      await updateJobStatus(pluginId, job.jobKey, 'FAILED', (err as Error).message);
    } finally {
      entry.running = false;
    }
  };

  entry.timerId = setInterval(execute, job.intervalMs);

  // Run immediately if configured
  if (job.runOnStart) {
    // Run without blocking main program
    execute().catch(() => {});
  }

  runningJobs.set(fullKey, entry);
  logger.info({ pluginId, jobKey: job.jobKey, intervalMs: job.intervalMs }, 'Plugin job registered and started');
}

/**
 * Stop and unregister all jobs for a plugin.
 */
export function unregisterPluginJobs(pluginId: string): void {
  for (const [key, entry] of runningJobs) {
    if (entry.pluginId === pluginId) {
      if (entry.timerId) clearInterval(entry.timerId);
      runningJobs.delete(key);
      logger.info({ pluginId, jobKey: entry.job.jobKey }, 'Plugin job stopped');
    }
  }
}

/**
 * Stop all plugin jobs (used during shutdown).
 */
export function stopAllJobs(): void {
  for (const [key, entry] of runningJobs) {
    if (entry.timerId) clearInterval(entry.timerId);
  }
  runningJobs.clear();
  logger.info('All plugin jobs stopped');
}

/**
 * List running jobs for a plugin.
 */
export function getRunningJobs(pluginId: string): Array<{ jobKey: string; running: boolean }> {
  const result: Array<{ jobKey: string; running: boolean }> = [];
  for (const [, entry] of runningJobs) {
    if (entry.pluginId === pluginId) {
      result.push({ jobKey: entry.job.jobKey, running: entry.running });
    }
  }
  return result;
}

// ── DB persistence ───────────────────────────────────────────────────

async function upsertJobRecord(pluginId: string, jobKey: string, status: string): Promise<void> {
  try {
    await query(
      `INSERT INTO system_plugin_jobs (plugin_job_id, plugin_id, job_key, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       ON CONFLICT (plugin_id, job_key) DO UPDATE
         SET status = $4, updated_at = now()`,
      [generateId(), pluginId, jobKey, status],
    );
  } catch (err) {
    logger.warn({ err, pluginId, jobKey }, 'Failed to upsert job record (non-fatal)');
  }
}

async function updateJobStatus(pluginId: string, jobKey: string, status: string, error?: string): Promise<void> {
  try {
    const sets = ['status = $3', 'updated_at = now()'];
    const params: unknown[] = [pluginId, jobKey, status];
    let idx = 4;

    if (status === 'ACTIVE') {
      sets.push('last_run_at = now()');
      sets.push('last_error = NULL');
    }
    if (error) {
      sets.push(`last_error = $${idx++}`);
      params.push(error);
    }

    await query(
      `UPDATE system_plugin_jobs SET ${sets.join(', ')} WHERE plugin_id = $1 AND job_key = $2`,
      params,
    );
  } catch (err) {
    logger.warn({ err, pluginId, jobKey }, 'Failed to update job status (non-fatal)');
  }
}

export async function getJobRecords(pluginId: string): Promise<any[]> {
  const result = await query(
    'SELECT * FROM system_plugin_jobs WHERE plugin_id = $1 ORDER BY job_key',
    [pluginId],
  );
  return result.rows;
}

