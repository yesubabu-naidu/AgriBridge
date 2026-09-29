import express from "express";
import crypto from "crypto";
import { query, withTransaction } from "../config/db.js";
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/buyer/dashboard
router.get("/dashboard", authenticateToken, authorizeRoles("buyer"), async (req, res) => {
  try {
    const buyerId = req.user.id;
    const [totals, pending, completed, spending, recent] = await Promise.all([
      query("SELECT COUNT(*) AS value FROM orders WHERE buyer_id = ?", [buyerId]),
      query("SELECT COUNT(*) AS value FROM orders WHERE buyer_id = ? AND LOWER(TRIM(status)) = ?", [buyerId, "processing"]),
      query("SELECT COUNT(*) AS value FROM orders WHERE buyer_id = ? AND LOWER(TRIM(status)) = ?", [buyerId, "delivered"]),
      query("SELECT COALESCE(SUM(grand_total), 0) AS value FROM orders WHERE buyer_id = ? AND payment_status = ?", [buyerId, "successful"]),
      query("SELECT *, status AS order_status FROM orders WHERE buyer_id = ? ORDER BY created_at DESC LIMIT 5", [buyerId])
    ]);
    return res.json({ success: true, data: { total_orders: Number(totals[0]?.value || 0), pending_orders: Number(pending[0]?.value || 0), completed_orders: Number(completed[0]?.value || 0), total_spending: Number(spending[0]?.value || 0), recent_orders: recent } });
  } catch (error) {
    console.error("Buyer dashboard query failed:", error.message);
    return res.status(500).json({ success: false, message: "Database query failed", ...(process.env.NODE_ENV !== "production" ? { error: error.message } : {}) });
  }
});

