import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { changePasswordSchema } from '@/lib/schemas';

export async function PATCH(req: Request) {
  const auth = await getAuthUser();

  if (!auth.authenticated) {
    return errorResponse('Не авторизован', 401);
  }

  if (auth.user.isBanned) {
    return errorResponse('Аккаунт заблокирован', 403);
  }

  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Некорректные данные';
      return errorResponse(firstError, 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    // Need password hash — getAuthUser strips it, so fetch directly
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return errorResponse('Пользователь не найден', 404);
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return errorResponse('Неверный текущий пароль', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return successResponse({ message: 'Пароль изменён' });
  } catch (error) {
    console.error('[API] /api/profile/password error:', error);
    return errorResponse('Ошибка сервера', 500);
  }
}
