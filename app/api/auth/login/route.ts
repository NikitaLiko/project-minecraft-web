import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/jwt';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/schemas';
import { verifyTurnstile } from '@/lib/turnstile';
import { getClientIp } from '@/lib/ip';
import { errorResponse } from '@/lib/api-response';

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const rl = rateLimit(`login:${ip}`, 5, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Некорректные данные';
      return errorResponse(firstError, 400);
    }
    const { username, password, token: turnstileToken } = parsed.data;

    if (!(await verifyTurnstile(turnstileToken))) {
      return errorResponse('Captcha check failed', 400);
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });

    if (!user) {
      await prisma.authLog.create({
        data: { username, ip, source: 'web', success: false, message: 'User not found' }
      });
      return errorResponse('Неверный никнейм или пароль', 401);
    }

    if (user.isBanned) {
      await prisma.authLog.create({
        data: { userId: user.id, username, ip, source: 'web', success: false, message: 'Account banned' }
      });
      return errorResponse('Аккаунт заблокирован', 403);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      await prisma.authLog.create({
        data: { userId: user.id, username, ip, source: 'web', success: false, message: 'Wrong password' }
      });
      return errorResponse('Неверный никнейм или пароль', 401);
    }

    // Update last login and IP for admin visibility
    const updateData: { lastLogin: Date; ipAddress?: string } = { lastLogin: new Date() };
    if (ip !== 'unknown') updateData.ipAddress = ip;

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await prisma.authLog.create({
      data: { userId: user.id, username, ip, source: 'web', success: true, message: 'OK' }
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({ success: true, message: 'Успешный вход' });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Ошибка сервера', 500);
  }
}
