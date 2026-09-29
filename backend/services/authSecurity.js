import crypto from 'crypto';

export const BCRYPT_ROUNDS = 12;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

export function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
}

export function passwordFingerprint(passwordHash) {
  return crypto.createHash('sha256').update(String(passwordHash || '')).digest('hex').slice(0, 24);
}

export function getStoredPasswordHash(user) {
  if (isBcryptHash(user?.password_hash)) return user.password_hash;
  if (isBcryptHash(user?.password)) return user.password;
  return null;
}

export function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 10 || value.length > 128) return 'Password must be between 10 and 128 characters long.';
  if (/\s/.test(value)) return 'Password cannot contain spaces.';
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(value)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9\s]/.test(value)) return 'Password must contain at least one symbol.';
  return null;
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}
