import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    try {
        const user = await prisma.user.findFirst({
            where: { username },
            select: {
                username: true,
                uuid: true,
                createdAt: true,
                profile: true,
            },
        });

        if (!user || !user.profile) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        const profile = user.profile;
        const kd = profile.deaths > 0 ? (profile.kills / profile.deaths).toFixed(2) : profile.kills.toFixed(2);

        return NextResponse.json({
            username: user.username,
            uuid: user.uuid,
            registeredAt: user.createdAt,
            level: profile.level,
            experience: profile.experience,
            money: profile.money,
            faction: profile.faction,
            playTime: profile.playTime,
            kills: profile.kills,
            deaths: profile.deaths,
            kd,
            wins: profile.wins,
            losses: profile.losses,
            damageDealt: profile.damageDealt,
            damageTaken: profile.damageTaken,
            blocksPlaced: profile.blocksPlaced,
            blocksBroken: profile.blocksBroken,
            isOnline: profile.isOnline,
            lastSeen: profile.lastSeen,
        });
    } catch (error) {
        console.error('[Stats GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
