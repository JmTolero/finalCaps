-- Add sold_count column to flavors table
-- This migration adds a sold count field to track how many times each flavor has been sold

-- Add sold_count column to flavors table
ALTER TABLE flavors 
ADD COLUMN sold_count INT(11) DEFAULT 0 AFTER created_at;

-- Add index for better performance
CREATE INDEX idx_flavors_sold_count ON flavors(sold_count);
