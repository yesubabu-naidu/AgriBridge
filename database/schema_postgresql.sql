-- =========================================================
-- AgriBridge Cloud PostgreSQL Database Schema
-- Database: agribridge (PostgreSQL 14+ / Supabase / Neon / Render Postgres)
-- =========================================================

-- Enable Extension for UUIDs if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'landowner', 'admin')),
  phone VARCHAR(20),
  avatar VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. FARMER PROFILES
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  farm_size_acres NUMERIC(8,2) DEFAULT 0.00,
  primary_crops VARCHAR(255),
  experience_years INT DEFAULT 0,
  location VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. BUYER PROFILES
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(150),
  buyer_type VARCHAR(20) DEFAULT 'individual' CHECK (buyer_type IN ('individual', 'wholesaler', 'retailer', 'processor')),
  shipping_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. LANDOWNER PROFILES
CREATE TABLE IF NOT EXISTS landowner_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_land_acres NUMERIC(8,2) DEFAULT 0.00,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'rejected')),
  id_proof_type VARCHAR(50),
  id_proof_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. LANDS
CREATE TABLE IF NOT EXISTS lands (
  id SERIAL PRIMARY KEY,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  land_name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  acres NUMERIC(8,2) NOT NULL,
  soil_type VARCHAR(100) NOT NULL,
  water_source VARCHAR(100) NOT NULL,
  electricity VARCHAR(10) DEFAULT 'yes' CHECK (electricity IN ('yes', 'no')),
  road_access VARCHAR(10) DEFAULT 'yes' CHECK (road_access IN ('yes', 'no')),
  suitable_crops VARCHAR(255),
  lease_price NUMERIC(12,2) NOT NULL,
  lease_duration_months INT DEFAULT 12,
  description TEXT,
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected', 'leased')),
  rating NUMERIC(3,2) DEFAULT 4.80,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lands_location ON lands(location);
CREATE INDEX IF NOT EXISTS idx_lands_status ON lands(status);
CREATE INDEX IF NOT EXISTS idx_lands_acres ON lands(acres);
CREATE INDEX IF NOT EXISTS idx_lands_price ON lands(lease_price);

-- 6. LAND IMAGES
CREATE TABLE IF NOT EXISTS land_images (
  id SERIAL PRIMARY KEY,
  land_id INT NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. LEASE APPLICATIONS
CREATE TABLE IF NOT EXISTS lease_applications (
  id SERIAL PRIMARY KEY,
  land_id INT NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  farmer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_duration_months INT DEFAULT 12,
  proposed_price NUMERIC(12,2) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. LEASES
CREATE TABLE IF NOT EXISTS leases (
  id SERIAL PRIMARY KEY,
  application_id INT UNIQUE REFERENCES lease_applications(id) ON DELETE SET NULL,
  land_id INT NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  farmer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  annual_price NUMERIC(12,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. PRODUCTS (Marketplace Produce)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  farmer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price_per_unit NUMERIC(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  available_qty NUMERIC(10,2) NOT NULL,
  location VARCHAR(100),
  image_url TEXT,
  rating NUMERIC(3,2) DEFAULT 4.90,
  description TEXT,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'out_of_stock', 'unlisted')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. CART
CREATE TABLE IF NOT EXISTS cart (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- 11. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  buyer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL,
  delivery_fee NUMERIC(8,2) DEFAULT 150.00,
  platform_fee NUMERIC(8,2) DEFAULT 50.00,
  tax_amount NUMERIC(8,2) DEFAULT 0.00,
  grand_total NUMERIC(12,2) NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Card', 'Net Banking', 'Wallet', 'COD')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'successful', 'failed', 'refunded')),
  order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  farmer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_name VARCHAR(120) NOT NULL,
  quantity_kg NUMERIC(10,2) NOT NULL,
  price_per_kg NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL
);

-- 13. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('lease', 'order')),
  reference_id INT NOT NULL,
  payer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('UPI', 'Card', 'Net Banking', 'Wallet', 'COD')),
  status VARCHAR(20) DEFAULT 'successful' CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('lease_payment', 'order_payment', 'payout', 'refund')),
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'successful' CHECK (status IN ('successful', 'pending', 'failed', 'refunded')),
  reference_id VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. IRRIGATION FIELDS
CREATE TABLE IF NOT EXISTS irrigation_fields (
  id SERIAL PRIMARY KEY,
  farmer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  area_acres NUMERIC(8,2) DEFAULT 1.00,
  crop_type VARCHAR(50) DEFAULT 'Tomato',
  growth_stage VARCHAR(50) DEFAULT 'Vegetative',
  soil_type VARCHAR(50) DEFAULT 'Loamy',
  irrigation_method VARCHAR(50) DEFAULT 'Drip',
  available_water_litres NUMERIC(12,2) DEFAULT 50000.00,
  last_irrigation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. CHAT CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS chat_conversations (
  id VARCHAR(64) PRIMARY KEY,
  farmer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Agricultural Consultation',
  language VARCHAR(20) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'GENERAL_AGRICULTURE',
  sources_json TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. FARMER AGRICULTURAL CONTEXT
CREATE TABLE IF NOT EXISTS farmer_agricultural_context (
  id SERIAL PRIMARY KEY,
  farmer_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  location VARCHAR(100) DEFAULT 'Ongole',
  district VARCHAR(100) DEFAULT 'Prakasam',
  state VARCHAR(100) DEFAULT 'Andhra Pradesh',
  country VARCHAR(100) DEFAULT 'India',
  primary_crops VARCHAR(255) DEFAULT 'Paddy, Tomato, Chilli, Cotton',
  soil_type VARCHAR(50) DEFAULT 'Loamy',
  irrigation_method VARCHAR(50) DEFAULT 'Drip',
  season VARCHAR(50) DEFAULT 'Kharif',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 18. WEATHER FORECAST CACHE
CREATE TABLE IF NOT EXISTS weather_cache (
  id SERIAL PRIMARY KEY,
  location VARCHAR(150) NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  forecast_json TEXT NOT NULL,
  ai_analysis_json TEXT,
  fetched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL
);
