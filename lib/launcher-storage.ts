import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';

function isNextStandaloneCwd(cwd: string): boolean {
  return path.basename(cwd) === 'standalone' && existsSync(path.join(cwd, 'server.js'));
}

/**
 * Ручная выкладка: положите .exe/.zip/.7z в `public/launcher/` на сервере — отдаётся nginx’ом как статика
 * (без лимита тела запроса на загрузку через админку). Имя файла можно зафиксировать: LAUNCHER_PUBLIC_DROP_FILENAME.
 */
export const LAUNCHER_PUBLIC_DIR_SEGMENT = 'launcher';

const DROP_EXT = new Set(['.exe', '.zip', '.7z']);

/**
 * Каталог(и), где лежит лаунчер для статики.
 * В проде с `output: "standalone"` процесс часто стартует из `.next/standalone`, а файлы кладут в `/root/warborn/public/launcher`.
 */
export function getLauncherPublicDropDirCandidates(): string[] {
  const env = process.env.LAUNCHER_PUBLIC_DROP_DIR?.trim();
  if (env) return [path.resolve(env)];

  const cwd = process.cwd();
  const nested = path.resolve(cwd, 'public', LAUNCHER_PUBLIC_DIR_SEGMENT);

  if (isNextStandaloneCwd(cwd)) {
    const repoPublic = path.resolve(cwd, '..', '..', 'public', LAUNCHER_PUBLIC_DIR_SEGMENT);
    if (repoPublic === nested) return [nested];
    return [repoPublic, nested];
  }

  return [nested];
}

/** Первый существующий кандидат или основной путь по cwd (для подсказок). */
export function getLauncherPublicDropDir(): string {
  for (const d of getLauncherPublicDropDirCandidates()) {
    if (existsSync(d)) return d;
  }
  const list = getLauncherPublicDropDirCandidates();
  return list[0] ?? path.resolve(process.cwd(), 'public', LAUNCHER_PUBLIC_DIR_SEGMENT);
}

export type ResolvedPublicLauncher = {
  absPath: string;
  /** Путь для ссылки с сайта, например /launcher/MySetup.exe */
  urlPath: string;
  filename: string;
};

/**
 * Явный URL из env (полный), без проверки существования.
 */
export function getLauncherExplicitDownloadUrl(): string | null {
  const u = process.env.LAUNCHER_DOWNLOAD_URL?.trim();
  return u || null;
}

/**
 * URL на CDN/R2: LAUNCHER_PUBLIC_URL_BASE + LAUNCHER_R2_OBJECT_KEY.
 */
export function getLauncherCdnUrl(): string | null {
  const base = process.env.LAUNCHER_PUBLIC_URL_BASE?.trim().replace(/\/+$/, '');
  const key = (process.env.LAUNCHER_R2_OBJECT_KEY || 'launcher/pjm-launcher.zip')
    .trim()
    .replace(/^\/+/, '');
  if (base) return `${base}/${key}`;
  return null;
}

/**
 * Лаунчер в проде на Cloudflare: локальный диск недоступен для записи и часто пуст.
 * Задайте полный URL файла или пару LAUNCHER_PUBLIC_URL_BASE + LAUNCHER_R2_OBJECT_KEY.
 */
export function getLauncherRemoteUrl(): string | null {
  return getLauncherExplicitDownloadUrl() || getLauncherCdnUrl();
}

function isAllowedDropName(name: string): boolean {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0) return false;
  return DROP_EXT.has(lower.slice(dot));
}

function resolvePublicDropLauncherInDir(dir: string): ResolvedPublicLauncher | null {
  if (!existsSync(dir)) return null;

  const preferred = process.env.LAUNCHER_PUBLIC_DROP_FILENAME?.trim();
  if (preferred) {
    const abs = path.join(dir, path.basename(preferred));
    if (existsSync(abs) && isAllowedDropName(preferred)) {
      const name = path.basename(preferred);
      return {
        absPath: abs,
        urlPath: `/${LAUNCHER_PUBLIC_DIR_SEGMENT}/${encodeURIComponent(name)}`,
        filename: name,
      };
    }
  }

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }

  const files = entries.filter((name) => {
    if (name.startsWith('.') || name === '.gitkeep') return false;
    try {
      const abs = path.join(dir, name);
      return statSync(abs).isFile() && isAllowedDropName(name);
    } catch {
      return false;
    }
  });

  if (files.length === 0) return null;
  if (files.length === 1) {
    const name = files[0];
    const abs = path.join(dir, name);
    return {
      absPath: abs,
      urlPath: `/${LAUNCHER_PUBLIC_DIR_SEGMENT}/${encodeURIComponent(name)}`,
      filename: name,
    };
  }

  let best = files[0];
  let bestM = statSync(path.join(dir, best)).mtimeMs;
  for (let i = 1; i < files.length; i++) {
    const name = files[i];
    const m = statSync(path.join(dir, name)).mtimeMs;
    if (m > bestM) {
      best = name;
      bestM = m;
    }
  }
  const abs = path.join(dir, best);
  return {
    absPath: abs,
    urlPath: `/${LAUNCHER_PUBLIC_DIR_SEGMENT}/${encodeURIComponent(best)}`,
    filename: best,
  };
}

/**
 * Файл в public/launcher/ для статической отдачи (приоритет выше CDN, ниже LAUNCHER_DOWNLOAD_URL).
 */
export function resolvePublicDropLauncher(): ResolvedPublicLauncher | null {
  for (const dir of getLauncherPublicDropDirCandidates()) {
    const r = resolvePublicDropLauncherInDir(dir);
    if (r) return r;
  }
  return null;
}

/** Имя файла на локальном диске (dev / свой VPS). */
export function getLauncherLocalFilename(): string {
  return process.env.LAUNCHER_LOCAL_FILENAME?.trim() || 'launcher.zip';
}

export function getLauncherLocalDir(): string {
  return process.env.LAUNCHER_DIR || path.join(process.cwd(), 'data', 'launcher');
}

export function getLauncherLocalPath(): string {
  return path.join(getLauncherLocalDir(), getLauncherLocalFilename());
}

/** Имя для подсказки браузеру при скачивании. */
export function getLauncherAttachmentFilename(): string {
  return process.env.LAUNCHER_ATTACHMENT_FILENAME?.trim() || 'PJM-Launcher.zip';
}

export function isR2UploadConfigured(): boolean {
  return Boolean(
    process.env.LAUNCHER_R2_ACCOUNT_ID?.trim() &&
      process.env.LAUNCHER_R2_ACCESS_KEY_ID?.trim() &&
      process.env.LAUNCHER_R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.LAUNCHER_R2_BUCKET?.trim()
  );
}

export function getLauncherR2ObjectKey(): string {
  return (process.env.LAUNCHER_R2_OBJECT_KEY || 'launcher/pjm-launcher.zip').trim().replace(/^\/+/, '');
}
