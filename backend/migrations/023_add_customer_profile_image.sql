-- Migration: Add profile_image_url to users table for customer profile pictures
-- Created: 2025-01-10

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500) DEFAULT NULL 
COMMENT 'URL of user profile image stored in Cloudinary';

-- Index for faster lookups
CREATE INDEX idx_users_profile_image ON users(profile_image_url);

