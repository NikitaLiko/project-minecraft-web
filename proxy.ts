import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Корректный origin за Cloudflare / nginx.
 * Next за reverse proxy часто видит nextUrl.origin как http://127.0.0.1:3000 — его нельзя
 * отдавать в Location, иначе браузер пользователя уйдёт на его localhost.
 */
function loopbackHostname(hostname: string): boolean {
    const h = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

function hostHeaderIsLoopback(hostHeader: string): boolean {
    const hostOnly = hostHeader.split(':')[0];
    return loopbackHostname(hostOnly);
}

function originIsInternal(origin: string): boolean {
    try {
        const u = new URL(origin);
        return loopbackHostname(u.hostname);
    } catch {
        return true;
    }
}

function resolveProto(request: NextRequest): string {
    const xf = request.headers.get('x-forwarded-proto');
    if (xf) return xf.split(',')[0].trim();
    if (request.headers.get('cf-visitor')?.includes('"scheme":"https"')) return 'https';
    if (request.headers.get('x-forwarded-ssl') === 'on') return 'https';
    const p = request.nextUrl?.protocol;
    if (p === 'https:') return 'https';
    return 'http';
}

function getBaseUrl(request: NextRequest): string {
    const host =
        request.headers.get('x-forwarded-host')?.split(',')[0].trim() ??
        request.headers.get('host') ??
        '';

    if (host && !hostHeaderIsLoopback(host)) {
        return `${resolveProto(request)}://${host}`;
    }

    const fromNext = request.nextUrl?.origin;
    if (fromNext && !originIsInternal(fromNext)) {
        return fromNext;
    }

    if (host) {
        return `${resolveProto(request)}://${host}`;
    }

    return fromNext ?? `${resolveProto(request)}://localhost`;
}

/** Страницы без предварительного Turnstile — иначе при сбое капчи на новом домене нельзя даже открыть вход. */
function isPublicWithoutChallenge(pathname: string): boolean {
    if (pathname === '/login' || pathname === '/register' || pathname === '/leaderboard') return true;
    if (pathname.startsWith('/stats/')) return true;
    return false;
}

function isChallengeDisabled(): boolean {
    const v = process.env.DISABLE_FRONTEND_CHALLENGE?.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
}

/** Уже вошёл в аккаунт — не держим на Turnstile (капча остаётся на login/register при необходимости). */
function sessionSkipsCfGate(request: NextRequest, pathname: string): boolean {
    const token = request.cookies.get('auth_token');
    if (!token) return false;
    return pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
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

    const skipGate =
        isChallengeDisabled() || isPublicWithoutChallenge(pathname) || sessionSkipsCfGate(request, pathname);

    // Главная (/), публичные маршруты и сессия в кабинете — без обязательного cf_verified
    if (!isVerified && pathname !== '/' && !skipGate) {
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
