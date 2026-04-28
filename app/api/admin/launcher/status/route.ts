import { existsSync, statSync } from 'fs';
import { verifyAdmin } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import {
  getLauncherCdnUrl,
  getLauncherExplicitDownloadUrl,
  getLauncherLocalPath,
  resolvePublicDropLauncher,
} from '@/lib/launcher-storage';
import { fetchLauncherRemoteMeta } from '@/lib/launcher-remote-meta';

export async function GET() {
  if (!(await verifyAdmin()).valid) {
    return errorResponse('Access Denied', 403);
  }

  const explicit = getLauncherExplicitDownloadUrl();
  if (explicit) {
    const meta = await fetchLauncherRemoteMeta(explicit);
    if (!meta.ok) {
      return successResponse({
        exists: false,
        remoteUrl: explicit,
        size: null,
        sizeMB: null,
        updatedAt: null,
        hint: 'Проверьте LAUNCHER_DOWNLOAD_URL / R2 и публичный доступ к объекту',
      });
    }
    const sizeMB = meta.size != null ? meta.size / (1024 * 1024) : null;
    return successResponse({
      exists: true,
      remote: true,
      remoteUrl: explicit,
      size: meta.size,
      sizeMB: sizeMB != null ? Math.round(sizeMB * 100) / 100 : null,
      updatedAt: meta.updatedAt,
    });
  }

  const drop = resolvePublicDropLauncher();
  if (drop) {
    const stat = statSync(drop.absPath);
    const sizeMB = stat.size / (1024 * 1024);
    return successResponse({
      exists: true,
      remote: false,
      publicPath: drop.urlPath,
      hint: 'Файл в public/launcher на диске — скачивание через nginx, без загрузки через админку',
      size: stat.size,
      sizeMB: Math.round(sizeMB * 100) / 100,
      updatedAt: stat.mtime.toISOString(),
    });
  }

  const cdn = getLauncherCdnUrl();
  if (cdn) {
    const meta = await fetchLauncherRemoteMeta(cdn);
    if (!meta.ok) {
      return successResponse({
        exists: false,
        remoteUrl: cdn,
        size: null,
        sizeMB: null,
        updatedAt: null,
        hint: 'Проверьте LAUNCHER_PUBLIC_URL_BASE / ключ объекта и публичный доступ к CDN',
      });
    }
    const sizeMB = meta.size != null ? meta.size / (1024 * 1024) : null;
    return successResponse({
      exists: true,
      remote: true,
      remoteUrl: cdn,
      size: meta.size,
      sizeMB: sizeMB != null ? Math.round(sizeMB * 100) / 100 : null,
      updatedAt: meta.updatedAt,
    });
  }

  const filePath = getLauncherLocalPath();

  if (!existsSync(filePath)) {
    return successResponse({ exists: false, remote: false, size: null, sizeMB: null });
  }

  const stat = statSync(filePath);
  const sizeMB = stat.size / (1024 * 1024);

  return successResponse({
    exists: true,
    remote: false,
    size: stat.size,
    sizeMB: Math.round(sizeMB * 100) / 100,
    updatedAt: stat.mtime.toISOString(),
  });
}
