import express from 'express';
import { query, withTransaction } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { calculateTotalLeaseAmount, getLeaseDurationMonths } from '../services/leaseService.js';

const router = express.Router();
const farmerName = "COALESCE(NULLIF(u.full_name, ''), u.email)";
const landLabel = 'l.land_name';

function errorResponse(res, error) {
  console.error('Landowner request failed:', error.message);
  return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Database query failed', ...(process.env.NODE_ENV !== 'production' && !error.status ? { error: error.message } : {}) });
}

router.get('/dashboard', authenticateToken, authorizeRoles('landowner'), async (req, res) => {
  const ownerId = req.user.id;
  const tasks = {
    total_lands: () => query('SELECT COUNT(*) AS value FROM lands WHERE owner_id = ?', [ownerId]),
    active_leases: () => query("SELECT COUNT(*) AS value FROM leases WHERE owner_id = ? AND status = 'active'", [ownerId]),
    pending_applications: () => query("SELECT COUNT(app.id) AS value FROM lease_applications app JOIN lands l ON app.land_id = l.id WHERE l.owner_id = ? AND app.status = 'pending'", [ownerId]),
    total_earnings: async () => {
      const txRows = await query(
        "SELECT COALESCE(SUM(amount), 0) AS value FROM transactions WHERE user_id = ? AND type IN ('lease_payment', 'payout') AND status = 'successful'",
        [ownerId]
      );
      const txTotal = Number(txRows[0]?.value || 0);
      if (txTotal > 0) return [{ value: txTotal }];

      const leaseRows = await query(
        `SELECT les.annual_price, les.start_date, les.end_date,
                COALESCE(app.proposed_duration_months, l.lease_duration_months, 12) AS duration_months
         FROM leases les
         JOIN lands l ON les.land_id = l.id
         LEFT JOIN lease_applications app ON les.application_id = app.id
         WHERE les.owner_id = ? AND les.payment_status = 'paid'`,
        [ownerId]
      );
      const leaseTotal = leaseRows.reduce((sum, row) => {
        const annual = Number(row.annual_price || 0);
        const duration = getLeaseDurationMonths(row);
        return sum + calculateTotalLeaseAmount(annual, duration);
      }, 0);
      return [{ value: leaseTotal }];
    },
    recent_applications: () => query(`SELECT app.*, ${landLabel}, l.location, ${farmerName} AS farmer_name FROM lease_applications app JOIN lands l ON app.land_id = l.id JOIN users u ON app.farmer_id = u.id WHERE l.owner_id = ? ORDER BY app.created_at DESC LIMIT 5`, [ownerId])
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
    const apps = await query(`SELECT app.*, ${landLabel}, l.location, ${farmerName} AS farmer_name, u.email AS farmer_email, u.phone AS farmer_phone FROM lease_applications app JOIN lands l ON app.land_id = l.id JOIN users u ON app.farmer_id = u.id WHERE l.owner_id = ? ORDER BY app.created_at DESC`, [req.user.id]);
    return res.json({ success: true, data: apps });
  } catch (error) { return errorResponse(res, error); }
});

router.put('/applications/:id/status', authenticateToken, authorizeRoles('landowner'), async (req, res) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    await withTransaction(async (tx) => {
      const applications = await tx('SELECT app.*, l.lease_price AS price_per_year FROM lease_applications app JOIN lands l ON l.id = app.land_id WHERE app.id = ? AND l.owner_id = ?', [req.params.id, req.user.id]);
      if (!applications.length) throw Object.assign(new Error('Application not found for your land.'), { status: 404 });
      const application = applications[0];
      if (application.status !== 'pending') throw Object.assign(new Error('This application has already been processed.'), { status: 409 });
      if (status === 'rejected') return tx("UPDATE lease_applications SET status = 'rejected' WHERE id = ? AND status = 'pending'", [application.id]);
      const locked = await tx("UPDATE lands SET status = 'leased' WHERE id = ? AND owner_id = ? AND LOWER(TRIM(status)) IN ('active', 'approved')", [application.land_id, req.user.id]);
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
    const ownerId = req.user.id;
    const transactions = await query(
      `SELECT t.id, t.transaction_id, t.user_id, t.type, t.amount, t.payment_method, t.status, t.reference_id, t.description, t.created_at,
              l.land_name, l.location,
              COALESCE(NULLIF(u.full_name, ''), u.email, 'Tenant Farmer') AS farmer_name,
              u.email AS farmer_email
       FROM transactions t
       LEFT JOIN leases les ON (t.reference_id = CONCAT('LEASE-', les.id) OR t.reference_id = CAST(les.id AS VARCHAR))
       LEFT JOIN lands l ON les.land_id = l.id
       LEFT JOIN users u ON les.farmer_id = u.id
       WHERE t.user_id = ? AND t.type IN ('lease_payment', 'payout') AND t.status = 'successful'
       ORDER BY t.created_at DESC`,
      [ownerId]
    );

    const pendingRows = await query(
      `SELECT les.annual_price, les.start_date, les.end_date,
              COALESCE(app.proposed_duration_months, l.lease_duration_months, 12) AS duration_months
       FROM leases les
       JOIN lands l ON les.land_id = l.id
       LEFT JOIN lease_applications app ON les.application_id = app.id
       WHERE les.owner_id = ? AND les.payment_status = 'pending' AND les.status = 'active'`,
      [ownerId]
    );

    const pendingTotal = pendingRows.reduce((sum, row) => {
      const annual = Number(row.annual_price || 0);
      const duration = getLeaseDurationMonths(row);
      return sum + calculateTotalLeaseAmount(annual, duration);
    }, 0);

    const totalEarnings = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return res.json({
      success: true,
      data: {
        total_earnings: totalEarnings,
        pending_payments: pendingTotal,
        pending_earnings: pendingTotal,
        completed_payouts: transactions.length,
        transactions
      }
    });
  } catch (error) { return errorResponse(res, error); }
});

export default router;
