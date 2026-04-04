import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { pingServer } from '@/lib/mc-ping';
import { getTps } from '@/lib/rcon';

interface StatusData {
    online: boolean;
    players: { online: number; max: number; sample?: { name: string; id: string }[] };
    tps: number;
    ping: number;
    maintenance: boolean;
    history: number[];
}

let cache: { data: StatusData | null; ts: number } = { data: null, ts: 0 };
let lastCleanup = 0;

const CACHE_TTL = 10_000;
const CLEANUP_INTERVAL = 3600_000;
const MAX_METRICS = 2000;

export async function GET() {
    try {
        const now = Date.now();

        if (cache.data && now - cache.ts < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const config = await prisma.systemConfig.findUnique({ where: { id: 'config' } })
            ?? await prisma.systemConfig.create({ data: { id: 'config' } });

        const serverIp = config.serverIp || 'pl1.hoxen.one';

        const [status, tps] = await Promise.all([
            pingServer(serverIp, config.serverPort),
            (config.rconPort && config.rconPassword)
                ? getTps(serverIp, config.rconPort, config.rconPassword)
                : Promise.resolve(0)
        ]);

        const currentTps = (typeof tps === 'number' && tps >= 0) ? tps : 0;
        const currentPlayers = typeof status.players?.online === 'number' ? status.players.online : 0;

        const [, historyData] = await Promise.all([
            prisma.serverMetric.create({
                data: { tps: currentTps, online: currentPlayers }
            }),
            prisma.serverMetric.findMany({
                take: 40,
                orderBy: { createdAt: 'desc' },
                select: { tps: true }
            }),
            (now - lastCleanup > CLEANUP_INTERVAL)
                ? cleanupOldMetrics().then(() => { lastCleanup = now; })
                : Promise.resolve()
        ]);

        const responseData: StatusData = {
            online: status.online,
            players: status.players,
            tps: currentTps,
            ping: status.ping,
            maintenance: config.maintenanceMode,
            history: historyData.reverse().map(m => m.tps)
        };

        cache = { data: responseData, ts: now };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Status API Error:", error);
        return NextResponse.json(
            { online: false, players: { online: 0, max: 0 }, maintenance: false, history: [] },
            { status: 500 }
        );
    }
}

async function cleanupOldMetrics() {
    try {
        const count = await prisma.serverMetric.count();
        if (count > MAX_METRICS) {
            const cutoff = await prisma.serverMetric.findMany({
                orderBy: { createdAt: 'desc' },
                skip: MAX_METRICS,
                take: 1,
                select: { createdAt: true }
            });
            if (cutoff[0]) {
                await prisma.serverMetric.deleteMany({
                    where: { createdAt: { lte: cutoff[0].createdAt } }
                });
            }
        }
    } catch (e) {
        console.error("Metrics cleanup error:", e);
    }
}
