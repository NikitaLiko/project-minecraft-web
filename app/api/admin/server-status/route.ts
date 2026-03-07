import { NextResponse } from 'next/server';
import net from 'net';
import os from 'os';
import { verifyAdmin } from '@/lib/admin-auth';

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
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }

  try {
    const { serverIp, serverPort } = await req.json();

    const port = parseInt(serverPort) || 25565;
    if (serverIp && !/^[a-zA-Z0-9.-]+$/.test(serverIp)) {
      return NextResponse.json({ error: 'Invalid IP/Hostname' }, { status: 400 });
    }
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json({ error: 'Invalid Port' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
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
    return NextResponse.json({ success: false, error: 'Ошибка проверки' }, { status: 500 });
  }
}
