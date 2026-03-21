import { verifyAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { settingsSchema } from '@/lib/schemas';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET() {
    if (!(await verifyAdmin()).valid) {
        return errorResponse('Access Denied', 403);
    }

    const config = await prisma.systemConfig.upsert({
        where: { id: 'config' },
        update: {},
        create: { id: 'config' }
    });

    return successResponse({ config });
}

export async function POST(req: Request) {
    if (!(await verifyAdmin()).valid) {
        return errorResponse('Access Denied', 403);
    }

    try {
        const body = await req.json();
        const parsed = settingsSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Invalid settings';
            return errorResponse(firstError, 400);
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

        return successResponse({ config });
    } catch (error) {
        return errorResponse('Failed to save settings', 500);
    }
}
