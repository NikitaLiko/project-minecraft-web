const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'TURNSTILE_SECRET_KEY',
] as const;

const OPTIONAL_ENV_VARS = [
  'GML_AUTH_SECRET',
  'TURNSTILE_SITE_KEY',
  'RCON_PORT',
  'RCON_PASSWORD',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]?.trim()) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\nSee .env.example for reference.`
    );
  }

  // Warn about optional but recommended vars in production
  if (process.env.NODE_ENV === 'production') {
    for (const key of OPTIONAL_ENV_VARS) {
      if (!process.env[key]?.trim()) {
        console.warn(`[env] Warning: ${key} is not set (optional but recommended in production)`);
      }
    }
  }
}
