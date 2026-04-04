/**
 * Метаданные файла по публичному URL (R2 / CDN).
 */
export async function fetchLauncherRemoteMeta(url: string): Promise<{
  ok: boolean;
  size: number | null;
  updatedAt: string | null;
}> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 12_000);
  try {
    let res = await fetch(url, { method: 'HEAD', signal: ac.signal, cache: 'no-store' });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: ac.signal,
        cache: 'no-store',
      });
    }
    if (!res.ok) {
      return { ok: false, size: null, updatedAt: null };
    }
    const len = res.headers.get('content-length');
    const sizeFromContentRange = res.headers.get('content-range')?.split('/')[1];
    let size: number | null = null;
    if (len) size = parseInt(len, 10);
    else if (sizeFromContentRange && /^\d+$/.test(sizeFromContentRange)) {
      size = parseInt(sizeFromContentRange, 10);
    }
    const lm = res.headers.get('last-modified');
    return { ok: true, size: Number.isFinite(size as number) ? size : null, updatedAt: lm };
  } catch {
    return { ok: false, size: null, updatedAt: null };
  } finally {
    clearTimeout(timer);
  }
}
