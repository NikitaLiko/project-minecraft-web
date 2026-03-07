import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// GML Launcher Authentication Endpoint
// Documentation: https://gml-launcher.github.io/Gml.Docs/integrations-auth-custom.html
//
// Only launcher users can join the server: GML Backend calls this endpoint;
// without a successful response (UserUuid) the launcher does not get a session.
//
// Optional: set GML_AUTH_SECRET in .env and configure the same secret in GML
// (if your backend supports custom headers) so only GML Backend can call this API.
//
// Expected request from GML Backend:
// POST with { Login: string, Password: string } (we accept login/password in various cases)
// Optional: HardwareId / Hwid / hardwareId in body, or X-Hardware-Id / X-Gml-Hwid in headers —
//   if present, we save it to user.hardwareId for HWID ban and display in admin.
//
// Response codes:
// 200 - Success (Message, UserUuid, Login)
// 401 - Invalid credentials (unified for not-found and wrong password to prevent enumeration)
// 403 - User banned / HWID banned
// 503 - GML_AUTH_SECRET not configured

const GML_AUTH_SECRET = process.env.GML_AUTH_SECRET?.trim();

export async function POST(req: Request) {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';

  const rl = rateLimit(`gml:${ip}`, 10, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    if (!GML_AUTH_SECRET) {
      return NextResponse.json(
        { Message: 'Service not configured' },
        { status: 503 }
      );
    }

    const secret = req.headers.get('x-gml-auth-secret');
    if (secret !== GML_AUTH_SECRET) {
      return NextResponse.json(
        { Message: 'Неверный запрос' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // GML sends 'Login' (PascalCase); we accept several variants
    const loginRaw = body.login || body.Login || body.email || body.Email || body.username || body.Username;
    const login = typeof loginRaw === 'string' ? loginRaw.trim() : '';
    const password = body.password || body.Password;

    // Optional HWID: from body (PascalCase/camelCase) or headers (for GML Backend / custom launchers)
    const hwidFromBody =
      body.HardwareId ?? body.Hwid ?? body.hardwareId ?? body.hardware_id;
    const hwidFromHeader =
      req.headers.get('x-hardware-id') ?? req.headers.get('x-gml-hwid') ?? req.headers.get('x-hwid');
    const hardwareId =
      (typeof hwidFromBody === 'string' ? hwidFromBody.trim() : null) || hwidFromHeader?.trim() || null;

    if (!login || !password) {
      return NextResponse.json(
        { Message: 'Логин и пароль обязательны' },
        { status: 401 }
      );
    }

    if (login.length > 255) {
      return NextResponse.json(
        { Message: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login },
          { username: login },
        ],
      },
      select: {
        id: true,
        uuid: true,
        username: true,
        password: true,
        isBanned: true,
        isHwidBanned: true,
        hardwareId: true,
      },
    });

    const invalidCredentialsResponse = NextResponse.json(
      { Message: 'Неверный логин или пароль' },
      { status: 401 }
    );

    if (!user) {
      await prisma.authLog.create({
        data: { username: login, ip, source: 'launcher', success: false, message: 'User not found' }
      });
      return invalidCredentialsResponse;
    }

    if (user.isBanned || user.isHwidBanned) {
      await prisma.authLog.create({
        data: {
          userId: user.id,
          username: user.username,
          ip,
          source: 'launcher',
          success: false,
          message: user.isHwidBanned ? 'HWID banned' : 'Account banned',
        }
      });
      return NextResponse.json(
        { Message: 'Аккаунт заблокирован' },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      await prisma.authLog.create({
        data: { userId: user.id, username: user.username, ip, source: 'launcher', success: false, message: 'Wrong password' }
      });
      return invalidCredentialsResponse;
    }

    // Update last login, and optionally HWID + IP (so admin panel can show them)
    const updateData: { lastLogin: Date; ipAddress?: string; hardwareId?: string } = { lastLogin: new Date() };
    if (ip && ip !== 'unknown') updateData.ipAddress = ip.split(',')[0].trim();
    if (hardwareId && hardwareId.length <= 512) updateData.hardwareId = hardwareId;

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await prisma.authLog.create({
      data: { userId: user.id, username: user.username, ip, source: 'launcher', success: true, message: 'OK' }
    });

    // 200 - Success
    // GML expects PascalCase fields: Login, UserUuid, Message, IsSlim
    return NextResponse.json({
      Message: 'Успешная авторизация',
      UserUuid: user.uuid,
      Login: user.username,
      IsSlim: false,
    }, { status: 200 });

  } catch (error) {
    console.error('GML Auth error:', error);
    return NextResponse.json(
      { Message: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