// GET /api/products
router.get('/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = `
      SELECT p.*, p.available_qty AS quantity, COALESCE(NULLIF(u.name, ""), u.full_name) AS farmer_name
      FROM products p
      JOIN users u ON p.farmer_id = u.id
      WHERE LOWER(TRIM(p.status)) = 'available'
    `;
    const params = [];

    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (p.product_name LIKE ? OR p.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY p.created_at DESC`;
    const products = await query(sql, params);
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const products = await query(
      `SELECT p.*, p.available_qty AS quantity, COALESCE(NULLIF(u.name, ""), u.full_name) AS farmer_name, u.phone AS farmer_phone
       FROM products p
       JOIN users u ON p.farmer_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: products[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/cart
router.get('/cart', authenticateToken, authorizeRoles('buyer'), async (req, res) => {
  try {
    const items = await query(
      `SELECT c.id AS cart_id, c.quantity, p.*
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cart
router.post("/cart", authenticateToken, authorizeRoles("buyer"), async (req, res) => {
  try {
    const productId = Number(req.body.product_id);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Provide a valid product and quantity." });
    }
    const cart = await withTransaction(async (tx) => {
      const products = await tx("SELECT id, available_qty FROM products WHERE id = ? AND LOWER(TRIM(status)) = ?", [productId, "available"]);
      if (!products.length) { const error = new Error("This crop is unavailable."); error.status = 409; throw error; }
      const current = await tx("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?", [req.user.id, productId]);
      const desiredQty = Number(current[0]?.quantity || 0) + quantity;
      if (desiredQty > Number(products[0].available_qty)) { const error = new Error("Requested quantity exceeds available crop stock."); error.status = 409; throw error; }
      if (current.length) {
        await tx("UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?", [desiredQty, current[0].id, req.user.id]);
        return { cart_id: current[0].id, quantity: desiredQty };
      }
      const created = await tx("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)", [req.user.id, productId, quantity]);
      return { cart_id: created.insertId, quantity };
    });
    return res.status(201).json({ success: true, message: "Item added to cart", data: cart });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

// PUT /api/cart/:id
router.put("/cart/:id", authenticateToken, authorizeRoles("buyer"), async (req, res) => {
  try {
    const cartId = Number(req.params.id);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(cartId) || cartId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than zero." });
    }
    const rows = await query("SELECT c.id, p.available_qty, p.status FROM cart c JOIN products p ON p.id = c.product_id WHERE c.id = ? AND c.user_id = ?", [cartId, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Cart item not found." });
    if (String(rows[0].status || "").trim().toLowerCase() !== "available" || quantity > Number(rows[0].available_qty)) {
      return res.status(409).json({ success: false, message: "Requested quantity exceeds available crop stock." });
    }
    await query("UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?", [quantity, cartId, req.user.id]);
    return res.json({ success: true, message: "Cart updated", data: { cart_id: cartId, quantity } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cart/:id
router.delete('/cart/:id', authenticateToken, authorizeRoles('buyer'), async (req, res) => {
  try {
    await query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders
router.post("/orders", authenticateToken, authorizeRoles("buyer"), async (req, res) => {
  try {
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    const shippingAddress = String(req.body.shipping_address || "").trim();
    const paymentMethod = String(req.body.payment_method || "UPI");
    const allowedMethods = ["UPI", "Card", "Net Banking", "Wallet", "COD"];
    if (!rawItems.length || !shippingAddress || !allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "A non-empty order, shipping address, and valid payment method are required." });
    }

    const quantities = new Map();
    for (const item of rawItems) {
      const productId = Number(item.product_id ?? item.id);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Every order item must have a valid product and quantity." });
      }
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }

    const order = await withTransaction(async (tx) => {
      const lineItems = [];
      let totalAmount = 0;
      for (const [productId, quantity] of quantities) {
        const products = await tx("SELECT id, farmer_id, product_name, price_per_unit, available_qty FROM products WHERE id = ? AND LOWER(TRIM(status)) = ?", [productId, "available"]);
        if (!products.length) { const error = new Error("One or more crops are unavailable."); error.status = 409; throw error; }
        const product = products[0];
        const unitPrice = Number(product.price_per_unit);
        const stock = await tx("UPDATE products SET available_qty = available_qty - ?, status = CASE WHEN available_qty - ? <= 0 THEN ? ELSE ? END WHERE id = ? AND LOWER(TRIM(status)) = ? AND available_qty >= ?", [quantity, quantity, "out_of_stock", "available", productId, "available", quantity]);
        if (!stock.affectedRows) { const error = new Error("One or more crops no longer have enough stock."); error.status = 409; throw error; }
        lineItems.push({ productId, farmerId: product.farmer_id, quantity, unitPrice, subtotal: unitPrice * quantity, productName: product.product_name });
        totalAmount += unitPrice * quantity;
      }

      const deliveryFee = 150;
      const platformFee = 50;
      const grandTotal = totalAmount + deliveryFee + platformFee;
      const created = await tx("INSERT INTO orders (buyer_id, total_amount, delivery_fee, platform_fee, grand_total, shipping_address, payment_method, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.user.id, totalAmount, deliveryFee, platformFee, grandTotal, shippingAddress.slice(0, 2000), paymentMethod, "successful", "processing"]);
      for (const item of lineItems) {
        await tx("INSERT INTO order_items (order_id, product_id, farmer_id, crop_name, quantity_kg, price_per_kg, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)", [created.insertId, item.productId, item.farmerId, item.productName, item.quantity, item.unitPrice, item.subtotal]);
      }
      const txId = "AGRI-" + Date.now() + "-" + crypto.randomBytes(5).toString("hex");
      await tx("INSERT INTO payments (reference_type, reference_id, payer_id, amount, payment_method, status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)", ["order", created.insertId, req.user.id, grandTotal, paymentMethod, "successful", txId]);
      await tx("INSERT INTO transactions (transaction_id, user_id, type, amount, payment_method, status, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txId, req.user.id, "order_payment", grandTotal, paymentMethod, "successful", "ORD-" + created.insertId, "Marketplace produce order"]);
      for (const [index, item] of lineItems.entries()) {
        await tx("INSERT INTO transactions (transaction_id, user_id, type, amount, payment_method, status, reference_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [txId + "-P" + (index + 1), item.farmerId, "payout", item.subtotal, paymentMethod, "successful", "ORD-" + created.insertId, "Crop sale: " + item.productName]);
      }
      await tx("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
      return { order_id: created.insertId, transaction_id: txId, grand_total: grandTotal };
    });

    return res.status(201).json({ success: true, message: "Order created successfully", data: order });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

// GET /api/orders
router.get("/orders", authenticateToken, authorizeRoles("buyer"), async (req, res) => {
  try {
    const orders = await query("SELECT *, status AS order_status FROM orders WHERE buyer_id = ? ORDER BY created_at DESC", [req.user.id]);
    const items = await query("SELECT oi.id, oi.order_id, oi.product_id AS product_id, oi.farmer_id, oi.crop_name AS product_name, oi.quantity_kg AS quantity, oi.price_per_kg AS unit_price, oi.subtotal FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.buyer_id = ?", [req.user.id]);
    const itemsByOrder = new Map();
    for (const item of items) {
      const orderItems = itemsByOrder.get(String(item.order_id)) || [];
      orderItems.push(item);
      itemsByOrder.set(String(item.order_id), orderItems);
    }
    return res.json({ success: true, data: orders.map((order) => ({ ...order, items: itemsByOrder.get(String(order.id)) || [] })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
