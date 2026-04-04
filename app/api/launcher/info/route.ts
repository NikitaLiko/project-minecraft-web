import { NextResponse } from 'next/server';
import {
  getLauncherAttachmentFilename,
  getLauncherRemoteUrl,
  getLauncherLocalPath,
} from '@/lib/launcher-storage';
import { existsSync, statSync } from 'fs';

/** Публично: куда вести кнопку «скачать» и под каким именем. */
export async function GET() {
  const filename = getLauncherAttachmentFilename();
  const remote = getLauncherRemoteUrl();
  if (remote) {
    return NextResponse.json({
      source: 'remote',
      downloadUrl: remote,
      filename,
    });
  }

  const localPath = getLauncherLocalPath();
  if (existsSync(localPath)) {
    const stat = statSync(localPath);
    return NextResponse.json({
      source: 'local',
      downloadUrl: '/api/launcher/download',
      filename,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  }

  return NextResponse.json({
    source: 'none',
    downloadUrl: '/api/launcher/download',
    filename,
  });
}
