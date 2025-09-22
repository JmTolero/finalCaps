-- Add vendor approval/rejection notification types
-- This migration adds new notification types for vendor approval workflow

-- First, let's modify the notifications table to include new notification types
-- We need to drop and recreate the ENUM to add new values

-- Step 1: Create a temporary table with the new ENUM values
CREATE TABLE IF NOT EXISTS notifications_temp (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('customer', 'vendor') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM(
        'order_placed',
        'order_accepted', 
        'order_rejected',
        'order_preparing',
        'order_ready',
        'order_delivered',
        'order_cancelled',
        'payment_confirmed',
        'payment_failed',
        'drum_return_requested',
        'drum_picked_up',
        'system_announcement',
        'vendor_approved',
        'vendor_rejected',
        'vendor_return_available'
    ) NOT NULL,
    related_order_id INT NULL,
    related_vendor_id INT NULL,
    related_customer_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_notifications (user_id, user_type),
    INDEX idx_notification_type (notification_type),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
);

-- Step 2: Copy data from existing notifications table (if it exists)
INSERT INTO notifications_temp 
SELECT * FROM notifications 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications');

-- Step 3: Drop the old notifications table
DROP TABLE IF EXISTS notifications;

-- Step 4: Rename the temporary table to notifications
RENAME TABLE notifications_temp TO notifications;

-- Step 5: Add a new table to track vendor rejection and auto-return
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
