-- =========================================================
-- AgriBridge Complete Supabase Seed Script
-- Populates all Users, Lands, Products, Applications, Leases, Orders, Transactions & Irrigation
-- =========================================================

-- 1. USERS
INSERT INTO users (id, full_name, email, password_hash, password, role, phone, avatar, status) VALUES
(1, 'Ramesh Kumar', 'farmer@agribridge.com', '$2a$10$wN9Q...hash', 'Farmer@123', 'farmer', '+91 98765 43210', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'active'),
(2, 'Venkateswara Rao', 'landowner@agribridge.com', '$2a$10$wN9Q...hash', 'Landowner@123', 'landowner', '+91 98765 11111', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'active'),
(3, 'Srikanth Retailers', 'buyer@agribridge.com', '$2a$10$wN9Q...hash', 'Buyer@123', 'buyer', '+91 98765 22222', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'active'),
(4, 'Platform Administrator', 'admin@agribridge.com', '$2a$10$wN9Q...hash', 'Admin@123', 'admin', '+91 98765 99999', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'active')
ON CONFLICT (id) DO NOTHING;

-- Reset Sequence for Users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. FARMER PROFILES
INSERT INTO farmer_profiles (id, user_id, farm_size_acres, primary_crops, experience_years, location, district, state) VALUES
(1, 1, 5.50, 'Paddy, Tomato, Chilli, Cotton', 12, 'Ongole', 'Prakasam', 'Andhra Pradesh')
ON CONFLICT (id) DO NOTHING;

-- 3. LANDOWNER PROFILES
INSERT INTO landowner_profiles (id, user_id, total_land_acres, verification_status) VALUES
(1, 2, 13.50, 'verified')
ON CONFLICT (id) DO NOTHING;

-- 4. BUYER PROFILES
INSERT INTO buyer_profiles (id, user_id, company_name, buyer_type, shipping_address, city, state, pincode) VALUES
(1, 3, 'Srikanth Agro Foods Pvt Ltd', 'wholesaler', 'Door No 4-12, Market Yard Road, Guntur', 'Guntur', 'Andhra Pradesh', '522001')
ON CONFLICT (id) DO NOTHING;

-- 5. LANDS
INSERT INTO lands (id, owner_id, land_name, location, district, state, acres, soil_type, water_source, electricity, road_access, suitable_crops, lease_price, lease_duration_months, description, status, rating) VALUES
(1, 2, 'Green Acres Fertile Farm', 'Ongole', 'Prakasam', 'Andhra Pradesh', 5.50, 'Loamy', 'Borewell & Canal', 'yes', 'yes', 'Paddy, Tomato, Chilli', 45000.00, 12, 'Rich loamy soil with 24/7 drip irrigation and road connectivity.', 'approved', 4.90),
(2, 2, 'Krishna River Basin Land', 'Vijayawada', 'NTR District', 'Andhra Pradesh', 8.00, 'Black Cotton', 'River Lift Irrigation', 'yes', 'yes', 'Cotton, Maize, Turmeric', 60000.00, 12, 'Highly fertile river basin land suitable for intensive commercial crops.', 'approved', 4.85)
ON CONFLICT (id) DO NOTHING;

SELECT setval('lands_id_seq', (SELECT MAX(id) FROM lands));

-- 6. PRODUCTS (Produce Marketplace)
INSERT INTO products (id, farmer_id, product_name, category, price_per_unit, unit, available_qty, location, image_url, rating, description, status) VALUES
(1, 1, 'Organic BPT Sona Masoori Paddy', 'Grains', 38.00, 'kg', 5000.00, 'Ongole', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800', 4.95, 'Freshly harvested premium grade BPT 5204 Sona Masoori raw paddy.', 'available'),
(2, 1, 'Fresh Red Hybrid Tomatoes', 'Vegetables', 24.00, 'kg', 1200.00, 'Ongole', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800', 4.88, 'Farm fresh pesticide-free red tomatoes ideal for wholesale distribution.', 'available'),
(3, 1, 'Guntur Teja Red Chilli', 'Spices', 185.00, 'kg', 800.00, 'Guntur', 'https://images.unsplash.com/photo-1588879460618-924a7fd7fa86?w=800', 4.98, 'High pungency export quality Teja red chilli direct from farm harvest.', 'available')
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- 7. LEASE APPLICATIONS
INSERT INTO lease_applications (id, land_id, farmer_id, proposed_duration_months, proposed_price, message, status) VALUES
(1, 1, 1, 12, 45000.00, 'Interested in leasing Green Acres for Paddy cultivation during Kharif season.', 'approved')
ON CONFLICT (id) DO NOTHING;

SELECT setval('lease_applications_id_seq', (SELECT MAX(id) FROM lease_applications));

-- 8. LEASES
INSERT INTO leases (id, application_id, land_id, farmer_id, owner_id, start_date, end_date, annual_price, payment_status, status) VALUES
(1, 1, 1, 1, 2, '2026-06-01', '2027-05-31', 45000.00, 'paid', 'active')
ON CONFLICT (id) DO NOTHING;

SELECT setval('leases_id_seq', (SELECT MAX(id) FROM leases));

-- 9. ORDERS
INSERT INTO orders (id, buyer_id, total_amount, delivery_fee, platform_fee, grand_total, shipping_address, payment_method, payment_status, order_status) VALUES
(1, 3, 1900.00, 150.00, 50.00, 2100.00, 'Door No 4-12, Market Yard Road, Guntur, AP - 522001', 'UPI', 'successful', 'processing')
ON CONFLICT (id) DO NOTHING;

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- 10. TRANSACTIONS
INSERT INTO transactions (id, transaction_id, user_id, type, amount, payment_method, status, reference_id, description) VALUES
(1, 'AGRI1788019200000', 1, 'lease_payment', 45000.00, 'UPI', 'successful', 'LEASE-1', 'Lease fee payment for Green Acres Fertile Farm'),
(2, 'AGRI1788022800000', 3, 'order_payment', 2100.00, 'UPI', 'successful', 'ORD-1', 'Marketplace produce order checkout payment')
ON CONFLICT (id) DO NOTHING;

SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));

-- 11. IRRIGATION FIELDS
INSERT INTO irrigation_fields (id, farmer_id, field_name, area_acres, crop_type, growth_stage, soil_type, irrigation_method, available_water_litres) VALUES
(1, 1, 'Green Acres Field A', 2.50, 'Tomato', 'Vegetative', 'Loamy', 'Drip', 50000.00)
ON CONFLICT (id) DO NOTHING;

SELECT setval('irrigation_fields_id_seq', (SELECT MAX(id) FROM irrigation_fields));

-- 12. FARMER AGRICULTURAL CONTEXT
INSERT INTO farmer_agricultural_context (id, farmer_id, location, district, state, country, primary_crops, soil_type, irrigation_method, season) VALUES
(1, 1, 'Ongole', 'Prakasam', 'Andhra Pradesh', 'India', 'Paddy, Tomato, Chilli, Cotton', 'Loamy', 'Drip', 'Kharif')
ON CONFLICT (id) DO NOTHING;

SELECT setval('farmer_agricultural_context_id_seq', (SELECT MAX(id) FROM farmer_agricultural_context));
