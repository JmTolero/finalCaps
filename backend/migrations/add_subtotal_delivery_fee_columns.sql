-- Migration: Add subtotal and delivery_fee columns to orders table
-- Date: 2025-11-14
-- Purpose: Track subtotal and delivery fee breakdown in orders

-- Add subtotal column
ALTER TABLE orders 
ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0 
COMMENT 'Order subtotal (items total before delivery fee)';

-- Add delivery_fee column
ALTER TABLE orders 
ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0 
COMMENT 'Delivery fee for the order';

-- Add indexes for reporting
ALTER TABLE orders ADD INDEX idx_orders_subtotal (subtotal);
ALTER TABLE orders ADD INDEX idx_orders_delivery_fee (delivery_fee);

-- Update existing orders: calculate subtotal from total_amount
-- (Assuming existing orders have delivery_fee = 0 for simplicity)
UPDATE orders 
SET subtotal = CAST(total_amount AS DECIMAL(10,2)),
    delivery_fee = 0 
WHERE subtotal IS NULL OR subtotal = 0;

