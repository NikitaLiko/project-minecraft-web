import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getJwtSecret } from '@/lib/jwt';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;


    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;


    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true },
    });


    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Аккаунт заблокирован' }, { status: 403 });
    }

    const { password, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('[API] /api/auth/me error:', error);
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
}
