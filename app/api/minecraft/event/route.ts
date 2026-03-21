import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';
import { eventSchema } from '@/lib/schemas';
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

    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Invalid data';
        return errorResponse(firstError, 400);
    }

    const { username, uuid, event } = parsed.data;

    try {
        const user = await prisma.user.findFirst({
            where: { OR: [{ username }, { uuid }] },
        });

        if (!user) {
            return errorResponse('Player not found', 404);
        }

        // Build the increment object based on event type
        const updateData: Record<string, unknown> = { lastSeen: new Date() };

        switch (event) {
            case 'kill':
                updateData.kills = { increment: 1 };
                if (parsed.data.damageDealt) updateData.damageDealt = { increment: parsed.data.damageDealt };
                break;
            case 'death':
                updateData.deaths = { increment: 1 };
                if (parsed.data.damageTaken) updateData.damageTaken = { increment: parsed.data.damageTaken };
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

        return successResponse({ event });
    } catch (error) {
        console.error('[Event API] Error:', error);
        return errorResponse('Internal server error', 500);
    }
}
