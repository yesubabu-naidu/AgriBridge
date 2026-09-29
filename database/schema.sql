-- =========================================================
-- AgriBridge Database Schema (Cloud MySQL Compatible)
-- Database: agribridge
-- =========================================================

CREATE DATABASE IF NOT EXISTS agribridge;
USE agribridge;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('farmer', 'buyer', 'landowner', 'admin') NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. FARMER PROFILES
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  farm_size_acres DECIMAL(8,2) DEFAULT 0.00,
  primary_crops VARCHAR(255),
  experience_years INT DEFAULT 0,
  location VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. BUYER PROFILES
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  company_name VARCHAR(150),
  buyer_type ENUM('individual', 'wholesaler', 'retailer', 'processor') DEFAULT 'individual',
  shipping_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. LANDOWNER PROFILES
CREATE TABLE IF NOT EXISTS landowner_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  total_land_acres DECIMAL(8,2) DEFAULT 0.00,
  verification_status ENUM('verified', 'pending', 'rejected') DEFAULT 'pending',
  id_proof_type VARCHAR(50),
  id_proof_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. LANDS
CREATE TABLE IF NOT EXISTS lands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  land_name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  acres DECIMAL(8,2) NOT NULL,
  soil_type VARCHAR(100) NOT NULL,
  water_source VARCHAR(100) NOT NULL,
  electricity ENUM('yes', 'no') DEFAULT 'yes',
  road_access ENUM('yes', 'no') DEFAULT 'yes',
  suitable_crops VARCHAR(255),
  lease_price DECIMAL(12,2) NOT NULL,
  lease_duration_months INT DEFAULT 12,
  description TEXT,
  status ENUM('approved', 'pending', 'rejected', 'leased') DEFAULT 'approved',
  rating DECIMAL(3,2) DEFAULT 4.80,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_location (location),
  INDEX idx_status (status),
  INDEX idx_acres (acres),
  INDEX idx_price (lease_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. LAND IMAGES
CREATE TABLE IF NOT EXISTS land_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  land_id INT NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. LEASE APPLICATIONS
CREATE TABLE IF NOT EXISTS lease_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  land_id INT NOT NULL,
  farmer_id INT NOT NULL,
  proposed_duration_months INT DEFAULT 12,
  proposed_price DECIMAL(12,2) NOT NULL,
  message TEXT,
  status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_app_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. LEASES
CREATE TABLE IF NOT EXISTS leases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNIQUE,
  land_id INT NOT NULL,
  farmer_id INT NOT NULL,
  owner_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  annual_price DECIMAL(12,2) NOT NULL,
  payment_status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES lease_applications(id) ON DELETE SET NULL,
  FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. PRODUCTS (Marketplace Produce)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  available_qty DECIMAL(10,2) NOT NULL,
  location VARCHAR(100),
  image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 4.90,
  description TEXT,
  status ENUM('available', 'out_of_stock', 'unlisted') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. CART
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  delivery_fee DECIMAL(8,2) DEFAULT 150.00,
  platform_fee DECIMAL(8,2) DEFAULT 50.00,
  tax_amount DECIMAL(8,2) DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_method ENUM('UPI', 'Card', 'Net Banking', 'Wallet', 'COD') DEFAULT 'UPI',
  payment_status ENUM('pending', 'successful', 'failed', 'refunded') DEFAULT 'pending',
  order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_buyer_order (buyer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
<<<<<<< HEAD
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
=======
  farmer_id INT NOT NULL,
  crop_name VARCHAR(120) NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
>>>>>>> e4e5f45 (added new features to project)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_type ENUM('lease', 'order') NOT NULL,
  reference_id INT NOT NULL,
  payer_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('UPI', 'Card', 'Net Banking', 'Wallet', 'COD') NOT NULL,
  status ENUM('pending', 'successful', 'failed', 'refunded') DEFAULT 'successful',
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  type ENUM('lease_payment', 'order_payment', 'payout', 'refund') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status ENUM('successful', 'pending', 'failed', 'refunded') DEFAULT 'successful',
  reference_id VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_tx (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. WISHLIST
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_type ENUM('land', 'product') NOT NULL,
  item_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_wishlist (user_id, item_type, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  subject VARCHAR(150),
  message_body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('lease', 'order', 'payment', 'system') DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  target_type ENUM('land', 'product', 'landowner') NOT NULL,
  target_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. ADMIN ACTIONS
CREATE TABLE IF NOT EXISTS admin_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- SMART IRRIGATION MODULE TABLES
-- =========================================================

-- 20. IRRIGATION FIELDS
CREATE TABLE IF NOT EXISTS irrigation_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  area_acres DECIMAL(8,2) DEFAULT 1.00,
  crop_type VARCHAR(50) DEFAULT 'Tomato',
  growth_stage VARCHAR(50) DEFAULT 'Vegetative',
  soil_type VARCHAR(50) DEFAULT 'Loamy',
  irrigation_method VARCHAR(50) DEFAULT 'Drip',
  available_water_litres DECIMAL(12,2) DEFAULT 50000.00,
  last_irrigation_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. SOIL DATA
CREATE TABLE IF NOT EXISTS soil_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  field_id INT NOT NULL,
  soil_moisture DECIMAL(5,2) NOT NULL DEFAULT 35.00,
  soil_type VARCHAR(50) DEFAULT 'Loamy',
  ph_level DECIMAL(4,2) DEFAULT 6.80,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES irrigation_fields(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. WEATHER DATA
CREATE TABLE IF NOT EXISTS weather_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  field_id INT NOT NULL,
  temperature DECIMAL(5,2) NOT NULL DEFAULT 32.00,
  humidity DECIMAL(5,2) NOT NULL DEFAULT 45.00,
  rainfall_mm DECIMAL(5,2) DEFAULT 0.00,
  rain_probability DECIMAL(5,2) DEFAULT 10.00,
  wind_speed DECIMAL(5,2) DEFAULT 12.00,
  solar_radiation DECIMAL(5,2) DEFAULT 22.50,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES irrigation_fields(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. IRRIGATION RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS irrigation_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  field_id INT NOT NULL,
  farmer_id INT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  priority VARCHAR(20) DEFAULT 'Medium',
  water_litres DECIMAL(10,2) DEFAULT 2500.00,
  duration_minutes INT DEFAULT 40,
  best_method VARCHAR(50) DEFAULT 'Drip',
  best_time_window VARCHAR(100) DEFAULT '06:00 AM - 08:00 AM',
  reason_text TEXT,
  ai_insights TEXT,
  crop_water_req DECIMAL(8,2) DEFAULT 4.50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES irrigation_fields(id) ON DELETE CASCADE,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. IRRIGATION RECORDS
CREATE TABLE IF NOT EXISTS irrigation_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  field_id INT NOT NULL,
  farmer_id INT NOT NULL,
  recommendation_id INT NULL,
  water_used_litres DECIMAL(10,2) NOT NULL,
  duration_minutes INT NOT NULL,
  method_used VARCHAR(50) DEFAULT 'Drip',
  status ENUM('completed', 'scheduled', 'skipped') DEFAULT 'completed',
  scheduled_time TIMESTAMP NULL,
  executed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES irrigation_fields(id) ON DELETE CASCADE,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 25. WATER USAGE & SAVINGS
CREATE TABLE IF NOT EXISTS water_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  field_id INT NOT NULL,
  water_consumed_litres DECIMAL(10,2) DEFAULT 0.00,
  water_saved_litres DECIMAL(10,2) DEFAULT 0.00,
  record_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES irrigation_fields(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- AI AGRICULTURE CHATBOT & RAG KNOWLEDGE BASE TABLES
-- =========================================================

-- 26. AGRICULTURAL RAG KNOWLEDGE BASE
CREATE TABLE IF NOT EXISTS agriculture_knowledge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'GENERAL_AGRICULTURE',
  crop VARCHAR(50) DEFAULT 'ALL',
  language VARCHAR(10) DEFAULT 'en',
  content TEXT NOT NULL,
  keywords TEXT,
  source VARCHAR(255) DEFAULT 'ICAR & Krishi Vigyan Kendra Agronomic Guidelines',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FULLTEXT idx_search (title, content, keywords)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 27. CHAT CONVERSATIONS
CREATE TABLE IF NOT EXISTS chat_conversations (
  id VARCHAR(64) PRIMARY KEY,
  farmer_id INT NOT NULL,
  title VARCHAR(255) DEFAULT 'New Agricultural Consultation',
  language VARCHAR(20) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 28. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'GENERAL_AGRICULTURE',
  sources_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 29. FARMER AGRICULTURAL CONTEXT
CREATE TABLE IF NOT EXISTS farmer_agricultural_context (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL UNIQUE,
  location VARCHAR(100) DEFAULT 'Ongole',
  district VARCHAR(100) DEFAULT 'Prakasam',
  state VARCHAR(100) DEFAULT 'Andhra Pradesh',
  country VARCHAR(100) DEFAULT 'India',
  primary_crops VARCHAR(255) DEFAULT 'Paddy, Tomato, Chilli, Cotton',
  soil_type VARCHAR(50) DEFAULT 'Loamy',
  irrigation_method VARCHAR(50) DEFAULT 'Drip',
  season VARCHAR(50) DEFAULT 'Kharif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 30. WEATHER FORECAST CACHE
CREATE TABLE IF NOT EXISTS weather_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location VARCHAR(150) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  forecast_json LONGTEXT NOT NULL,
  ai_analysis_json LONGTEXT NULL,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_location (location, expires_at),
  INDEX idx_coords (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



