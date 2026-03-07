import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  if (!(await verifyAdmin()).valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const source = url.searchParams.get('source');
    const success = url.searchParams.get('success');
    const search = url.searchParams.get('search') || '';

    const where: any = {};
    if (source) where.source = source;
    if (success !== null && success !== '') where.success = success === 'true';
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { ip: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.authLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.authLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Logs fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
