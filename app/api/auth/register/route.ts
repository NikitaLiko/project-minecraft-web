import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';

  const rl = rateLimit(`register:${ip}`, 5, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Некорректные данные';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { username, email, password, token } = parsed.data;

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
      console.error('Turnstile validation failed:', turnstileData.success, turnstileData['error-codes']);
      return NextResponse.json({ error: 'Captcha check failed' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'Email уже используется' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Имя пользователя занято' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        profile: {
          create: {
            nickname: username,
            level: 1,
            money: 0,
            kills: 0,
            deaths: 0,
          },
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Регистрация успешна' });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
