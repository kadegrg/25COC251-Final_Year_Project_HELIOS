import pinoHttp from 'pino-http';
import { logger } from './logger.js';

export const httpLogger = (pinoHttp as any)({
  logger,
  serializers: {
    req(req: any) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res: any) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
