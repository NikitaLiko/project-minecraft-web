import path from 'path';

/**
 * Лаунчер в проде на Cloudflare: локальный диск недоступен для записи и часто пуст.
 * Задайте полный URL файла или пару LAUNCHER_PUBLIC_URL_BASE + LAUNCHER_R2_OBJECT_KEY.
 */
export function getLauncherRemoteUrl(): string | null {
  const explicit = process.env.LAUNCHER_DOWNLOAD_URL?.trim();
  if (explicit) return explicit;

  const base = process.env.LAUNCHER_PUBLIC_URL_BASE?.trim().replace(/\/+$/, '');
  const key = (process.env.LAUNCHER_R2_OBJECT_KEY || 'launcher/pjm-launcher.zip')
    .trim()
    .replace(/^\/+/, '');
  if (base) return `${base}/${key}`;

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
