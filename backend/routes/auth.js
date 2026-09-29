import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { getStoredAssetUrl } from '../services/storageService.js';
import { authenticateToken } from '../middleware/auth.js';
import { BCRYPT_ROUNDS, getJwtSecret, getStoredPasswordHash, isValidEmail, normalizeEmail, passwordFingerprint, validatePassword } from '../services/authSecurity.js';

const OTP_TTL_MS = 10 * 60 * 1000;

function limiter(windowMs, maximum) {
  const attempts = new Map();
  return (key) => {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.expiresAt <= now) {
      attempts.set(key, { count: 1, expiresAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > maximum;
  };
}

function requestKey(req, value = '') {
  return `${req.ip || req.socket?.remoteAddress || 'unknown'}:${value}`;
}

function hashOtp(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function validOtp(value, expectedHash) {
  const actual = Buffer.from(hashOtp(value), 'hex');
  const expected = Buffer.from(expectedHash || '', 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function deliverCode(email, otp, subject, message) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Email delivery is not configured.');
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transporter.sendMail({ from: `"AgriBridge Support" <${user}>`, to: email, subject, text: `${message} ${otp}. This code expires in 10 minutes.` });
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name || user.name, passwordFingerprint: passwordFingerprint(getStoredPasswordHash(user)) },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(user, profile = {}) {
  return {
    id: user.id,
    full_name: user.full_name || user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar || (user.avatar_cloudinary_public_id ? getStoredAssetUrl(user.avatar, user.avatar_cloudinary_public_id, user.avatar_cloudinary_resource_type) : user.avatar_url),
    ...profile
  };
}

export function createAuthRouter({ dbQuery = query, sendMail = deliverCode } = {}) {
  const router = express.Router();
  const resetCodes = new Map();
  const registrationCodes = new Map();
  const tooManyLogins = limiter(15 * 60 * 1000, 5);
  const tooManyResets = limiter(60 * 60 * 1000, 3);
  let userColumns;

  async function columns() {
    if (userColumns) return userColumns;
    const rows = await dbQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    userColumns = new Set(rows.map((row) => String(row.column_name || row.COLUMN_NAME || row.Field || '').toLowerCase()));
    return userColumns;
  }

  async function insertUser({ full_name, email, password, role, phone }) {
    const cleanEmail = normalizeEmail(email);
    if (!full_name || full_name.trim().length < 3 || !isValidEmail(cleanEmail) || !['farmer', 'buyer', 'landowner'].includes(role)) throw Object.assign(new Error('Please provide valid registration details.'), { status: 400 });
    const passwordError = validatePassword(password);
    if (passwordError) throw Object.assign(new Error(passwordError), { status: 400 });
    if ((await dbQuery('SELECT id FROM users WHERE email = ?', [cleanEmail])).length) throw Object.assign(new Error('An account with this email address already exists.'), { status: 409 });
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const fields = ['full_name', 'email', 'role', 'phone'];
    const values = [full_name.trim(), cleanEmail, role, String(phone || '').trim()];
    const available = await columns();
    if (available.has('name')) { fields.unshift('name'); values.unshift(full_name.trim()); }
    if (available.has('password')) { fields.splice(fields.indexOf('role'), 0, 'password'); values.splice(values.indexOf(role), 0, passwordHash); }
    if (available.has('password_hash')) { fields.splice(fields.indexOf('role'), 0, 'password_hash'); values.splice(values.indexOf(role), 0, passwordHash); }
    const result = await dbQuery(`INSERT INTO users (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, values);
    if (role === 'farmer') await dbQuery('INSERT INTO farmer_profiles (user_id) VALUES (?)', [result.insertId]);
    if (role === 'buyer') await dbQuery('INSERT INTO buyer_profiles (user_id) VALUES (?)', [result.insertId]);
    if (role === 'landowner') await dbQuery('INSERT INTO landowner_profiles (user_id) VALUES (?)', [result.insertId]);
    return { id: result.insertId, full_name: full_name.trim(), email: cleanEmail, role, phone: String(phone || '').trim(), password: passwordHash, password_hash: passwordHash };
  }

  router.post('/register', async (req, res) => {
    try {
      const user = await insertUser(req.body || {});
      return res.status(201).json({ success: true, message: 'Registration successful.', data: { token: signToken(user), user: safeUser(user) } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('Registration failed:', error.message);
      return res.status(500).json({ success: false, message: 'Unable to create the account. Please try again.' });
    }
  });

  router.post('/login', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (tooManyLogins(requestKey(req, email))) return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Please try again later.' });
    try {
      const password = String(req.body?.password || '');
      if (!isValidEmail(email) || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
      const user = (await dbQuery('SELECT * FROM users WHERE email = ?', [email]))[0];
      const storedHash = getStoredPasswordHash(user);
      if (!user || !storedHash || !(await bcrypt.compare(password, storedHash))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      if (user.status && user.status !== 'active') return res.status(403).json({ success: false, message: 'This account is not active. Please contact support.' });
      let profile = {};
      if (user.role === 'farmer') profile = (await dbQuery('SELECT farm_size_acres AS farm_size, primary_crops, location FROM farmer_profiles WHERE user_id = ?', [user.id]))[0] || {};
      if (user.role === 'buyer') profile = (await dbQuery('SELECT company_name, shipping_address FROM buyer_profiles WHERE user_id = ?', [user.id]))[0] || {};
      if (user.role === 'landowner') profile = (await dbQuery('SELECT total_land_acres AS farm_size FROM landowner_profiles WHERE user_id = ?', [user.id]))[0] || {};
      return res.json({ success: true, data: { token: signToken(user), user: safeUser(user, profile) } });
    } catch (error) {
      console.error('Login failed:', error.message);
      return res.status(500).json({ success: false, message: 'Unable to sign in. Please try again.' });
    }
  });

  router.post('/send-otp', async (req, res) => {
    const email = normalizeEmail(req.body?.target);
    const genericMessage = 'If an account exists for this address, a verification code has been sent.';
    if (!isValidEmail(email) || req.body?.channel === 'phone') return res.status(400).json({ success: false, message: 'Enter a valid email address to reset your password.' });
    if (tooManyResets(requestKey(req, email))) return res.status(429).json({ success: false, message: 'Too many reset requests. Please try again later.' });
    try {
      const user = (await dbQuery('SELECT id FROM users WHERE email = ?', [email]))[0];
      if (!user) return res.json({ success: true, message: genericMessage });
      const otp = String(crypto.randomInt(100000, 1000000));
      await sendMail(email, otp, 'AgriBridge password reset code', 'Your password reset code is');
      resetCodes.set(email, { userId: user.id, otpHash: hashOtp(otp), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, used: false });
      return res.json({ success: true, message: genericMessage });
    } catch (error) {
      console.error('Password reset delivery failed:', error.message);
      return res.status(503).json({ success: false, message: 'Password reset is temporarily unavailable. Please try again later.' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    const email = normalizeEmail(req.body?.target);
    const otp = String(req.body?.otp || '').trim();
    const passwordError = validatePassword(req.body?.newPassword);
    if (!isValidEmail(email) || !/^\d{6}$/.test(otp) || passwordError) return res.status(400).json({ success: false, message: passwordError || 'Invalid or expired verification code.' });
    const record = resetCodes.get(email);
    if (!record || record.used || record.expiresAt < Date.now() || record.attempts >= 5 || !validOtp(otp, record.otpHash)) {
      if (record && !validOtp(otp, record.otpHash)) record.attempts += 1;
      if (record && (record.expiresAt < Date.now() || record.attempts >= 5)) resetCodes.delete(email);
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }
    record.used = true;
    try {
      const passwordHash = await bcrypt.hash(req.body.newPassword, BCRYPT_ROUNDS);
      const available = await columns();
      const assignments = [];
      const values = [];
      if (available.has('password')) { assignments.push('password = ?'); values.push(passwordHash); }
      if (available.has('password_hash')) { assignments.push('password_hash = ?'); values.push(passwordHash); }
      if (!assignments.length) throw new Error('The users table has no supported password column.');
      values.push(record.userId);
      const updated = await dbQuery(`UPDATE users SET ${assignments.join(', ')} WHERE id = ?`, values);
      if (!updated || updated.affectedRows !== 1) throw new Error('Password update did not affect exactly one account.');
      resetCodes.delete(email);
      return res.json({ success: true, message: 'Password updated successfully. You can now sign in with your new password.' });
    } catch (error) {
      record.used = false;
      console.error('Password reset failed:', error.message);
      return res.status(500).json({ success: false, message: 'Unable to update the password. Please try again.' });
    }
  });

  router.post('/send-registration-otp', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    try {
      if ((await dbQuery('SELECT id FROM users WHERE email = ?', [email])).length) return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      const otp = String(crypto.randomInt(100000, 1000000));
      await sendMail(email, otp, 'Verify your AgriBridge email address', 'Your registration code is');
      registrationCodes.set(email, { otpHash: hashOtp(otp), expiresAt: Date.now() + OTP_TTL_MS });
      return res.json({ success: true, message: 'Verification code sent. Check your email inbox.' });
    } catch (error) {
      console.error('Registration email failed:', error.message);
      return res.status(503).json({ success: false, message: 'Verification email is temporarily unavailable. Please try again later.' });
    }
  });

  router.post('/verify-registration', async (req, res) => {
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const record = registrationCodes.get(email);
    if (!record || record.expiresAt < Date.now() || !validOtp(body.otp, record.otpHash)) return res.status(400).json({ success: false, message: 'Invalid or expired email verification code.' });
    try {
      const user = await insertUser(body);
      registrationCodes.delete(email);
      return res.status(201).json({ success: true, message: 'Registration successful and email verified.', data: { token: signToken(user), user: safeUser(user) } });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      console.error('Registration verification failed:', error.message);
      return res.status(500).json({ success: false, message: 'Unable to create the account. Please try again.' });
    }
  });

  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const user = (await dbQuery('SELECT * FROM users WHERE id = ?', [req.user.id]))[0];
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, data: safeUser(user) });
    } catch (error) {
      console.error('Profile lookup failed:', error.message);
      return res.status(500).json({ success: false, message: 'Unable to load the profile.' });
    }
  });

  return router;
}

export default createAuthRouter();
