import express from 'express';
import { query, withTransaction } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const farmerName = "COALESCE(NULLIF(u.name, ''), u.full_name)";
const landLabel = 'l.land_type AS land_name';

function errorResponse(res, error) {
  console.error('Landowner request failed:', error.message);
  return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Database query failed', ...(process.env.NODE_ENV !== 'production' && !error.status ? { error: error.message } : {}) });
}

router.get('/dashboard', authenticateToken, authorizeRoles('landowner'), async (req, res) => {
  const ownerId = req.user.id;
  const tasks = {
    total_lands: () => query('SELECT COUNT(*) AS value FROM lands WHERE landowner_id = ?', [ownerId]),
    active_leases: () => query("SELECT COUNT(*) AS value FROM leases WHERE owner_id = ? AND status = 'active'", [ownerId]),
    pending_applications: () => query("SELECT COUNT(app.id) AS value FROM lease_applications app JOIN lands l ON app.land_id = l.id WHERE l.landowner_id = ? AND app.status = 'pending'", [ownerId]),
    total_earnings: () => query("SELECT COALESCE(SUM(annual_price), 0) AS value FROM leases WHERE owner_id = ? AND payment_status = 'paid'", [ownerId]),
    recent_applications: () => query(`SELECT app.*, ${landLabel}, l.location, ${farmerName} AS farmer_name FROM lease_applications app JOIN lands l ON app.land_id = l.id JOIN users u ON app.farmer_id = u.id WHERE l.landowner_id = ? ORDER BY app.created_at DESC LIMIT 5`, [ownerId])
  };
  try {
    const settled = await Promise.allSettled(Object.values(tasks).map((run) => run()));
    const keys = Object.keys(tasks);
    const data = { total_lands: 0, active_leases: 0, pending_applications: 0, total_earnings: 0, recent_applications: [] };
    const unavailable = [];
    settled.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') data[key] = key === 'recent_applications' ? result.value : Number(result.value[0]?.value || 0);
      else { unavailable.push(key); console.error(`Dashboard statistic ${key} failed:`, result.reason.message); }
    });
    return res.json({ success: true, data, ...(unavailable.length ? { warnings: { unavailable } } : {}) });
  } catch (error) { return errorResponse(res, error); }
});

router.get('/applications', authenticateToken, authorizeRoles('landowner'), async (req, res) => {
  try {
    const apps = await query(`SELECT app.*, ${landLabel}, l.location, ${farmerName} AS farmer_name, u.email AS farmer_email, u.phone AS farmer_phone FROM lease_applications app JOIN lands l ON app.land_id = l.id JOIN users u ON app.farmer_id = u.id WHERE l.landowner_id = ? ORDER BY app.created_at DESC`, [req.user.id]);
    return res.json({ success: true, data: apps });
  } catch (error) { return errorResponse(res, error); }
});

router.put('/applications/:id/status', authenticateToken, authorizeRoles('landowner'), async (req, res) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    await withTransaction(async (tx) => {
      const applications = await tx('SELECT app.*, l.price_per_year FROM lease_applications app JOIN lands l ON l.id = app.land_id WHERE app.id = ? AND l.landowner_id = ?', [req.params.id, req.user.id]);
      if (!applications.length) throw Object.assign(new Error('Application not found for your land.'), { status: 404 });
      const application = applications[0];
      if (application.status !== 'pending') throw Object.assign(new Error('This application has already been processed.'), { status: 409 });
      if (status === 'rejected') return tx("UPDATE lease_applications SET status = 'rejected' WHERE id = ? AND status = 'pending'", [application.id]);
      const locked = await tx("UPDATE lands SET status = 'leased' WHERE id = ? AND landowner_id = ? AND LOWER(TRIM(status)) IN ('active', 'approved')", [application.land_id, req.user.id]);
      if (!locked.affectedRows) throw Object.assign(new Error('This land is no longer available for lease.'), { status: 409 });
      await tx("UPDATE lease_applications SET status = 'approved' WHERE id = ? AND status = 'pending'", [application.id]);
      await tx("UPDATE lease_applications SET status = 'rejected' WHERE land_id = ? AND id <> ? AND status = 'pending'", [application.land_id, application.id]);
      const duration = Math.min(120, Math.max(1, Number.parseInt(application.proposed_duration_months, 10) || 12));
      const startDate = new Date(); const endDate = new Date(startDate); endDate.setMonth(endDate.getMonth() + duration);
      await tx('INSERT INTO leases (application_id, land_id, farmer_id, owner_id, start_date, end_date, annual_price, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [application.id, application.land_id, application.farmer_id, req.user.id, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10), application.proposed_price || application.price_per_year, 'pending', 'active']);
    });
    return res.json({ success: true, message: `Application ${status} successfully` });
  } catch (error) { return errorResponse(res, error); }
});

router.get('/earnings', authenticateToken, authorizeRoles('landowner'), async (req, res) => {
  try {
    const earnings = await query(`SELECT les.*, ${landLabel}, l.location, ${farmerName} AS farmer_name FROM leases les JOIN lands l ON les.land_id = l.id JOIN users u ON les.farmer_id = u.id WHERE les.owner_id = ? AND les.payment_status = 'paid'`, [req.user.id]);
    return res.json({ success: true, data: earnings });
  } catch (error) { return errorResponse(res, error); }
});

export default router;
