/**
 * Extract client IP from request headers (behind nginx/proxy).
 * Returns the first IP from x-real-ip or x-forwarded-for, or 'unknown'.
 */
export function getClientIp(req: Request): string {
  const real = req.headers.get('x-real-ip');
  if (real) return real.split(',')[0].trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}
