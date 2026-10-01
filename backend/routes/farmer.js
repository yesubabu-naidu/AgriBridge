import express from "express";
import crypto from "crypto";
import { query, withTransaction } from "../config/db.js";
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { calculateTotalLeaseAmount, getLeaseDurationMonths } from "../services/leaseService.js";

const router = express.Router();

// GET /api/farmer/dashboard
router.get('/dashboard', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const farmerId = req.user.id;

    const leases = await query(`SELECT COUNT(*) AS total_leases FROM leases WHERE farmer_id = ? AND status = 'active'`, [farmerId]);
    const pendingApps = await query(`SELECT COUNT(*) AS pending FROM lease_applications WHERE farmer_id = ? AND status = 'pending'`, [farmerId]);
    const approvedApps = await query(`SELECT COUNT(*) AS approved FROM lease_applications WHERE farmer_id = ? AND status = 'approved'`, [farmerId]);
    const spending = await query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payer_id = ? AND status = 'successful'`, [farmerId]);
    const earnings = await query(`SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = ? AND type = 'payout' AND status = 'successful'`, [farmerId]);
    const recentTx = await query('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [farmerId]);

    return res.json({
      success: true,
      data: {
        total_leases: leases[0].total_leases,
        pending_applications: pendingApps[0].pending,
        approved_applications: approvedApps[0].approved,
        total_spending: spending[0].total,
        total_earnings: earnings[0].total,
        recent_transactions: recentTx
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/farmer/leases
router.get('/leases', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const leases = await query(
      `SELECT les.*,
              COALESCE(app.proposed_duration_months, l.lease_duration_months, 12) AS lease_duration_months,
              l.land_name, l.location, l.acres, l.land_name AS land_type, l.acres AS area_acres,
              COALESCE(NULLIF(u.full_name, ''), u.email) AS owner_name, u.phone AS owner_phone
       FROM leases les
       JOIN lands l ON les.land_id = l.id
       JOIN users u ON les.owner_id = u.id
       LEFT JOIN lease_applications app ON les.application_id = app.id
       WHERE les.farmer_id = ?
       ORDER BY les.created_at DESC`,
      [req.user.id]
    );
    const enriched = leases.map(lease => {
      const duration = getLeaseDurationMonths(lease);
      const totalAmount = calculateTotalLeaseAmount(lease.annual_price, duration);
      return {
        ...lease,
        lease_duration_months: duration,
        total_amount: totalAmount,
        total_lease_amount: totalAmount
      };
    });
    return res.json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leases/apply
router.post("/leases/apply", authenticateToken, authorizeRoles("farmer"), async (req, res) => {
  try {
    const landId = Number(req.body.land_id);
    const duration = Number.parseInt(req.body.proposed_duration_months, 10);
    const proposedPrice = Number(req.body.proposed_price);
    if (!Number.isInteger(landId) || landId <= 0 || !Number.isInteger(duration) || duration < 1 || duration > 120 || !Number.isFinite(proposedPrice) || proposedPrice <= 0) {
      return res.status(400).json({ success: false, message: "Provide a valid land, duration, and proposed price." });
    }

    const application = await withTransaction(async (tx) => {
      const lands = await tx("SELECT id FROM lands WHERE id = ? AND LOWER(TRIM(status)) IN (?, ?)", [landId, "active", "approved"]);
      if (!lands.length) {
        const error = new Error("This land is not available for lease.");
        error.status = 409;
        throw error;
      }
      const existing = await tx("SELECT id FROM lease_applications WHERE land_id = ? AND farmer_id = ? AND status IN (?, ?)", [landId, req.user.id, "pending", "approved"]);
      if (existing.length) {
        const error = new Error("You already have an active application for this land.");
        error.status = 409;
        throw error;
      }
      return tx(
        "INSERT INTO lease_applications (land_id, farmer_id, proposed_duration_months, proposed_price, message, status) VALUES (?, ?, ?, ?, ?, ?)",
        [landId, req.user.id, duration, proposedPrice, String(req.body.message || "").trim().slice(0, 2000), "pending"]
      );
    });

    return res.status(201).json({ success: true, message: "Lease application submitted successfully", data: { id: application.insertId } });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

// GET /api/farmer/applications
router.get('/applications', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const apps = await query(
      `SELECT app.*, l.land_name, l.location, l.lease_price, l.land_name AS land_type, l.lease_price AS price_per_year, COALESCE(NULLIF(u.full_name, ''), u.email) AS owner_name
       FROM lease_applications app
       JOIN lands l ON app.land_id = l.id
       JOIN users u ON l.owner_id = u.id
       WHERE app.farmer_id = ?
       ORDER BY app.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: apps });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/farmer/products - only the signed-in farmer's listings
