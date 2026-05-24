export interface RequestContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  aal: number;
  amr: string[];
  ip: string;
  userAgent: string;
  siteId?: string;
}

export interface SiteContext {
  siteId: string;
  resolvedFrom: 'host' | 'path' | 'none';
}

