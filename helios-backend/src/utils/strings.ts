/**
 * Mask an email address for safe display: j***n@example.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Mask an IP address for logging (keep first two octets).
 */
export function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***.`;
  }
  return '***';
}

/**
 * Extract site ID from a hostname like "site-0002.api.example.com".
 */
export function extractSiteIdFromHost(host: string, baseDomain: string): string | null {
  const lower = host.toLowerCase();
  const base = baseDomain.toLowerCase();
  if (!lower.endsWith(base)) return null;
  const prefix = lower.slice(0, lower.length - base.length - 1); // remove ".baseDomain"
  if (/^site-\d{4}$/.test(prefix)) return prefix;
  return null;
}

/**
 * Extract site ID from a path segment like "/v1/site-0002/...".
 */
export function extractSiteIdFromPath(segment: string): string | null {
  if (/^site-\d{4}$/.test(segment)) return segment;
  return null;
}

