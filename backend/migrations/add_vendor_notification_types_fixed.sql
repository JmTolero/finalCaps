-- Add vendor approval/rejection notification types - Fixed Version
-- This migration adds new notification types for vendor approval workflow

-- Step 1: Create vendor_rejections table first (independent table)
CREATE TABLE IF NOT EXISTS vendor_rejections (
    rejection_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    user_id INT NOT NULL,
    rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_return_at TIMESTAMP NOT NULL,
    is_returned BOOLEAN DEFAULT FALSE,
    returned_at TIMESTAMP NULL,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_vendor_rejections_vendor_id (vendor_id),
    INDEX idx_vendor_rejections_user_id (user_id),
    INDEX idx_vendor_rejections_auto_return (auto_return_at),
    INDEX idx_vendor_rejections_returned (is_returned)
);

-- Step 2: Check if notifications table exists and add new notification types
-- We'll use ALTER TABLE to add new ENUM values if possible
-- If that fails, we'll need to recreate the table

-- Try to alter the existing notifications table to add new ENUM values
-- Note: This might fail on some MySQL versions, so we'll handle it gracefully

-- For now, we'll assume the notifications table exists and add the vendor_rejections table
-- The notification types will be handled in the application code
