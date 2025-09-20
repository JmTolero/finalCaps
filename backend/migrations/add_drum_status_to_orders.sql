-- Migration: Add drum_status column to orders table
-- This migration adds drum status tracking to orders for container return management

USE chill_db;

-- Add drum_status column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS drum_status ENUM('in_use', 'return_requested', 'returned') DEFAULT 'in_use';

-- Add return_requested_at column to track when return was requested
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS return_requested_at DATETIME NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_drum_status ON orders(drum_status);

-- Update existing orders to have 'in_use' status for delivered orders
UPDATE orders 
SET drum_status = 'in_use' 
WHERE status = 'delivered' AND drum_status IS NULL;
