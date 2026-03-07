import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    // Get ban type from query or body
    const url = new URL(req.url);
    const banType = url.searchParams.get('type') || 'account'; // 'account' or 'hwid'

    if (auth.valid && auth.userId === userId) {
      return NextResponse.json({ error: 'Нельзя заблокировать себя' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (banType === 'hwid' && user.hardwareId) {
      // Ban all users with the same HWID
      await prisma.user.updateMany({
        where: { hardwareId: user.hardwareId },
        data: { isBanned: true, isHwidBanned: true },
      });
      return NextResponse.json({ success: true, message: 'HWID заблокирован' });
    } else {
      // Regular account ban
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: true },
      });
      return NextResponse.json({ success: true, message: 'Аккаунт заблокирован' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned: false },
    });

    return NextResponse.json({ success: true, message: 'Пользователь разблокирован' });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
