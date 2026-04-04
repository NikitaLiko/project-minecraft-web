import { existsSync, statSync, createReadStream } from 'fs';
import { Readable } from 'stream';
import {
  getLauncherAttachmentFilename,
  getLauncherLocalPath,
  getLauncherRemoteUrl,
} from '@/lib/launcher-storage';

export async function GET() {
  const remote = getLauncherRemoteUrl();
  if (remote) {
    return Response.redirect(remote, 302);
  }

  const filePath = getLauncherLocalPath();
  const attachmentName = getLauncherAttachmentFilename();

  if (!existsSync(filePath)) {
    return Response.json({ error: 'Launcher not available' }, { status: 404 });
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
