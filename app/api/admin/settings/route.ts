import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { settingsSchema } from '@/lib/schemas';

export async function GET() {
    if (!(await verifyAdmin()).valid) {
        return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    const config = await prisma.systemConfig.upsert({
        where: { id: 'config' },
        update: {},
        create: { id: 'config' }
    });

    return NextResponse.json(config);
}

export async function POST(req: Request) {
    if (!(await verifyAdmin()).valid) {
        return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const parsed = settingsSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Invalid settings';
            return NextResponse.json({ error: firstError }, { status: 400 });
        }
        const { maintenanceMode, serverIp, serverPort, rconPort, rconPassword } = parsed.data;

        const config = await prisma.systemConfig.upsert({
            where: { id: 'config' },
            update: {
                maintenanceMode,
                serverIp,
                serverPort: serverPort ?? 25565,
                rconPort: rconPort ?? null,
                rconPassword
            },
            create: {
                id: 'config',
                maintenanceMode,
                serverIp,
                serverPort: serverPort ?? 25565,
                rconPort: rconPort ?? null,
                rconPassword
            }
        });

        return NextResponse.json({ success: true, config });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
