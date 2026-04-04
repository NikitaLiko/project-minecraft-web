import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET() {
  if (!(await verifyAdmin()).valid) {
    return errorResponse('Доступ запрещен', 403);
  }

  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });

    const safeUsers = users.map(({ password, ...user }) => user);
    return successResponse({ users: safeUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse('Ошибка сервера', 500);
  }
}
