import type { RequestContext, SiteContext } from './request-context.js';

declare global {
  namespace Express {
    interface Request {
      ctx: RequestContext;
      siteContext?: SiteContext;
    }
  }
}

