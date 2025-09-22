-- Add decline_reason column to orders table
-- This will store the reason why an order was declined by the vendor

ALTER TABLE orders 
ADD COLUMN decline_reason VARCHAR(500) NULL 
COMMENT 'Reason provided by vendor when declining an order';

-- Add index for better performance when querying declined orders
CREATE INDEX idx_orders_decline_reason ON orders(decline_reason);
