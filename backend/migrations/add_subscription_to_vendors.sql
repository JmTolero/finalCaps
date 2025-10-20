-- Migration: Add subscription fields to vendors table
-- Date: 2024
-- Description: Add subscription plan and limits to existing vendors table

-- Add subscription fields to vendors table
ALTER TABLE vendors ADD COLUMN subscription_plan ENUM('free', 'professional', 'premium') DEFAULT 'free' AFTER status;
ALTER TABLE vendors ADD COLUMN flavor_limit INT(11) DEFAULT 5 AFTER subscription_plan;
ALTER TABLE vendors ADD COLUMN drum_limit INT(11) DEFAULT 5 AFTER flavor_limit;
ALTER TABLE vendors ADD COLUMN order_limit INT(11) DEFAULT 50 AFTER drum_limit;
ALTER TABLE vendors ADD COLUMN subscription_start_date DATE NULL AFTER order_limit;
ALTER TABLE vendors ADD COLUMN subscription_end_date DATE NULL AFTER subscription_start_date;

-- Create indexes for better performance
CREATE INDEX idx_vendors_subscription_plan ON vendors(subscription_plan);
CREATE INDEX idx_vendors_subscription_dates ON vendors(subscription_start_date, subscription_end_date);

-- Update existing vendors to have proper limits based on their current plan
UPDATE vendors SET 
    subscription_plan = 'free',
    flavor_limit = 5,
    drum_limit = 5,
    order_limit = 50,
    subscription_start_date = CURDATE()
WHERE subscription_plan IS NULL;
