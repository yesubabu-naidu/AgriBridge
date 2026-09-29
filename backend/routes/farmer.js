import express from "express";
import crypto from "crypto";
import { query, withTransaction } from "../config/db.js";
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/farmer/dashboard
router.get('/dashboard', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const farmerId = req.user.id;

    const leases = await query('SELECT COUNT(*) AS total_leases FROM leases WHERE farmer_id = ? AND status = "active"', [farmerId]);
    const pendingApps = await query('SELECT COUNT(*) AS pending FROM lease_applications WHERE farmer_id = ? AND status = "pending"', [farmerId]);
    const approvedApps = await query('SELECT COUNT(*) AS approved FROM lease_applications WHERE farmer_id = ? AND status = "approved"', [farmerId]);
    const spending = await query('SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payer_id = ? AND status = "successful"', [farmerId]);
    const earnings = await query('SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = ? AND type = "payout" AND status = "successful"', [farmerId]);
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
      `SELECT les.*, l.land_type AS land_name, l.location, l.area_acres AS acres, COALESCE(NULLIF(u.name, ""), u.full_name) AS owner_name, u.phone AS owner_phone
       FROM leases les
       JOIN lands l ON les.land_id = l.id
       JOIN users u ON les.owner_id = u.id
       WHERE les.farmer_id = ?
       ORDER BY les.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: leases });
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
      `SELECT app.*, l.land_type AS land_name, l.location, l.price_per_year AS lease_price, COALESCE(NULLIF(u.name, ""), u.full_name) AS owner_name
       FROM lease_applications app
       JOIN lands l ON app.land_id = l.id
       JOIN users u ON l.landowner_id = u.id
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
      `SELECT p.*, p.available_qty AS quantity, COALESCE(NULLIF(u.name, ""), u.full_name) AS farmer_name, u.email AS farmer_email, u.phone AS farmer_phone
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
      const leases = await tx("SELECT id, annual_price FROM leases WHERE id = ? AND farmer_id = ? AND status = ? AND payment_status = ?", [leaseId, req.user.id, "active", "pending"]);
      if (!leases.length) { const error = new Error("This lease cannot be paid, or has already been paid."); error.status = 409; throw error; }
      const amount = Number(leases[0].annual_price);
      const paid = await tx("UPDATE leases SET payment_status = ? WHERE id = ? AND farmer_id = ? AND status = ? AND payment_status = ?", ["paid", leaseId, req.user.id, "active", "pending"]);
      if (!paid.affectedRows) { const error = new Error("This lease payment was already processed."); error.status = 409; throw error; }
      const txId = "AGRI-" + Date.now() + "-" + crypto.randomBytes(5).toString("hex");
      await tx("INSERT INTO payments (reference_type, reference_id, payer_id, amount, payment_method, status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)", ["lease", leaseId, req.user.id, amount, paymentMethod, "successful", txId]);
      await tx("INSERT INTO transactions (transaction_id, user_id, type, amount, payment_method, status, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txId, req.user.id, "lease_payment", amount, paymentMethod, "successful", "LEASE-" + leaseId, "Lease fee payment"]);
      return { transaction_id: txId, amount, status: "successful" };
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
