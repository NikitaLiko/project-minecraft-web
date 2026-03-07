import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';

    const rl = rateLimit(`challenge:${ip}`, 10, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Captcha required' }, { status: 400 });
        }

        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token,
            }),
        });

        const turnstileData = await turnstileRes.json();

        if (!turnstileData.success) {
            return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
        }

        const response = NextResponse.json({ success: true });

        // Set a cookie that serves as the "Gate Pass"
        response.cookies.set('cf_verified', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Challenge error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
