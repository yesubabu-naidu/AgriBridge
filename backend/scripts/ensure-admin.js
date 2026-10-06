import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export async function ensureAdminUser() {
  const email = 'agribridge.pvt.ltd.com@gmail.com';
  const rawPass = process.env.ADMIN_SEED_PASSWORD || 'Admin@123';
  const hash = await bcrypt.hash(rawPass, 10);
  const existing = await query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  if (existing.length) {
    await query('UPDATE users SET password = ?, password_hash = ?, role = ?, status = ? WHERE id = ?', [hash, hash, 'admin', 'active', existing[0].id]);
    console.log('Admin account verified with id:', existing[0].id);
    return existing[0].id;
  } else {
    const result = await query('INSERT INTO users (full_name, email, password, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)', ['AgriBridge Admin', email, hash, hash, 'admin', 'active']);
    console.log('Admin account created with id:', result.insertId);
    return result.insertId;
  }
}

if (process.argv[1] && process.argv[1].endsWith('ensure-admin.js')) {
  ensureAdminUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to ensure admin user:', err);
      process.exit(1);
    });
}
