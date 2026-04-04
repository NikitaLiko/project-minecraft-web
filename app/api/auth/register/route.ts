import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/schemas';
import { verifyTurnstile } from '@/lib/turnstile';
import { getClientIp } from '@/lib/ip';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const rl = rateLimit(`register:${ip}`, 5, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Некорректные данные';
      return errorResponse(firstError, 400);
    }
    const { username, email, password, token } = parsed.data;

    if (!(await verifyTurnstile(token))) {
      return errorResponse('Captcha check failed', 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return errorResponse('Email уже используется', 400);
      }
      return errorResponse('Имя пользователя занято', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
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

    return successResponse({ message: 'Регистрация успешна' });
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Ошибка сервера', 500);
  }
}
