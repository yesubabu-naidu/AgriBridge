-- AgriBridge PostgreSQL / Supabase / Neon migration
-- Adds optional Cloudinary metadata used by current upload routes.

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_cloudinary_public_id VARCHAR(512);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_cloudinary_resource_type VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_original_file_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_mime_type VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file_size BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_storage_provider VARCHAR(20);

ALTER TABLE land_images ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(512);
ALTER TABLE land_images ADD COLUMN IF NOT EXISTS cloudinary_resource_type VARCHAR(32);
ALTER TABLE land_images ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255);
ALTER TABLE land_images ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE land_images ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE land_images ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(20);

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_cloudinary_public_id VARCHAR(512);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_cloudinary_resource_type VARCHAR(32);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_original_file_name VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_mime_type VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_file_size BIGINT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_storage_provider VARCHAR(20);

ALTER TABLE landowner_profiles ADD COLUMN IF NOT EXISTS id_proof_url TEXT;
ALTER TABLE landowner_profiles ADD COLUMN IF NOT EXISTS id_proof_cloudinary_public_id VARCHAR(512);
ALTER TABLE landowner_profiles ADD COLUMN IF NOT EXISTS id_proof_cloudinary_resource_type VARCHAR(32);
ALTER TABLE landowner_profiles ADD COLUMN IF NOT EXISTS id_proof_original_file_name VARCHAR(255);
ALTER TABLE landowner_profiles ADD COLUMN IF NOT EXISTS id_proof_mime_type VARCHAR(100);
ALTER TABLE landowner_profiles ADD COLUMN IF NOT EXISTS id_proof_file_size BIGINT;
ALTER TABLE landowner_profiles ADD COLUMN IF NOT EXISTS id_proof_storage_provider VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_land_images_cloudinary_public_id ON land_images(cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_products_cloudinary_public_id ON products(image_cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_users_cloudinary_public_id ON users(avatar_cloudinary_public_id);
