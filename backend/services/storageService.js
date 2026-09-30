import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });

const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'AgriBridge';

export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
export const ALLOWED_MIME_TYPES = new Set(
  (process.env.ALLOWED_UPLOAD_MIME_TYPES || 'image/jpeg,image/png,image/webp,image/gif,application/pdf')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

export function isStorageConfigured() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey && bucketName);
}

function requireStorage() {
  if (!isStorageConfigured()) {
    const error = new Error(
      'Supabase Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET on the backend.'
    );
    error.code = 'STORAGE_NOT_CONFIGURED';
    throw error;
  }
}

function storageHeaders(extra = {}) {
  requireStorage();
  return {
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    apikey: supabaseServiceRoleKey,
    ...extra
  };
}

function normalizeObjectPath(value) {
  return String(value || '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
}

export function validateUpload(file) {
  if (!file) return;
  if (!ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())) {
    const error = new Error('Unsupported file type. Allowed types are JPEG, PNG, WebP, GIF, and PDF.');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }
  if (file.size > MAX_FILE_SIZE) {
    const error = new Error(`File is too large. The maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`);
    error.code = 'FILE_TOO_LARGE';
    throw error;
  }
}

export function makePublicId({ scope, ownerId, recordId, originalName }) {
  const extension = path.extname(String(originalName || '')).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10);
  const safeScope = String(scope || 'files').replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'files';
  const safeOwner = String(ownerId || 'unknown').replace(/[^a-z0-9_-]/gi, '') || 'unknown';
  const safeRecord = String(recordId || 'unassigned').replace(/[^a-z0-9_-]/gi, '') || 'unassigned';
  return `agribridge/${safeScope}/${safeOwner}/${safeRecord}/${crypto.randomUUID()}${extension}`;
}

export function makeDeterministicPublicId({ scope, ownerId, recordId, originalName, buffer }) {
  const digest = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 24);
  const extension = path.extname(originalName || '').toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10);
  return `agribridge/migrated/${scope}/${ownerId || 'unknown'}/${recordId}/${digest}${extension}`;
}

export async function uploadBuffer({
  buffer,
  contentType,
  originalName,
  publicId,
  overwrite = false
}) {
  requireStorage();

  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('uploadBuffer requires a Buffer.');
  }

  const objectPath = normalizeObjectPath(publicId);
  if (!objectPath) {
    throw new Error('A valid Supabase Storage object path is required.');
  }

  const endpoint = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucketName)}/${objectPath}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: storageHeaders({
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': overwrite ? 'true' : 'false',
      'cache-control': '3600'
    }),
    body: buffer
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(`Supabase Storage upload failed (${response.status}): ${responseText.slice(0, 500)}`);
    error.status = response.status;
    throw error;
  }

  return {
    url: getPublicObjectUrl(objectPath),
    publicId: objectPath,
    resourceType: contentType === 'application/pdf' ? 'raw' : 'image',
    bytes: buffer.length,
    format: path.extname(originalName || '').replace('.', '').toLowerCase() || null,
    provider: 'supabase',
    contentType
  };
}

export async function deleteObject(publicId) {
  if (!publicId) return;
  requireStorage();

  const objectPath = normalizeObjectPath(publicId);
  const endpoint = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucketName)}/${objectPath}`;

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: storageHeaders()
  });

  if (!response.ok && response.status !== 404) {
    const responseText = await response.text();
    const error = new Error(`Supabase Storage delete failed (${response.status}): ${responseText.slice(0, 500)}`);
    error.status = response.status;
    throw error;
  }
}

function getPublicObjectUrl(objectPath) {
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucketName)}/${objectPath}`;
}

export function getStoredAssetUrl(url, publicId) {
  if (url) return url;
  if (!publicId || !isStorageConfigured()) return null;
  return getPublicObjectUrl(normalizeObjectPath(publicId));
}

export function getSupabaseStorageConfig() {
  return {
    url: supabaseUrl,
    bucket: bucketName
  };
}
