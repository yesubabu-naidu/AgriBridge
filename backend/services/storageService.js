import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
export const ALLOWED_MIME_TYPES = new Set(
  (process.env.ALLOWED_UPLOAD_MIME_TYPES || 'image/jpeg,image/png,image/webp,image/gif,application/pdf')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

export function isStorageConfigured() {
  return Boolean(cloudName && apiKey && apiSecret);
}

function requireStorage() {
  if (!isStorageConfigured()) {
    const error = new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the backend.');
    error.code = 'STORAGE_NOT_CONFIGURED';
    throw error;
  }
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
  const suffix = `${crypto.randomUUID()}${extension}`;
  return `agribridge/${safeScope}/${safeOwner}/${safeRecord}/${suffix}`;
}

export function makeDeterministicPublicId({ scope, ownerId, recordId, originalName, buffer }) {
  const digest = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 24);
  const extension = path.extname(originalName || '').toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10);
  return `agribridge/migrated/${scope}/${ownerId || 'unknown'}/${recordId}/${digest}${extension}`;
}

export function uploadBuffer({ buffer, contentType, originalName, publicId, overwrite = false, deliveryType = 'upload' }) {
  requireStorage();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite,
        unique_filename: false,
        use_filename: false,
        resource_type: 'auto',
        type: deliveryType,
        invalidate: true,
        context: originalName ? { original_filename: String(originalName).slice(0, 200) } : undefined
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          url: result.secure_url || result.url,
          publicId: result.public_id,
          resourceType: result.resource_type || 'image',
          bytes: result.bytes || buffer.length,
          format: result.format || null,
          provider: 'cloudinary',
          contentType
        });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteObject(publicId, resourceType = 'image', deliveryType = 'upload') {
  if (!publicId) return;
  requireStorage();
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType || 'image',
    type: deliveryType || 'upload',
    invalidate: true
  });
}

export function getStoredAssetUrl(url, publicId, resourceType = 'image', deliveryType = 'upload') {
  if (url) return url;
  if (!publicId) return null;
  return cloudinary.url(publicId, { secure: true, resource_type: resourceType || 'image', type: deliveryType || 'upload' });
}

export function getCloudinaryClient() {
  return cloudinary;
}
