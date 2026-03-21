const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true if verification passed, false otherwise.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('[Turnstile] TURNSTILE_SECRET_KEY is not configured');
    return false;
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });

    const data = await res.json();

    if (!data.success) {
      console.error('[Turnstile] Validation failed:', data['error-codes']);
    }

    return !!data.success;
  } catch (error) {
    console.error('[Turnstile] Request error:', error);
    return false;
  }
}
