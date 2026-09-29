-- MySQL 8.0 migration for Cloudinary-backed media.
-- Existing avatar/image_url values are preserved until a successful upload replaces them.

ALTER TABLE users
  ADD COLUMN avatar_cloudinary_public_id VARCHAR(512) NULL,
  ADD COLUMN avatar_cloudinary_resource_type VARCHAR(32) NULL,
  ADD COLUMN avatar_original_file_name VARCHAR(255) NULL,
  ADD COLUMN avatar_mime_type VARCHAR(100) NULL,
  ADD COLUMN avatar_file_size BIGINT UNSIGNED NULL,
  ADD COLUMN avatar_storage_provider VARCHAR(20) NULL;

ALTER TABLE land_images
  ADD COLUMN cloudinary_public_id VARCHAR(512) NULL,
  ADD COLUMN cloudinary_resource_type VARCHAR(32) NULL,
  ADD COLUMN original_file_name VARCHAR(255) NULL,
  ADD COLUMN mime_type VARCHAR(100) NULL,
  ADD COLUMN file_size BIGINT UNSIGNED NULL,
  ADD COLUMN storage_provider VARCHAR(20) NULL;

ALTER TABLE products
  ADD COLUMN image_cloudinary_public_id VARCHAR(512) NULL,
  ADD COLUMN image_cloudinary_resource_type VARCHAR(32) NULL,
  ADD COLUMN image_original_file_name VARCHAR(255) NULL,
  ADD COLUMN image_mime_type VARCHAR(100) NULL,
  ADD COLUMN image_file_size BIGINT UNSIGNED NULL,
  ADD COLUMN image_storage_provider VARCHAR(20) NULL;

ALTER TABLE landowner_profiles
  ADD COLUMN id_proof_url TEXT NULL,
  ADD COLUMN id_proof_cloudinary_public_id VARCHAR(512) NULL,
  ADD COLUMN id_proof_cloudinary_resource_type VARCHAR(32) NULL,
  ADD COLUMN id_proof_original_file_name VARCHAR(255) NULL,
  ADD COLUMN id_proof_mime_type VARCHAR(100) NULL,
  ADD COLUMN id_proof_file_size BIGINT UNSIGNED NULL,
  ADD COLUMN id_proof_storage_provider VARCHAR(20) NULL;

CREATE INDEX idx_land_images_cloudinary_public_id ON land_images (cloudinary_public_id(191));
CREATE INDEX idx_products_cloudinary_public_id ON products (image_cloudinary_public_id(191));
CREATE INDEX idx_users_cloudinary_public_id ON users (avatar_cloudinary_public_id(191));
