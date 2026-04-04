import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getJwtSecret } from '@/lib/jwt';

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

export type AuthResult =
  | { authenticated: true; user: AuthUser }
  | { authenticated: false; user?: never };

interface AuthUser {
  id: number;
  uuid: string;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  isHwidBanned: boolean;
  hardwareId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  ipAddress: string | null;
  profile: {
    id: number;
    userId: number;
    nickname: string | null;
    level: number;
    experience: number;
    money: number;
    faction: string | null;
    playTime: number;
    kills: number;
    deaths: number;
    wins: number;
    losses: number;
    damageDealt: number;
    damageTaken: number;
    blocksPlaced: number;
    blocksBroken: number;
    lastSeen: Date | null;
    isOnline: boolean;
  } | null;
}

/**
 * Extracts and verifies the auth token from cookies, then loads the user from DB.
 * Returns { authenticated: true, user } or { authenticated: false }.
 */
export async function getAuthUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return { authenticated: false };

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true },
    });

    if (!user) return { authenticated: false };

    const { password, sessions, ...safeUser } = user as typeof user & { sessions?: unknown };
    return { authenticated: true, user: safeUser as AuthUser };
  } catch {
    return { authenticated: false };
  }
}
