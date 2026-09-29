import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET = 'test-only-secret-with-at-least-thirty-two-characters';

const { createAuthRouter } = await import('../routes/auth.js');

const email = 'farmer@example.com';
const oldPassword = 'OldPassword@123';
const newPassword = 'NewPassword@456';

function createHarness() {
  const sentCodes = [];
  const user = { id: 7, name: 'Test Farmer', full_name: 'Test Farmer', email, role: 'farmer', status: 'active', password: null, password_hash: null };
  return bcrypt.hash(oldPassword, 10).then((hash) => {
    user.password = hash;
    user.password_hash = hash;
    const dbQuery = async (sql, params = []) => {
      if (sql.includes('information_schema.columns')) return ['name', 'full_name', 'email', 'password', 'password_hash', 'role', 'phone'].map((column_name) => ({ column_name }));
      if (sql === 'SELECT id FROM users WHERE email = ?') return params[0] === email ? [{ id: user.id }] : [];
      if (sql === 'SELECT * FROM users WHERE email = ?') return params[0] === email ? [{ ...user }] : [];
      if (sql.startsWith('UPDATE users SET')) {
        assert.equal(params.at(-1), user.id);
        user.password = params[0];
        user.password_hash = params[1];
        return { affectedRows: 1 };
      }
      if (sql.includes('farmer_profiles')) return [];
      throw new Error(`Unexpected SQL in test: ${sql}`);
    };
    const app = express();
    app.use(express.json());
    app.use('/auth', createAuthRouter({ dbQuery, sendMail: async (target, otp) => sentCodes.push({ target, otp }) }));
    const server = http.createServer(app);
    return { user, sentCodes, server };
  });
}

async function request(server, path, body) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  await new Promise((resolve) => server.close(resolve));
  return { status: response.status, data };
}

test('forgot-password reset updates both compatible hash columns and new login succeeds', async () => {
  const harness = await createHarness();
  const forgot = await request(harness.server, '/auth/send-otp', { target: email, channel: 'email' });
  assert.equal(forgot.status, 200);
  assert.equal(harness.sentCodes.length, 1);
  const reset = await request(harness.server, '/auth/reset-password', { target: email, otp: harness.sentCodes[0].otp, newPassword });
  assert.equal(reset.status, 200);
  assert.notEqual(harness.user.password_hash, harness.user.password_hash === oldPassword);
  assert.equal(harness.user.password, harness.user.password_hash);
  assert.equal(await bcrypt.compare(newPassword, harness.user.password_hash), true);
  assert.equal(await bcrypt.compare(oldPassword, harness.user.password_hash), false);
  const oldLogin = await request(harness.server, '/auth/login', { email, password: oldPassword });
  assert.equal(oldLogin.status, 401);
  const newLogin = await request(harness.server, '/auth/login', { email, password: newPassword });
  assert.equal(newLogin.status, 200);
  assert.ok(newLogin.data.data.token);
});

test('reset rejects invalid, expired, and reused verification codes', async () => {
  const harness = await createHarness();
  await request(harness.server, '/auth/send-otp', { target: email, channel: 'email' });
  const invalid = await request(harness.server, '/auth/reset-password', { target: email, otp: '000000', newPassword });
  assert.equal(invalid.status, 400);
  const valid = await request(harness.server, '/auth/reset-password', { target: email, otp: harness.sentCodes[0].otp, newPassword });
  assert.equal(valid.status, 200);
  const reused = await request(harness.server, '/auth/reset-password', { target: email, otp: harness.sentCodes[0].otp, newPassword: 'AnotherPass@123' });
  assert.equal(reused.status, 400);

  const expiredHarness = await createHarness();
  await request(expiredHarness.server, '/auth/send-otp', { target: email, channel: 'email' });
  const originalNow = Date.now;
  Date.now = () => originalNow() + (11 * 60 * 1000);
  try {
    const expired = await request(expiredHarness.server, '/auth/reset-password', { target: email, otp: expiredHarness.sentCodes[0].otp, newPassword });
    assert.equal(expired.status, 400);
  } finally {
    Date.now = originalNow;
  }
});

test('forgot password response does not reveal whether an account exists', async () => {
  const harness = await createHarness();
  const known = await request(harness.server, '/auth/send-otp', { target: email, channel: 'email' });
  const unknown = await request(harness.server, '/auth/send-otp', { target: 'missing@example.com', channel: 'email' });
  assert.equal(known.status, 200);
  assert.equal(unknown.status, 200);
  assert.equal(known.data.message, unknown.data.message);
  assert.equal(harness.sentCodes.length, 1);
});
