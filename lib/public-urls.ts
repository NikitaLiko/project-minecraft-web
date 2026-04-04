/**
 * Публичные ссылки на основной сайт и магазин.
 * После переноса на Cloudflare задайте в Pages/Workers:
 *   NEXT_PUBLIC_MAIN_SITE_URL, NEXT_PUBLIC_SHOP_URL
 */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

const DEFAULT_MAIN = 'https://pjm.likonchik.xyz';
const DEFAULT_SHOP = 'https://shop.likonchik.xyz';

export const MAIN_SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_MAIN_SITE_URL?.trim() || DEFAULT_MAIN
);

export const SHOP_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SHOP_URL?.trim() || DEFAULT_SHOP
);

/** Источники для CSP img-src (полные origin), включая основной сайт и магазин. */
export function cspImageOrigins(): string[] {
  const urls = [MAIN_SITE_URL, SHOP_URL];
  const extra =
    process.env.NEXT_PUBLIC_CSP_IMG_EXTRA?.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean) ??
    [];
  const origins = new Set<string>();
  for (const u of [...urls, ...extra]) {
    try {
      origins.add(new URL(u).origin);
    } catch {
      /* ignore invalid */
    }
  }
  return [...origins];
}
