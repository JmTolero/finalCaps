-- Add subscription notification types
-- This migration adds notification types for subscription upgrades and payments

-- Step 1: Check current ENUM values
-- First, let's see what values currently exist
-- Run this query manually to see existing notification types:
-- SELECT DISTINCT notification_type FROM notifications ORDER BY notification_type;

-- Step 2: Safe migration approach - Add new column with updated ENUM
ALTER TABLE notifications ADD COLUMN notification_type_new ENUM(
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
) NULL AFTER notification_type;

-- Step 3: Copy data from old column to new column
UPDATE notifications 
SET notification_type_new = notification_type
WHERE notification_type IN (
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
    'vendor_return_available'
);

-- Step 3b: Set any remaining NULL values to 'system_announcement' (for invalid/unknown types)
-- This handles any notifications with types not in the ENUM list
UPDATE notifications 
SET notification_type_new = 'system_announcement'
WHERE notification_type_new IS NULL;

-- Step 4: Drop the old column
ALTER TABLE notifications DROP COLUMN notification_type;

-- Step 5: Rename the new column to the original name
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

