import { existsSync, statSync } from 'fs';
import { verifyAdmin } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { getLauncherLocalPath, getLauncherRemoteUrl } from '@/lib/launcher-storage';
import { fetchLauncherRemoteMeta } from '@/lib/launcher-remote-meta';

export async function GET() {
  if (!(await verifyAdmin()).valid) {
    return errorResponse('Access Denied', 403);
  }

  const remote = getLauncherRemoteUrl();
  if (remote) {
    const meta = await fetchLauncherRemoteMeta(remote);
    if (!meta.ok) {
      return successResponse({
        exists: false,
        remoteUrl: remote,
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
      remoteUrl: remote,
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
