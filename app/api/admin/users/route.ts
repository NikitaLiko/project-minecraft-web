import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  if (!(await verifyAdmin()).valid) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });

    const safeUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
