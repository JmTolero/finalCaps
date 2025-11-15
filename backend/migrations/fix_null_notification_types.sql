-- Quick fix for the NULL value error
-- Run this if you've already started the migration

-- Temporarily disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Set any NULL values in notification_type_new to 'system_announcement'
UPDATE notifications 
SET notification_type_new = 'system_announcement'
WHERE notification_type_new IS NULL;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Now you can proceed with Step 5 of the main migration
-- Rename the new column to the original name
ALTER TABLE notifications CHANGE COLUMN notification_type_new notification_type ENUM(
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
    'review_received',
    'vendor_approved',
    'vendor_rejected',
    'vendor_return_available',
    'subscription_upgraded',
    'subscription_payment_success',
    'subscription_payment_failed'
) NOT NULL;


