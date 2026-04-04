import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'kills'; // kills | level | playTime | wins
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const allowedSorts = ['kills', 'level', 'playTime', 'wins', 'experience'];
    const orderField = allowedSorts.includes(sortBy) ? sortBy : 'kills';

    try {
        const profiles = await prisma.gameProfile.findMany({
            take: limit,
            orderBy: { [orderField]: 'desc' },
            include: {
                user: {
                    select: { username: true, uuid: true },
                },
            },
        });

        const leaderboard = profiles.map((p, index) => ({
            rank: index + 1,
            username: p.user.username,
            uuid: p.user.uuid,
            level: p.level,
            kills: p.kills,
            deaths: p.deaths,
            kd: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2),
            wins: p.wins,
            losses: p.losses,
            playTime: p.playTime,
            experience: p.experience,
            isOnline: p.isOnline,
        }));

        return successResponse({ leaderboard, sortBy: orderField, total: leaderboard.length });
    } catch (error) {
        console.error('[Leaderboard API] Error:', error);
        return errorResponse('Internal server error', 500);
    }
}
