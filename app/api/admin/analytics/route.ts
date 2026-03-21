import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET() {
  if (!(await verifyAdmin()).valid) {
    return errorResponse('Forbidden', 403);
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const registrations = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM users
      WHERE createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    const authAttempts = await prisma.$queryRaw<Array<{ date: string; total: bigint; successful: bigint; failed: bigint }>>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
      FROM auth_logs
      WHERE createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    const authBySource = await prisma.$queryRaw<Array<{ source: string; count: bigint }>>`
      SELECT source, COUNT(*) as count
      FROM auth_logs
      WHERE createdAt >= ${thirtyDaysAgo}
      GROUP BY source
    `;

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const serverMetrics = await prisma.serverMetric.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo } },
      orderBy: { createdAt: 'asc' },
      select: { tps: true, online: true, createdAt: true },
    });

    const failedLogins = await prisma.$queryRaw<Array<{ username: string; count: bigint }>>`
      SELECT username, COUNT(*) as count
      FROM auth_logs
      WHERE success = 0 AND createdAt >= ${thirtyDaysAgo}
      GROUP BY username
      ORDER BY count DESC
      LIMIT 10
    `;

    const totalUsers = await prisma.user.count();
    const totalBanned = await prisma.user.count({ where: { isBanned: true } });
    const totalAuthToday = await prisma.authLog.count({
      where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } }
    });

    const serialize = (arr: Array<Record<string, unknown>>) => arr.map(item => {
      const obj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(item)) {
        obj[key] = typeof value === 'bigint' ? Number(value) : value;
      }
      return obj;
    });

    return successResponse({
      registrations: serialize(registrations),
      authAttempts: serialize(authAttempts),
      authBySource: serialize(authBySource),
      serverMetrics,
      failedLogins: serialize(failedLogins),
      totals: { totalUsers, totalBanned, totalAuthToday },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return errorResponse('Server error', 500);
  }
}
