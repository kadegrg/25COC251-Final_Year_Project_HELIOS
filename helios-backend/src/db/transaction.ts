import { getClient, type PoolClient } from './index.js';
import { logger } from '../core/logging/logger.js';

/**
 * Execute a callback within a database transaction.
 * Automatically commits on success, rolls back on error.
 * Supports CockroachDB retry loop for serialisation errors.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  const client = await getClient();
  let attempts = 0;

  try {
    while (attempts < maxRetries) {
      attempts++;
      try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
      } catch (err: any) {
        await client.query('ROLLBACK');
        // CockroachDB serialisation retry (error code 40001)
        if (err.code === '40001' && attempts < maxRetries) {
          logger.warn({ attempt: attempts }, 'Transaction serialisation conflict, retrying');
          continue;
        }
        throw err;
      }
    }
    throw new Error('Transaction exceeded max retries');
  } finally {
    client.release();
  }
}

