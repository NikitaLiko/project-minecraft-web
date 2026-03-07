import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';

// Event types the mod can send
type EventType = 'kill' | 'death' | 'join' | 'leave' | 'win' | 'loss';

interface EventBody {
    username: string;
    uuid: string;
    event: EventType;
    // Optional extra data
    victim?: string;       // for kill events
    killer?: string;       // for death events
    damageDealt?: number;  // for kill events
    damageTaken?: number;  // for death events
}

export async function POST(request: NextRequest) {
    if (!(await validateApiKey(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: EventBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { username, uuid, event } = body;
    if (!username || !uuid || !event) {
        return NextResponse.json({ error: 'username, uuid, and event are required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findFirst({
            where: { OR: [{ username }, { uuid }] },
        });

        if (!user) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        // Build the increment object based on event type
        const updateData: Record<string, any> = { lastSeen: new Date() };

        switch (event) {
            case 'kill':
                updateData.kills = { increment: 1 };
                if (body.damageDealt) updateData.damageDealt = { increment: body.damageDealt };
                break;
            case 'death':
                updateData.deaths = { increment: 1 };
                if (body.damageTaken) updateData.damageTaken = { increment: body.damageTaken };
                break;
            case 'win':
                updateData.wins = { increment: 1 };
                break;
            case 'loss':
                updateData.losses = { increment: 1 };
                break;
            case 'join':
                updateData.isOnline = true;
                break;
            case 'leave':
                updateData.isOnline = false;
                break;
            default:
                return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
        }

        await prisma.gameProfile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                isOnline: event === 'join',
                kills: event === 'kill' ? 1 : 0,
                deaths: event === 'death' ? 1 : 0,
                wins: event === 'win' ? 1 : 0,
                losses: event === 'loss' ? 1 : 0,
                lastSeen: new Date(),
            },
            update: updateData,
        });

        return NextResponse.json({ success: true, event });
    } catch (error) {
        console.error('[Event API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
