-- Add Google OAuth support to users table
-- This migration adds fields to support Google OAuth authentication

-- Add Google OAuth fields to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(100) NULL COMMENT 'Google OAuth ID',
ADD COLUMN auth_provider ENUM('local', 'google') DEFAULT 'local' COMMENT 'Authentication provider used',
ADD INDEX idx_users_google_id (google_id),
ADD INDEX idx_users_auth_provider (auth_provider);

-- Make email unique only for local auth users (Google users might have same email)
-- We'll handle this in the application logic
-- Note: This is a complex change, so we'll handle email uniqueness in the application layer
