import { existsSync, statSync, createReadStream } from 'fs';
import { Readable } from 'stream';
import {
  getLauncherAttachmentFilename,
  getLauncherCdnUrl,
  getLauncherExplicitDownloadUrl,
  getLauncherLocalPath,
  resolvePublicDropLauncher,
} from '@/lib/launcher-storage';

export async function GET() {
  const explicit = getLauncherExplicitDownloadUrl();
  if (explicit) {
    return Response.redirect(explicit, 302);
  }

  const drop = resolvePublicDropLauncher();
  if (drop) {
    const stat = statSync(drop.absPath);
    const nodeStream = createReadStream(drop.absPath);
    const webStream = Readable.toWeb(nodeStream as import('stream').Readable) as ReadableStream<Uint8Array>;
    const safeName = drop.filename.replace(/"/g, '');
    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  const cdn = getLauncherCdnUrl();
  if (cdn) {
    return Response.redirect(cdn, 302);
  }

  const filePath = getLauncherLocalPath();
  const attachmentName = getLauncherAttachmentFilename();

  if (!existsSync(filePath)) {
    return Response.json(
      {
        error: 'Launcher not available',
        hint:
          'Положите .exe/.zip/.7z в public/launcher на сервере. Docker: в compose должен быть volume ./public/launcher -> /app/public/launcher, затем docker compose up -d.',
      },
      { status: 404 }
    );
  }

  const stat = statSync(filePath);
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream as import('stream').Readable) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${attachmentName}"`,
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
