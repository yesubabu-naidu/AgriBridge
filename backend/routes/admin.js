import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/dashboard
router.get('/dashboard', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await query('SELECT COUNT(*) AS total FROM users');
    const farmers = await query('SELECT COUNT(*) AS total FROM users WHERE role = "farmer"');
    const buyers = await query('SELECT COUNT(*) AS total FROM users WHERE role = "buyer"');
    const landowners = await query('SELECT COUNT(*) AS total FROM users WHERE role = "landowner"');
    const lands = await query('SELECT COUNT(*) AS total FROM lands');
    const pendingLands = await query('SELECT COUNT(*) AS total FROM lands WHERE status = "pending"');
    const orders = await query('SELECT COUNT(*) AS total FROM orders');
    const txs = await query('SELECT COUNT(*) AS total FROM transactions');
    const revenue = await query('SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE status = "successful"');

    return res.json({
      success: true,
      data: {
        total_users: users[0].total,
        total_farmers: farmers[0].total,
        total_buyers: buyers[0].total,
        total_landowners: landowners[0].total,
        total_lands: lands[0].total,
        pending_land_approvals: pendingLands[0].total,
        total_orders: orders[0].total,
        total_transactions: txs[0].total,
        total_revenue: revenue[0].total
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/users
router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await query('SELECT id, COALESCE(NULLIF(name, ""), full_name) AS full_name, email, role, phone, status, created_at FROM users ORDER BY created_at DESC');
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be active or blocked.' });
    await query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/lands
router.get('/lands', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const lands = await query(
      `SELECT l.*, l.land_type AS land_name, l.area_acres AS acres, l.price_per_year AS lease_price, COALESCE(NULLIF(u.name, ""), u.full_name) AS owner_name
       FROM lands l
       JOIN users u ON l.landowner_id = u.id
       ORDER BY l.created_at DESC`
    );
    return res.json({ success: true, data: lands });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/lands/:id/status
router.put('/lands/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    if (!['active', 'inactive'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be active or inactive.' });
    await query('UPDATE lands SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, message: `Land status set to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/transactions
router.get('/transactions', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const txs = await query(
      `SELECT t.*, COALESCE(NULLIF(u.name, ""), u.full_name) AS full_name, u.role
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    return res.json({ success: true, data: txs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
