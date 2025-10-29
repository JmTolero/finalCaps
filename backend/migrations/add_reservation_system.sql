-- Migration: Add Reservation System for Drum Inventory Management
-- Purpose: Prevent overbooking by reserving drums when orders are placed, converting to booked when paid
-- Date: 2025-01-XX

USE chill_db;

-- Add reserved_count to daily_drum_availability table
ALTER TABLE daily_drum_availability
ADD COLUMN reserved_count INT NOT NULL DEFAULT 0 
  COMMENT 'Drums reserved by pending orders';

-- Add reservation expiry timestamp to orders table
ALTER TABLE orders
ADD COLUMN reservation_expires_at DATETIME NULL
  COMMENT 'When reservation auto-releases (24hrs before delivery time)';

-- Create index for efficient querying of expired reservations
CREATE INDEX idx_orders_reservation_expires 
ON orders(reservation_expires_at, status, payment_status);

-- Initialize reserved_count for existing records
UPDATE daily_drum_availability
SET reserved_count = 0
WHERE reserved_count IS NULL;

-- Display updated table structure
SELECT 'Reservation system migration completed successfully!' as message;
