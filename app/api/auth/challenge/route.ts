import { NextResponse } from 'next/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { getClientIp } from '@/lib/ip';
import { errorResponse } from '@/lib/api-response';

export async function POST(req: Request) {
    const ip = getClientIp(req);

    const rl = rateLimit(`challenge:${ip}`, 10, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    try {
        const { token } = await req.json();

        if (!token) {
            return errorResponse('Captcha required', 400);
        }

        if (!(await verifyTurnstile(token))) {
            return errorResponse('Verification failed', 400);
        }

        const response = NextResponse.json({ success: true });

        const https =
            process.env.NODE_ENV === 'production' ||
            req.headers.get('x-forwarded-proto') === 'https' ||
            (req.headers.get('cf-visitor') ?? '').includes('https');

        // Set a cookie that serves as the "Gate Pass"
        response.cookies.set('cf_verified', 'true', {
            httpOnly: true,
            secure: Boolean(https),
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Challenge error:', error);
        return errorResponse('Server error', 500);
    }
}
