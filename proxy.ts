import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Base URL for redirects: use forwarded host/proto behind nginx so redirects don't point to localhost */
function getBaseUrl(request: NextRequest): string {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost';
    const proto = request.headers.get('x-forwarded-proto') ?? (request.headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'http');
    return `${proto}://${host}`;
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const baseUrl = getBaseUrl(request);

    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/public') ||
        pathname === '/favicon.ico' ||
        pathname === '/favicon.svg' ||
        pathname === '/challenge' ||
        pathname === '/stats/player' ||
        pathname === '/stats/event'
    ) {
        return NextResponse.next();
    }

    const isVerified = request.cookies.get('cf_verified');

    // Allow landing page (/) to be viewed without Cloudflare challenge
    if (!isVerified && pathname !== '/') {
        const url = new URL('/challenge', baseUrl);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    const token = request.cookies.get('auth_token');

    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', baseUrl));
    }

    if (!token && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|favicon.svg|placeholder).*)',
    ],
};
