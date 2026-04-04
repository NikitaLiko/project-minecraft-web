import { mkdir, writeFile } from 'fs/promises';
import { verifyAdmin } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import {
  getLauncherLocalDir,
  getLauncherLocalPath,
  getLauncherR2ObjectKey,
  isR2UploadConfigured,
} from '@/lib/launcher-storage';

const MAX_SIZE_MB = 150;

const ALLOWED_EXT = new Set(['.exe', '.zip', '.7z']);

function contentTypeForName(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith('.zip')) return 'application/zip';
  if (n.endsWith('.7z')) return 'application/x-7z-compressed';
  return 'application/octet-stream';
}

async function uploadToR2(buffer: Buffer, contentType: string): Promise<void> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const accountId = process.env.LAUNCHER_R2_ACCOUNT_ID!.trim();
  const bucket = process.env.LAUNCHER_R2_BUCKET!.trim();
  const accessKeyId = process.env.LAUNCHER_R2_ACCESS_KEY_ID!.trim();
  const secretAccessKey = process.env.LAUNCHER_R2_SECRET_ACCESS_KEY!.trim();

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: getLauncherR2ObjectKey(),
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function POST(req: Request) {
  if (!(await verifyAdmin()).valid) {
    return errorResponse('Access Denied', 403);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    const original = (file.name || '').toLowerCase();
    const dot = original.lastIndexOf('.');
    const ext = dot >= 0 ? original.slice(dot) : '';
    if (!ALLOWED_EXT.has(ext)) {
      return errorResponse('Allowed: .exe, .zip, .7z', 400);
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return errorResponse(`File too large (max ${MAX_SIZE_MB} MB)`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ct = contentTypeForName(original);

    if (isR2UploadConfigured()) {
      await uploadToR2(buffer, ct);
      return successResponse({
        message: 'Launcher uploaded to R2',
        size: file.size,
        sizeMB: Math.round(sizeMB * 100) / 100,
        key: getLauncherR2ObjectKey(),
      });
    }

    const dir = getLauncherLocalDir();
    await mkdir(dir, { recursive: true });
    const destPath = getLauncherLocalPath();
    await writeFile(destPath, buffer);

    return successResponse({
      message: 'Launcher saved locally',
      size: file.size,
      sizeMB: Math.round(sizeMB * 100) / 100,
    });
  } catch (err) {
    console.error('Launcher upload error:', err);
    return errorResponse('Upload failed', 500);
  }
}
