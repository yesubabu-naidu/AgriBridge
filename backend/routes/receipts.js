import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateReceiptPdf } from '../services/receiptService.js';

const router = express.Router();

/**
 * GET /api/transactions/:id/receipt
 * GET /api/receipts/:id
 * Generates verified server-side transaction receipts as downloadable PDFs.
 */
router.get(['/transactions/:id/receipt', '/receipts/:id', '/orders/:id/receipt'], authenticateToken, async (req, res) => {
  try {
    const rawId = req.params.id;

    // 1. Look up transaction by string transaction_id or numeric primary key
    let tx = null;
    const txRows = await query(
      'SELECT * FROM transactions WHERE transaction_id = ? OR id = ? LIMIT 1',
      [rawId, Number.isInteger(Number(rawId)) ? Number(rawId) : -1]
    );

    if (txRows.length > 0) {
      tx = txRows[0];
    }

    // 2. If not found by transaction table, check if the ID corresponds to an order ID
    let order = null;
    let orderId = null;

    if (tx?.reference_id && tx.reference_id.startsWith('ORD-')) {
      orderId = Number(tx.reference_id.replace('ORD-', ''));
    } else if (!tx && Number.isInteger(Number(rawId))) {
      orderId = Number(rawId);
    }

    if (orderId) {
      const orderRows = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
      if (orderRows.length > 0) {
        order = orderRows[0];
      }
    }

    // 3. Fallback: if order exists without direct transaction row, create/find payment
    if (!tx && order) {
      const paymentRows = await query('SELECT * FROM payments WHERE reference_type = ? AND reference_id = ? LIMIT 1', ['order', order.id]);
      tx = {
        transaction_id: paymentRows[0]?.transaction_id || `AGRI-ORD-${order.id}`,
        user_id: order.buyer_id,
        type: 'order_payment',
        amount: order.grand_total,
        payment_method: order.payment_method || 'UPI',
        status: order.payment_status || 'successful',
        created_at: order.created_at
      };
    }

    if (!tx && !order) {
      return res.status(404).json({ success: false, message: 'Transaction record not found.' });
    }

    // 4. Authorization check: user must be the buyer, seller/farmer, landowner, or admin
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    let authorized = isAdmin || tx?.user_id === userId || order?.buyer_id === userId;

    let buyer = {};
    let seller = {};
    let items = [];
    let lease = null;
    let shippingAddress = order?.shipping_address || '';

    // If it's an order
    if (order) {
      const buyerRows = await query('SELECT id, full_name, email, phone FROM users WHERE id = ?', [order.buyer_id]);
      buyer = buyerRows[0] || {};

      const itemRows = await query(
        `SELECT oi.*, p.product_name, p.unit, u.full_name AS farmer_name, u.email AS farmer_email, u.phone AS farmer_phone
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         LEFT JOIN users u ON oi.farmer_id = u.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      items = itemRows.map((i) => ({
        product_name: i.product_name || i.crop_name || 'Farm Produce',
        quantity: i.quantity || i.quantity_kg || 1,
        unit: i.unit || 'kg',
        unit_price: i.unit_price || i.price_per_kg || 0,
        subtotal: i.subtotal || (Number(i.quantity || 1) * Number(i.unit_price || 0))
      }));

      if (itemRows.length > 0) {
        seller = {
          full_name: itemRows[0].farmer_name,
          email: itemRows[0].farmer_email,
          phone: itemRows[0].farmer_phone
        };
        if (itemRows.some((i) => i.farmer_id === userId)) {
          authorized = true;
        }
      }
    }

    // If it's a lease transaction (reference_id like LEASE-X)
    let leaseId = null;
    if (tx?.reference_id && tx.reference_id.startsWith('LEASE-')) {
      leaseId = Number(tx.reference_id.replace('LEASE-', ''));
    } else if (tx?.type === 'lease_payment') {
      leaseId = Number(tx.reference_id);
    }

    if (leaseId) {
      const leaseRows = await query(
        `SELECT les.*, l.land_name, l.location, l.acres,
                farmer.full_name AS farmer_name, farmer.email AS farmer_email, farmer.phone AS farmer_phone,
                owner.full_name AS owner_name, owner.email AS owner_email, owner.phone AS owner_phone
         FROM leases les
         JOIN lands l ON les.land_id = l.id
         JOIN users farmer ON les.farmer_id = farmer.id
         JOIN users owner ON l.owner_id = owner.id
         WHERE les.id = ?`,
        [leaseId]
      );

      if (leaseRows.length > 0) {
        const l = leaseRows[0];
        lease = {
          id: l.id,
          land_name: l.land_name,
          location: l.location,
          acres: l.acres,
          duration_months: l.proposed_duration_months || 12,
          annual_price: l.annual_price
        };
        buyer = { full_name: l.farmer_name, email: l.farmer_email, phone: l.farmer_phone };
        seller = { full_name: l.owner_name, email: l.owner_email, phone: l.owner_phone };
        if (l.farmer_id === userId || l.owner_id === userId) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this receipt.' });
    }

    // If buyer details not yet loaded (e.g. general transaction)
    if (!buyer.full_name && tx?.user_id) {
      const uRows = await query('SELECT id, full_name, email, phone FROM users WHERE id = ?', [tx.user_id]);
      if (uRows.length) buyer = uRows[0];
    }

    const receiptPayload = {
      transactionId: tx.transaction_id || `AGRI-${tx.id}`,
      date: tx.created_at || order?.created_at || new Date().toISOString(),
      type: tx.type || 'order_payment',
      paymentMethod: tx.payment_method || order?.payment_method || 'UPI',
      paymentStatus: tx.status || order?.payment_status || 'Successful',
      amount: Number(tx.amount || order?.grand_total || 0),
      subtotal: Number(order?.total_amount || (Number(tx.amount) > 200 ? Number(tx.amount) - 200 : tx.amount)),
      deliveryFee: Number(order?.delivery_fee || (order ? 150 : 0)),
      platformFee: Number(order?.platform_fee || (order ? 50 : 0)),
      buyer,
      seller,
      shippingAddress,
      items,
      lease
    };

    if (req.query.format === 'json') {
      return res.json({ success: true, data: receiptPayload });
    }

    const pdfBuffer = generateReceiptPdf(receiptPayload);
    const safeTxName = (receiptPayload.transactionId || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AgriBridge_Receipt_${safeTxName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.end(pdfBuffer);
  } catch (error) {
    console.error('Receipt generation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate receipt PDF.', error: error.message });
  }
});

export default router;
