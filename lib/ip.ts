/**
 * Extract client IP from request headers (behind Cloudflare, nginx, or other proxies).
 */
export function getClientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.split(',')[0].trim();

  const trueClient = req.headers.get('true-client-ip');
  if (trueClient) return trueClient.split(',')[0].trim();

  const real = req.headers.get('x-real-ip');
  if (real) return real.split(',')[0].trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}
