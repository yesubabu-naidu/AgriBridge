import crypto from 'crypto';
import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { makeDeterministicPublicId, uploadBuffer, validateUpload, deleteObject } from '../services/storageService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const localRoot = path.resolve(process.env.LOCAL_UPLOADS_DIR || path.join(__dirname, '../uploads'));
const report = { scanned: 0, migrated: 0, skipped: 0, failed: [] };

function mimeExtension(mime) {
  return ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' })[mime] || '';
}

async function readLegacyValue(value, fallbackName) {
  const raw = String(value || '').trim();
  const dataUrl = raw.match(/^data:([^;,]+);base64,(.+)$/s);
  if (dataUrl) {
    return {
      buffer: Buffer.from(dataUrl[2], 'base64'),
      contentType: dataUrl[1].toLowerCase(),
      originalName: `${fallbackName}${mimeExtension(dataUrl[1].toLowerCase())}`
    };
  }
  if (!raw || /^https?:\/\//i.test(raw)) return null;
  const relativePath = raw.replace(/^file:\/\//i, '').replace(/^\/+/, '');
  const candidate = path.resolve(localRoot, relativePath.replace(/^uploads[\\/]/i, ''));
  if (candidate !== localRoot && !candidate.startsWith(`${localRoot}${path.sep}`)) {
    throw new Error(`Refusing to read a file outside LOCAL_UPLOADS_DIR: ${raw}`);
  }
  const buffer = await fs.readFile(candidate);
  const extension = path.extname(candidate).toLowerCase();
  const contentType = ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf' })[extension];
  if (!contentType) throw new Error(`Unsupported legacy file extension: ${extension}`);
  return { buffer, contentType, originalName: path.basename(candidate) };
}

async function migrateRow({ connection, table, id, ownerId, value, publicIdColumn, resourceTypeColumn, urlColumn, metadataColumns, scope }) {
  report.scanned += 1;
  let uploaded;
  try {
    const legacy = await readLegacyValue(value, `legacy-${scope}-${id}`);
    if (!legacy) {
      report.skipped += 1;
      return;
    }
    validateUpload({ mimetype: legacy.contentType, size: legacy.buffer.length });
    const publicId = makeDeterministicPublicId({ scope, ownerId, recordId: id, originalName: legacy.originalName, buffer: legacy.buffer });
    uploaded = await uploadBuffer({ publicId, buffer: legacy.buffer, contentType: legacy.contentType, originalName: legacy.originalName, overwrite: true });
    const [result] = await connection.execute(
      `UPDATE ${table} SET ${urlColumn} = ?, ${publicIdColumn} = ?, ${resourceTypeColumn} = ?, ${metadataColumns.original} = ?, ${metadataColumns.mime} = ?, ${metadataColumns.size} = ?, ${metadataColumns.provider} = 'cloudinary' WHERE id = ? AND ${publicIdColumn} IS NULL`,
      [uploaded.url, uploaded.publicId, uploaded.resourceType, legacy.originalName, legacy.contentType, legacy.buffer.length, id]
    );
    if (result.affectedRows !== 1) throw new Error('MySQL row was not updated; the source may already be migrated.');
    report.migrated += 1;
    console.log(`Migrated ${table}#${id} -> ${uploaded.publicId}`);
  } catch (error) {
    if (uploaded?.publicId) {
      try { await deleteObject(uploaded.publicId, uploaded.resourceType); } catch {}
    }
    report.failed.push({ table, id, error: error.message });
    console.error(`Failed ${table}#${id}: ${error.message}`);
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agribridge'
  });
  try {
    const [landImages] = await connection.execute('SELECT id, land_id, image_url FROM land_images WHERE image_url IS NOT NULL AND cloudinary_public_id IS NULL');
    for (const row of landImages) {
      const [lands] = await connection.execute('SELECT landowner_id FROM lands WHERE id = ?', [row.land_id]);
      await migrateRow({ connection, table: 'land_images', id: row.id, ownerId: lands[0]?.landowner_id, value: row.image_url, publicIdColumn: 'cloudinary_public_id', resourceTypeColumn: 'cloudinary_resource_type', urlColumn: 'image_url', metadataColumns: { original: 'original_file_name', mime: 'mime_type', size: 'file_size', provider: 'storage_provider' }, scope: 'lands' });
    }

    const [products] = await connection.execute('SELECT id, farmer_id, image_url FROM products WHERE image_url IS NOT NULL AND image_cloudinary_public_id IS NULL');
    for (const row of products) {
      await migrateRow({ connection, table: 'products', id: row.id, ownerId: row.farmer_id, value: row.image_url, publicIdColumn: 'image_cloudinary_public_id', resourceTypeColumn: 'image_cloudinary_resource_type', urlColumn: 'image_url', metadataColumns: { original: 'image_original_file_name', mime: 'image_mime_type', size: 'image_file_size', provider: 'image_storage_provider' }, scope: 'products' });
    }

    const [columns] = await connection.execute('SHOW COLUMNS FROM users');
    const names = new Set(columns.map((column) => column.Field));
    const avatarColumn = names.has('avatar_url') ? 'avatar_url' : names.has('avatar') ? 'avatar' : null;
    if (!avatarColumn) throw new Error('The users table must contain avatar or avatar_url.');
    const [users] = await connection.execute("SELECT id, " + avatarColumn + " AS avatar FROM users WHERE " + avatarColumn + " IS NOT NULL AND avatar_cloudinary_public_id IS NULL");
    for (const row of users) {
      await migrateRow({ connection, table: 'users', id: row.id, ownerId: row.id, value: row.avatar, publicIdColumn: 'avatar_cloudinary_public_id', resourceTypeColumn: 'avatar_cloudinary_resource_type', urlColumn: avatarColumn, metadataColumns: { original: 'avatar_original_file_name', mime: 'avatar_mime_type', size: 'avatar_file_size', provider: 'avatar_storage_provider' }, scope: 'avatars' });
    }
  } finally {
    await connection.end();
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Cloudinary migration failed: ${error.message}`);
  process.exitCode = 1;
});
