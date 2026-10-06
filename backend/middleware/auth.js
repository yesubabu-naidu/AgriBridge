import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { getJwtSecret, getStoredPasswordHash, passwordFingerprint } from '../services/authSecurity.js';

export async function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Access token is required.' });
  try {
    const user = jwt.verify(token, getJwtSecret());
    const account = (await query('SELECT * FROM users WHERE id = ?', [user.id]))[0];
    const hash = getStoredPasswordHash(account);
    if (!account || !hash || user.passwordFingerprint !== passwordFingerprint(hash)) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    // Authorisation must come from the current account record, not a possibly
    // stale role claim embedded in an old token.
    req.user = { id: account.id, role: account.role, email: account.email, full_name: account.full_name || 'User' };
    return next();
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden.' });
    return next();
  };
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  return next();
}
