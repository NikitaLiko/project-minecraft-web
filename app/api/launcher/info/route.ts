import { NextResponse } from 'next/server';
import {
  getLauncherAttachmentFilename,
  getLauncherCdnUrl,
  getLauncherExplicitDownloadUrl,
  getLauncherLocalPath,
  resolvePublicDropLauncher,
} from '@/lib/launcher-storage';
import { existsSync, statSync } from 'fs';

/** Публично: куда вести кнопку «скачать» и под каким именем. */
export async function GET() {
  const explicit = getLauncherExplicitDownloadUrl();
  if (explicit) {
    return NextResponse.json({
      source: 'remote',
      downloadUrl: explicit,
      filename: getLauncherAttachmentFilename(),
    });
  }

  const drop = resolvePublicDropLauncher();
  if (drop) {
    const stat = statSync(drop.absPath);
    return NextResponse.json({
      source: 'public',
      /** Через API: не зависит от nginx location для /launcher/ */
      downloadUrl: '/api/launcher/download',
      staticUrl: drop.urlPath,
      filename: drop.filename,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  }

  const cdn = getLauncherCdnUrl();
  if (cdn) {
    return NextResponse.json({
      source: 'remote',
      downloadUrl: cdn,
      filename: getLauncherAttachmentFilename(),
    });
  }

  const filename = getLauncherAttachmentFilename();
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