router.get('/products', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const products = await query(
      `SELECT p.*, p.available_qty AS quantity, COALESCE(NULLIF(u.full_name, ''), u.email) AS farmer_name, u.email AS farmer_email, u.phone AS farmer_phone
       FROM products p
       JOIN users u ON p.farmer_id = u.id
       WHERE p.farmer_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/farmer/products
router.post('/products', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const {
      product_name, category, price_per_unit, unit, quantity, available_qty,
      location, image_url, description
    } = req.body;

    if (!product_name || !category || price_per_unit == null || (quantity == null && available_qty == null)) {
      return res.status(400).json({ success: false, message: 'Product name, category, price, and quantity are required.' });
    }

    const result = await query(
      `INSERT INTO products
       (farmer_id, product_name, category, price_per_unit, unit, available_qty, location, image_url, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [req.user.id, product_name, category, price_per_unit, unit || 'kg', available_qty ?? quantity, location || '', image_url || '', description || '']
    );

    return res.status(201).json({ success: true, message: 'Produce listed successfully', data: { id: result.insertId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/farmer/products/:id
router.delete('/products/:id', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const result = await query('DELETE FROM products WHERE id = ? AND farmer_id = ?', [req.params.id, req.user.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Crop listing not found.' });
    }
    return res.json({ success: true, message: 'Crop listing removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/farmer/payment
router.post("/payment", authenticateToken, authorizeRoles("farmer"), async (req, res) => {
  try {
    const leaseId = Number(req.body.lease_id);
    const paymentMethod = String(req.body.payment_method || "");
    const allowedMethods = ["UPI", "Card", "Net Banking", "Wallet"];
    if (!Number.isInteger(leaseId) || leaseId <= 0 || !allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Provide a valid lease and payment method." });
    }
    const payment = await withTransaction(async (tx) => {
      const leases = await tx(
        `SELECT les.id, les.annual_price, les.start_date, les.end_date, les.owner_id, les.farmer_id,
                COALESCE(app.proposed_duration_months, l.lease_duration_months, 12) AS duration_months,
                l.land_name,
                COALESCE(NULLIF(farmer.full_name, ''), farmer.email) AS farmer_name,
                COALESCE(NULLIF(owner.full_name, ''), owner.email) AS owner_name
         FROM leases les
         JOIN lands l ON les.land_id = l.id
         JOIN users owner ON les.owner_id = owner.id
         JOIN users farmer ON les.farmer_id = farmer.id
         LEFT JOIN lease_applications app ON les.application_id = app.id
         WHERE les.id = ? AND les.farmer_id = ? AND les.status = ? AND les.payment_status = ?`,
        [leaseId, req.user.id, "active", "pending"]
      );
      if (!leases.length) {
        const error = new Error("This lease cannot be paid, or has already been paid.");
        error.status = 409;
        throw error;
      }
      const lease = leases[0];
      const annualPrice = Number(lease.annual_price) || 0;
      const durationMonths = getLeaseDurationMonths(lease);
      const totalAmount = calculateTotalLeaseAmount(annualPrice, durationMonths);

      const paid = await tx(
        "UPDATE leases SET payment_status = ? WHERE id = ? AND farmer_id = ? AND status = ? AND payment_status = ?",
        ["paid", leaseId, req.user.id, "active", "pending"]
      );
      if (!paid.affectedRows) {
        const error = new Error("This lease payment was already processed.");
        error.status = 409;
        throw error;
      }
      const txId = "AGRI-" + Date.now() + "-" + crypto.randomBytes(5).toString("hex");
      await tx(
        "INSERT INTO payments (reference_type, reference_id, payer_id, amount, payment_method, status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["lease", leaseId, req.user.id, totalAmount, paymentMethod, "successful", txId]
      );

      // Record the farmer's debit transaction
      const farmerDesc = `Lease fee payment for ${lease.land_name || 'land'} (Lease #${leaseId}, ₹${annualPrice.toLocaleString()}/yr, ${durationMonths} months, Total: ₹${totalAmount.toLocaleString()})`;
      await tx(
        "INSERT INTO transactions (transaction_id, user_id, type, amount, payment_method, status, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [txId, req.user.id, "lease_payment", totalAmount, paymentMethod, "successful", "LEASE-" + leaseId, farmerDesc]
      );

      // Record the matching landowner credit transaction
      const ownerTxId = txId + "-OWNER";
      const ownerDesc = `Lease payment received from ${lease.farmer_name} for ${lease.land_name || 'land'} (Lease #${leaseId}, ₹${annualPrice.toLocaleString()}/yr, ${durationMonths} months, Total: ₹${totalAmount.toLocaleString()})`;
      await tx(
        "INSERT INTO transactions (transaction_id, user_id, type, amount, payment_method, status, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [ownerTxId, lease.owner_id, "lease_payment", totalAmount, paymentMethod, "successful", "LEASE-" + leaseId, ownerDesc]
      );

      return {
        transaction_id: txId,
        amount: totalAmount,
        total_payment: totalAmount,
        annual_price: annualPrice,
        duration_months: durationMonths,
        status: "successful",
        reference_id: "LEASE-" + leaseId
      };
    });
    return res.json({ success: true, message: "Payment completed successfully", data: payment });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

// GET /api/farmer/transactions
router.get('/transactions', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const txs = await query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, data: txs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
