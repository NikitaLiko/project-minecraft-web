import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  if (!(await verifyAdmin()).valid) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, bannedUsers, activeToday, newThisWeek, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { lastLogin: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isBanned: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: { totalUsers, bannedUsers, activeToday, newThisWeek },
      recentUsers,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
