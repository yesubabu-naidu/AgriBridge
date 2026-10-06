import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { getUserNameByEmail } from '../services/emailService.js';
import { getJwtSecret } from '../services/authSecurity.js';
import { requireAdmin } from '../middleware/auth.js';

test('1. getUserNameByEmail retrieves full_name from database and never infers from email', async () => {
  // Check with admin account created earlier
  const adminName = await getUserNameByEmail('agribridge.pvt.ltd.com@gmail.com');
  assert.equal(adminName, 'AgriBridge Admin');

  // Check with non-existent email
  const unknownName = await getUserNameByEmail('nonexistent_user_xyz@example.com');
  assert.equal(unknownName, 'User');
  assert.notEqual(unknownName, 'nonexistent_user_xyz');
});

test('2. requireAdmin blocks non-admin users and allows admin', async () => {
  let statusSet = null;
  let jsonResponse = null;
  const mockRes = {
    status(code) {
      statusSet = code;
      return {
        json(payload) {
          jsonResponse = payload;
          return payload;
        }
      };
    }
  };

  // Farmer user -> must be blocked
  let nextCalled = false;
  requireAdmin({ user: { id: 1, role: 'farmer', email: 'farmer@example.com' } }, mockRes, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(statusSet, 403);
  assert.equal(jsonResponse?.message, 'Admin access required');

  // No user -> must be blocked
  statusSet = null;
  jsonResponse = null;
  nextCalled = false;
  requireAdmin({}, mockRes, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(statusSet, 403);

  // Admin user -> must pass
  statusSet = null;
  nextCalled = false;
  requireAdmin({ user: { id: 12, role: 'admin', email: 'agribridge.pvt.ltd.com@gmail.com' } }, mockRes, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(statusSet, null);
});

test('3. Admin user authentication and role verification in database', async () => {
  const email = 'agribridge.pvt.ltd.com@gmail.com';
  const rows = await query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  assert.ok(rows.length > 0, 'Admin user must exist in DB');
  const admin = rows[0];
  assert.equal(admin.role, 'admin');
  assert.equal(admin.status, 'active');

  // Check password verification
  const isMatch = await bcrypt.compare('Admin@123', admin.password_hash || admin.password);
  assert.equal(isMatch, true, 'Admin password must match Admin@123');
});
