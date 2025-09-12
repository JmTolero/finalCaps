-- Migration: Add user account status field
-- Date: 2024
-- Description: Add status field to users table for account management

-- Add status column to users table
ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' AFTER role;

-- Add index for better performance on status queries
CREATE INDEX idx_users_status ON users(status);

-- Update existing users to have 'active' status (they're already using the system)
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Optional: Add a comment to document the field
ALTER TABLE users MODIFY COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT 'User account status: active=can login, inactive=disabled, suspended=temporarily blocked';
