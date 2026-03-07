/**
 * Centralized JWT secret. Never use a fallback — missing secret must fail at startup.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Set it in .env (e.g. with: openssl rand -base64 32)'
    );
  }
  return secret;
}
