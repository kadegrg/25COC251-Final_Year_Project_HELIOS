import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../core/logging/logger.js';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  min: env.DB_POOL_MIN,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

export { pool };

export type PoolClient = pg.PoolClient;
export type QueryResult<T extends pg.QueryResultRow = any> = pg.QueryResult<T>;

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

