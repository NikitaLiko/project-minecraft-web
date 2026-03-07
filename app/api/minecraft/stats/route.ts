import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
    // Validate API key
    if (!(await validateApiKey(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const {
        username,
        uuid,
        kills,
        deaths,
        wins,
        losses,
        damageDealt,
        damageTaken,
        blocksPlaced,
        blocksBroken,
        playTime,
        level,
        experience,
        money,
        faction,
        isOnline,
    } = body;

    if (!username || !uuid) {
        return NextResponse.json({ error: 'username and uuid are required' }, { status: 400 });
    }

    try {
        // Find user by username (uuid stored in User.uuid)
        let user = await prisma.user.findFirst({
            where: { OR: [{ username }, { uuid }] },
        });

        if (!user) {
            return NextResponse.json({ error: 'Player not found in the website database. They must register first.' }, { status: 404 });
        }

        // Upsert game profile
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

        return NextResponse.json({ success: true, profile });
    } catch (error) {
        console.error('[Minecraft Stats API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
