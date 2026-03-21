import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';
import { statsUpdateSchema } from '@/lib/schemas';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
    if (!(await validateApiKey(request))) {
        return errorResponse('Unauthorized', 401);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid JSON', 400);
    }

    const parsed = statsUpdateSchema.safeParse(body);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Invalid data';
        return errorResponse(firstError, 400);
    }

    const {
        username, uuid, kills, deaths, wins, losses,
        damageDealt, damageTaken, blocksPlaced, blocksBroken,
        playTime, level, experience, money, faction, isOnline,
    } = parsed.data;

    try {
        const user = await prisma.user.findFirst({
            where: { OR: [{ username }, { uuid }] },
        });

        if (!user) {
            return errorResponse('Player not found in the website database. They must register first.', 404);
        }

        const profile = await prisma.gameProfile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                kills: kills ?? 0,
                deaths: deaths ?? 0,
                wins: wins ?? 0,
                losses: losses ?? 0,
                damageDealt: damageDealt ?? 0,
                damageTaken: damageTaken ?? 0,
                blocksPlaced: blocksPlaced ?? 0,
                blocksBroken: blocksBroken ?? 0,
                playTime: playTime ?? 0,
                level: level ?? 1,
                experience: experience ?? 0,
                money: money ?? 0,
                faction: faction ?? null,
                isOnline: isOnline ?? false,
                lastSeen: new Date(),
            },
            update: {
                ...(kills !== undefined && { kills }),
                ...(deaths !== undefined && { deaths }),
                ...(wins !== undefined && { wins }),
                ...(losses !== undefined && { losses }),
                ...(damageDealt !== undefined && { damageDealt }),
                ...(damageTaken !== undefined && { damageTaken }),
                ...(blocksPlaced !== undefined && { blocksPlaced }),
                ...(blocksBroken !== undefined && { blocksBroken }),
                ...(playTime !== undefined && { playTime }),
                ...(level !== undefined && { level }),
                ...(experience !== undefined && { experience }),
                ...(money !== undefined && { money }),
                ...(faction !== undefined && { faction }),
                ...(isOnline !== undefined && { isOnline }),
                lastSeen: new Date(),
            },
        });

        return successResponse({ profile });
    } catch (error) {
        console.error('[Minecraft Stats API] Error:', error);
        return errorResponse('Internal server error', 500);
    }
}
