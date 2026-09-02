-- =========================================================
-- AgriBridge Sample SQL Queries Demonstration
-- Database: agribridge
-- =========================================================

USE agribridge;

-- 1. SELECT lands with filter & pagination (WHERE, LIKE, ORDER BY, LIMIT)
SELECT 
    l.id, 
    l.land_name, 
    l.location, 
    l.acres, 
    l.soil_type, 
    l.lease_price,
    u.full_name AS owner_name,
    u.phone AS owner_phone
FROM lands l
JOIN users u ON l.owner_id = u.id
WHERE l.status = 'approved' 
  AND l.acres >= 5.0
  AND l.location LIKE '%Guntur%'
ORDER BY l.lease_price ASC
LIMIT 10 OFFSET 0;

-- 2. INSERT a new land listing
INSERT INTO lands 
(owner_id, land_name, location, district, state, acres, soil_type, water_source, electricity, road_access, suitable_crops, lease_price, lease_duration_months, description, status)
VALUES 
(2, 'Sunshine Citrus Orchard', 'Prakasam', 'Prakasam', 'Andhra Pradesh', 12.00, 'Red Sandy Soil', 'Borewell + Drip', 'yes', 'yes', 'Sweet Lime, Mango', 95000.00, 36, 'Established orchard with yielding sweet lime trees.', 'approved');

-- 3. UPDATE land listing details
UPDATE lands
SET land_name = 'Green Valley Premium Farm',
    lease_price = 42000.00,
    description = 'Updated: Fertile black soil land with high-yield groundwater borewell and brand new fencing.'
WHERE id = 1 AND owner_id = 2;

-- 4. DELETE a land listing
DELETE FROM lands
WHERE id = 99 AND owner_id = 2;

-- 5. JOIN & GROUP BY for Landowner Dashboard Statistics (COUNT, SUM)
SELECT 
    owner_id,
    COUNT(l.id) AS total_lands,
    SUM(CASE WHEN l.status = 'approved' THEN 1 ELSE 0 END) AS active_lands,
    COALESCE(SUM(les.annual_price), 0.00) AS total_earnings
FROM lands l
LEFT JOIN leases les ON l.id = les.land_id AND les.status = 'active'
WHERE l.owner_id = 2
GROUP BY owner_id;

-- 6. Farmer Dashboard Summary (COUNT, SUM, AVG)
SELECT 
    f.id AS farmer_id,
    COUNT(DISTINCT les.id) AS active_leases,
    COUNT(DISTINCT app.id) AS total_applications,
    COALESCE(SUM(p.amount), 0.00) AS total_spent,
    AVG(p.amount) AS avg_payment_amount
FROM users f
LEFT JOIN lease_applications app ON f.id = app.farmer_id
LEFT JOIN leases les ON f.id = les.farmer_id AND les.status = 'active'
LEFT JOIN payments p ON f.id = p.payer_id AND p.status = 'successful'
WHERE f.id = 1
GROUP BY f.id;

-- 7. Marketplace Product search with Farmer Info (JOIN, WHERE, LIKE)
SELECT 
    pr.id,
    pr.product_name,
    pr.category,
    pr.price_per_unit,
    pr.unit,
    pr.available_qty,
    pr.location,
    u.full_name AS farmer_name,
    u.phone AS farmer_contact
FROM products pr
JOIN users u ON pr.farmer_id = u.id
WHERE pr.status = 'available'
  AND (pr.product_name LIKE '%Rice%' OR pr.category = 'Grains')
ORDER BY pr.created_at DESC;

-- 8. Buyer Order Breakdown (JOIN 3 tables: orders, order_items, products)
SELECT 
    o.id AS order_id,
    o.grand_total,
    o.order_status,
    o.payment_method,
    oi.quantity,
    oi.unit_price,
    oi.subtotal,
    p.product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.buyer_id = 3
ORDER BY o.created_at DESC;

-- 9. Admin Platform Metrics (Aggregations)
SELECT 
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'farmer') AS total_farmers,
    (SELECT COUNT(*) FROM users WHERE role = 'buyer') AS total_buyers,
    (SELECT COUNT(*) FROM users WHERE role = 'landowner') AS total_landowners,
    (SELECT COUNT(*) FROM lands) AS total_lands,
    (SELECT COUNT(*) FROM lands WHERE status = 'pending') AS pending_land_approvals,
    (SELECT COUNT(*) FROM orders) AS total_orders,
    (SELECT COUNT(*) FROM transactions) AS total_transactions,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'successful') AS total_revenue;
