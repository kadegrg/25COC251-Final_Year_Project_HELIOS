import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { httpLogger } from './core/logging/http-logger.js';
import { requestContextMiddleware } from './middleware/request-context.middleware.js';
import { siteContextMiddleware } from './middleware/site-context.middleware.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';
import { apiRouter } from './routes/index.js';
import { getPluginRouterBase } from './core/plugins/plugin-route-registry.js';

const app = express();

// ── Trust proxy (for rate limiting, IP resolution behind LB) ──
app.set('trust proxy', env.TRUST_PROXY);

// ── Security headers ──────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  }),
);

// ── Body parsing ──────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ── Cookie parsing ────────────────────────────────────
app.use(cookieParser());

// ── HTTP request logging ──────────────────────────────
app.use(httpLogger);

// ── Request context (requestId, ip, userAgent) ────────
app.use(requestContextMiddleware);

// ── Site context resolution ───────────────────────────
app.use(siteContextMiddleware);

// ── Global API rate limiter ───────────────────────────
app.use('/api/', apiRateLimiter);

// ── API v1 routes ─────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── Plugin routes ─────────────────────────────────────
// Plugin-owned routes are mounted at /api/v1/plugins/:pluginId/...
app.use('/api/v1/plugins', getPluginRouterBase());

// ── 404 handler ───────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler ──────────────────────────────
app.use(errorHandler);

export { app };

