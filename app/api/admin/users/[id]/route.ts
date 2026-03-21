import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyAdmin } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { Role } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.valid) {
    return errorResponse('Доступ запрещен', 403);
  }

  try {
    const { id } = await params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        sessions: {
          orderBy: { expires: 'desc' },
          select: { id: true, expires: true },
        },
      },
    });

    if (!user) {
      return errorResponse('Пользователь не найден', 404);
    }

    const authLogs = await prisma.authLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const { password, ...safeUser } = user;
    return successResponse({ user: safeUser, authLogs });
  } catch (error) {
    return errorResponse('Ошибка сервера', 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.valid) {
    return errorResponse('Доступ запрещен', 403);
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { username, email, role, isBanned, password } = body;

    const updateData: {
      username?: string;
      email?: string;
      role?: Role;
      isBanned?: boolean;
      password?: string;
    } = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role && Object.values(Role).includes(role)) updateData.role = role as Role;
    if (typeof isBanned === 'boolean') updateData.isBanned = isBanned;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return successResponse({ message: 'Пользователь обновлен' });
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse('Ошибка сервера', 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.valid) {
    return errorResponse('Доступ запрещен', 403);
  }

  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (auth.valid && auth.userId === userId) {
      return errorResponse('Нельзя удалить себя', 400);
    }

    await prisma.gameProfile.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return successResponse({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('Ошибка сервера', 500);
  }
}
