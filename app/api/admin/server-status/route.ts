import net from 'net';
import os from 'os';
import { verifyAdmin } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

function checkPort(host: string, port: number, timeout = 3000): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const socket = net.connect({ host, port });
    socket.setTimeout(timeout);
    socket.on('connect', () => { socket.destroy(); resolve(Date.now() - start); });
    socket.on('timeout', () => { socket.destroy(); reject(new Error('timeout')); });
    socket.on('error', reject);
  });
}

export async function POST(req: Request) {
  if (!(await verifyAdmin()).valid) {
    return errorResponse('Access Denied', 403);
  }

  try {
    const { serverIp, serverPort } = await req.json();

    const port = parseInt(serverPort) || 25565;
    if (serverIp && !/^[a-zA-Z0-9.-]+$/.test(serverIp)) {
      return errorResponse('Invalid IP/Hostname', 400);
    }
    if (isNaN(port) || port < 1 || port > 65535) {
      return errorResponse('Invalid Port', 400);
    }

    const cpuUsage = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const cpuPercent = Math.min(100, Math.round((cpuUsage / cpuCount) * 100));

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    let serverOnline = false;
    let serverPing = 0;

    if (serverIp) {
      try {
        serverPing = await checkPort(serverIp, port);
        serverOnline = true;
      } catch {
        serverOnline = false;
      }
    }

    return successResponse({
      system: {
        cpu: cpuPercent,
        memory: memPercent,
        memoryUsed: Math.round(usedMem / 1024 / 1024 / 1024 * 10) / 10,
        memoryTotal: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10,
      },
      server: {
        online: serverOnline,
        ping: serverPing,
        ip: serverIp || null,
        port: port,
      },
    });
  } catch (error) {
    console.error('Server status error:', error);
    return errorResponse('Ошибка проверки', 500);
  }
}
