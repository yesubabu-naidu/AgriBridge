import { query } from '../config/db.js';

function classify(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'empty';
  if (/^data:[^;,]+;base64,/i.test(raw)) return 'base64-data-url';
  if (/^https?:\/\//i.test(raw)) return 'http-url';
  if (/^(file:\/\/|\.?\.?[\\/]|[a-z]:[\\/]|\/)/i.test(raw)) return 'local-path';
  return 'other';
}

function summarize(rows, field) {
  const counts = {};
  for (const row of rows) {
    const type = classify(row[field]);
    counts[type] = (counts[type] || 0) + 1;
  }
  return { rows: rows.length, counts };
}

async function main() {
  try {
    const columns = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    const names = new Set(columns.map((column) => column.column_name));
    const avatarColumn = names.has('avatar_url') ? 'avatar_url' : names.has('avatar') ? 'avatar' : null;
    if (!avatarColumn) throw new Error('The users table must contain avatar or avatar_url.');

    const users = await query(`SELECT id, ${avatarColumn} AS avatar FROM users`);
    const landImages = await query('SELECT id, image_url FROM land_images');
    const products = await query('SELECT id, image_url FROM products');

    const result = {
      users_avatar: { column: avatarColumn, ...summarize(users, 'avatar') },
      land_images_image_url: summarize(landImages, 'image_url'),
      products_image_url: summarize(products, 'image_url')
    };
    console.log(JSON.stringify(result, null, 2));
    console.log('Base64 rows are eligible for the Cloudinary migration. HTTPS URLs are existing remote assets and are left unchanged.');
  } catch (error) {
    console.error(`Database inspection failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
