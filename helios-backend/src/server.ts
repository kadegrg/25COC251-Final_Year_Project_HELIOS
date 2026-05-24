import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './core/logging/logger.js';
import { closePool } from './db/index.js';
import { bootstrapPlugins, shutdownPlugins } from './core/plugins/plugin-manager.js';

const PORT = env.PORT;

// ── Bootstrap plugins before starting the HTTP server ─
async function start(): Promise<void> {
  try {
    await bootstrapPlugins();
  } catch (err) {
    logger.error({ err }, 'Plugin bootstrap failed (non-fatal, continuing startup)');
  }

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT, env: env.NODE_ENV }, `HELIOS server listening on port ${PORT}`);
  });

  // ── Graceful shutdown ─────────────────────────────────

  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Received shutdown signal');

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await shutdownPlugins();
        await closePool();
        logger.info('Cleanup complete, exiting');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.fatal({ err }, 'Fatal startup error');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
