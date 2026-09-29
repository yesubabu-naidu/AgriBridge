-- =========================================================
-- AgriBridge Seed Data (Cloud MySQL Compatible)
-- Database: agribridge
-- =========================================================

USE agribridge;

-- 1. USERS
-- Passwords are hashed representation of "password123"
INSERT INTO users (id, full_name, email, password_hash, role, phone, status) VALUES
(1, 'Ramesh Babu', 'farmer@agribridge.com', '$2a$10$w099gSg8pms.c7N0L6D76.vQc1T8aB3kU3/pZ0hZ.lV4Y1Sg7655u', 'farmer', '+91 98765 43210', 'active'),
(2, 'Venkatesh Rao', 'landowner@agribridge.com', '$2a$10$w099gSg8pms.c7N0L6D76.vQc1T8aB3kU3/pZ0hZ.lV4Y1Sg7655u', 'landowner', '+91 91234 56789', 'active'),
(3, 'Priya Sharma', 'buyer@agribridge.com', '$2a$10$w099gSg8pms.c7N0L6D76.vQc1T8aB3kU3/pZ0hZ.lV4Y1Sg7655u', 'buyer', '+91 99887 76655', 'active'),
(4, 'Admin Officer', 'admin@agribridge.com', '$2a$10$w099gSg8pms.c7N0L6D76.vQc1T8aB3kU3/pZ0hZ.lV4Y1Sg7655u', 'admin', '+91 90000 00000', 'active'),
(5, 'Suresh Kumar', 'suresh@farmer.com', '$2a$10$w099gSg8pms.c7N0L6D76.vQc1T8aB3kU3/pZ0hZ.lV4Y1Sg7655u', 'farmer', '+91 98111 22233', 'active'),
(6, 'Anita Reddy', 'anita@landowner.com', '$2a$10$w099gSg8pms.c7N0L6D76.vQc1T8aB3kU3/pZ0hZ.lV4Y1Sg7655u', 'landowner', '+91 97777 88899', 'active');

-- 2. FARMER PROFILES
INSERT INTO farmer_profiles (user_id, farm_size_acres, primary_crops, experience_years, location, district, state) VALUES
(1, 8.50, 'Cotton, Groundnut, Paddy', 12, 'Ongole', 'Prakasam', 'Andhra Pradesh'),
(5, 5.00, 'Chilli, Maize', 7, 'Guntur', 'Guntur', 'Andhra Pradesh');

-- 3. BUYER PROFILES
INSERT INTO buyer_profiles (user_id, company_name, buyer_type, shipping_address, city, state, pincode) VALUES
(3, 'GreenEarth Spices Ltd', 'wholesaler', '12 Agritech Park, MG Road', 'Vijayawada', 'Andhra Pradesh', '520002');

-- 4. LANDOWNER PROFILES
INSERT INTO landowner_profiles (user_id, total_land_acres, verification_status, id_proof_type, id_proof_number) VALUES
(2, 25.00, 'verified', 'Aadhaar', '9988-7766-5544'),
(6, 18.00, 'verified', 'PAN', 'ABCDE1234F');

-- 5. LANDS
INSERT INTO lands (id, owner_id, land_name, location, district, state, acres, soil_type, water_source, electricity, road_access, suitable_crops, lease_price, lease_duration_months, description, status, rating) VALUES
(1, 2, 'Green Valley Farm', 'Ongole', 'Prakasam', 'Andhra Pradesh', 5.20, 'Black Soil', 'Borewell', 'yes', 'yes', 'Cotton, Chilli, Groundnut', 40000.00, 12, 'Fertile black soil land with high-yield groundwater borewell and direct tar road connectivity.', 'approved', 4.85),
(2, 2, 'Riverbank Fertile Fields', 'Guntur', 'Guntur', 'Andhra Pradesh', 8.00, 'Alluvial Soil', 'Canal', 'yes', 'yes', 'Paddy, Sugarcane, Banana', 65000.00, 24, 'Prime agricultural land located right near Krishna canal with round-the-clock water availability.', 'approved', 4.90),
(3, 6, 'Coastal Agritech Plot', 'Nellore', 'SPSR Nellore', 'Andhra Pradesh', 6.50, 'Red Sandy Loam', 'Borewell', 'yes', 'yes', 'Groundnut, Pulses, Aqua', 48000.00, 12, 'Well-drained red soil field with modern drip irrigation installed.', 'approved', 4.75),
(4, 6, 'Krishna Basin Acres', 'Vijayawada', 'NTR', 'Andhra Pradesh', 10.00, 'Black Cotton Soil', 'Canal + Borewell', 'yes', 'yes', 'Chilli, Maize, Vegetables', 85000.00, 36, 'Massive 10-acre fertile plain ideal for organic commercial cultivation.', 'approved', 4.95),
(5, 2, 'Rayalaseema Organic Farm', 'Kurnool', 'Kurnool', 'Andhra Pradesh', 4.00, 'Red Soil', 'Borewell', 'yes', 'no', 'Millets, Sunflower, Castor', 32000.00, 12, 'Quiet farmland suitable for dryland crops and organic millet farming.', 'approved', 4.60);

