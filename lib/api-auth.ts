import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

const keyCache = new Map<string, { valid: boolean; ts: number }>();
const CACHE_TTL = 60_000;

export async function validateApiKey(request: NextRequest): Promise<boolean> {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) return false;

    const cached = keyCache.get(apiKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.valid;
    }

    const found = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    const valid = !!found;

    keyCache.set(apiKey, { valid, ts: Date.now() });

    if (keyCache.size > 100) {
        const oldest = [...keyCache.entries()]
            .sort((a, b) => a[1].ts - b[1].ts)[0];
        if (oldest) keyCache.delete(oldest[0]);
    }

    return valid;
}
