import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

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
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agribridge',
    waitForConnections: true,
    connectionLimit: 2
  });
  try {
    const [columns] = await pool.execute('SHOW COLUMNS FROM users');
    const names = new Set(columns.map((column) => column.Field));
    const avatarColumn = names.has('avatar_url') ? 'avatar_url' : names.has('avatar') ? 'avatar' : null;
    if (!avatarColumn) throw new Error('The users table must contain avatar or avatar_url.');
    const [users] = await pool.execute("SELECT id, " + avatarColumn + " AS avatar FROM users");
    const [landImages] = await pool.execute('SELECT id, image_url FROM land_images');
    const [products] = await pool.execute('SELECT id, image_url FROM products');
    const result = {
      users_avatar: { column: avatarColumn, ...summarize(users, 'avatar') },
      land_images_image_url: summarize(landImages, 'image_url'),
      products_image_url: summarize(products, 'image_url')
    };
    console.log(JSON.stringify(result, null, 2));
    console.log('Base64 rows are eligible for the Cloudinary migration. HTTPS URLs are existing remote assets and are left unchanged.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Database inspection failed: ${error.message}`);
  process.exitCode = 1;
});
