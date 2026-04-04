import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getJwtSecret } from '@/lib/jwt';

export type VerifyAdminResult = { valid: true; userId: number } | { valid: false; userId?: never };

export async function verifyAdmin(): Promise<VerifyAdminResult> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return { valid: false };

    try {
        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret) as { userId: number; role?: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, isBanned: true }
        });

        if (!user || user.isBanned || user.role !== 'ADMIN') return { valid: false };
        return { valid: true, userId: user.id };
    } catch {
        return { valid: false };
    }
}