-- 6. LAND IMAGES
INSERT INTO land_images (land_id, image_url, is_primary) VALUES
(1, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', TRUE),
(2, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800', TRUE),
(3, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800', TRUE),
(4, 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800', TRUE),
(5, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800', TRUE);

-- 7. LEASE APPLICATIONS
INSERT INTO lease_applications (id, land_id, farmer_id, proposed_duration_months, proposed_price, message, status) VALUES
(1, 1, 1, 12, 40000.00, 'I plan to cultivate organic cotton and groundnut using drip irrigation.', 'approved'),
(2, 2, 1, 24, 62000.00, 'Looking for long term paddy farming lease.', 'pending'),
(3, 3, 5, 12, 45000.00, 'Will cultivate premium Guntur red chillies.', 'approved');

-- 8. LEASES
INSERT INTO leases (id, application_id, land_id, farmer_id, owner_id, start_date, end_date, annual_price, payment_status, status) VALUES
(1, 1, 1, 1, 2, '2026-01-01', '2026-12-31', 40000.00, 'paid', 'active'),
(2, 3, 3, 5, 6, '2026-02-01', '2027-01-31', 45000.00, 'pending', 'active');

-- 9. PRODUCTS (Produce Marketplace)
INSERT INTO products (id, farmer_id, product_name, category, price_per_unit, unit, available_qty, location, image_url, rating, description, status) VALUES
(1, 1, 'Organic Sona Masoori Rice', 'Grains', 65.00, 'kg', 1200.00, 'Ongole', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', 4.90, 'Freshly harvested unpolished organic rice direct from farm.', 'available'),
(2, 5, 'Guntur Red Chilli (Teja)', 'Spices', 210.00, 'kg', 450.00, 'Guntur', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=600', 4.95, 'High pungency premium quality Guntur red chillies.', 'available'),
(3, 1, 'Fresh Farm Tomatoes', 'Vegetables', 28.00, 'kg', 800.00, 'Ongole', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600', 4.80, 'Vine-ripened pesticide-free farm fresh tomatoes.', 'available'),
<<<<<<< HEAD
(4, 5, 'Yellow Corn Maize', 'Grains', 34.00, 'kg', 2500.00, 'Guntur', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600', 4.75, 'High grade dried yellow corn suitable for feed or flour.', 'available'),
=======
>>>>>>> e4e5f45 (added new features to project)
(5, 1, 'Raw Organic Cotton', 'Fiber', 82.00, 'kg', 900.00, 'Ongole', 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600', 4.88, 'Long-staple clean white cotton bales.', 'available');

-- 10. CART
INSERT INTO cart (user_id, product_id, quantity) VALUES
(3, 1, 50.00),
(3, 2, 10.00);

-- 11. ORDERS
INSERT INTO orders (id, buyer_id, total_amount, delivery_fee, platform_fee, tax_amount, grand_total, shipping_address, payment_method, payment_status, order_status) VALUES
(1, 3, 5350.00, 200.00, 50.00, 267.50, 5867.50, '12 Agritech Park, MG Road, Vijayawada', 'UPI', 'successful', 'delivered');

-- 12. ORDER ITEMS
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 50.00, 65.00, 3250.00),
(1, 2, 10.00, 210.00, 2100.00);

-- 13. PAYMENTS
INSERT INTO payments (id, reference_type, reference_id, payer_id, amount, payment_method, status, transaction_id) VALUES
(1, 'lease', 1, 1, 40000.00, 'UPI', 'successful', 'AGRI2026082900123'),
(2, 'order', 1, 3, 5867.50, 'UPI', 'successful', 'AGRI2026082900456');

-- 14. TRANSACTIONS
INSERT INTO transactions (id, transaction_id, user_id, type, amount, payment_method, status, reference_id, description) VALUES
(1, 'AGRI2026082900123', 1, 'lease_payment', 40000.00, 'UPI', 'successful', 'LEASE-001', 'Lease payment for Green Valley Farm'),
(2, 'AGRI2026082900456', 3, 'order_payment', 5867.50, 'UPI', 'successful', 'ORD-001', 'Purchase of Sona Masoori Rice & Red Chilli');

-- 15. WISHLIST
INSERT INTO wishlist (user_id, item_type, item_id) VALUES
(1, 'land', 2),
(3, 'product', 3);

-- 16. MESSAGES
INSERT INTO messages (sender_id, receiver_id, subject, message_body, is_read) VALUES
(1, 2, 'Lease Agreement Inquiry', 'Hello Venkatesh garu, I have submitted a lease application for Green Valley Farm.', TRUE);

-- 17. NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(1, 'Lease Approved!', 'Your application for Green Valley Farm has been accepted by Venkatesh Rao.', 'lease', FALSE),
(3, 'Order Dispatched', 'Your order #ORD-001 has been shipped via AgriBridge Express.', 'order', TRUE);

-- 18. REVIEWS
INSERT INTO reviews (user_id, target_type, target_id, rating, comment) VALUES
(1, 'land', 1, 5, 'Excellent land with genuine water supply. Soil is extremely fertile.'),
(3, 'product', 1, 5, 'Rice quality is top notch. Delivery was fast and well packaged.');

-- 19. ADMIN ACTIONS
INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details) VALUES
(4, 'APPROVE_LAND', 'land', 1, 'Verified land title deed and borewell water report.');
