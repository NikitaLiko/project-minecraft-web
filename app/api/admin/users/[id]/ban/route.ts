import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(
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
    
    // Get ban type from query or body
    const url = new URL(req.url);
    const banType = url.searchParams.get('type') || 'account'; // 'account' or 'hwid'

    if (auth.valid && auth.userId === userId) {
      return errorResponse('Нельзя заблокировать себя', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse('Пользователь не найден', 404);
    }

    if (banType === 'hwid' && user.hardwareId) {
      // Ban all users with the same HWID
      await prisma.user.updateMany({
        where: { hardwareId: user.hardwareId },
        data: { isBanned: true, isHwidBanned: true },
      });
      return successResponse({ message: 'HWID заблокирован' });
    } else {
      // Regular account ban
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: true },
      });
      return successResponse({ message: 'Аккаунт заблокирован' });
    }
  } catch (error) {
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
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned: false },
    });

    return successResponse({ message: 'Пользователь разблокирован' });
  } catch (error) {
    return errorResponse('Ошибка сервера', 500);
  }
}
