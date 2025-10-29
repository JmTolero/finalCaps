-- Migration: Add 'pending_payment' status to orders table
-- Purpose: Support payment deadline tracking with order status
-- Date: 2025-01-XX

-- Modify the ENUM to include 'pending_payment' status
-- This is done by modifying the table structure

ALTER TABLE orders 
MODIFY COLUMN status ENUM('pending', 'pending_payment', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refund') DEFAULT 'pending';

-- Add payment_deadline column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_deadline DATETIME NULL 
COMMENT 'Order will be auto-cancelled if not paid by this time';

-- Create pending_payment_orders tracking table
CREATE TABLE IF NOT EXISTS pending_payment_orders (
    order_id INT PRIMARY KEY,
    payment_deadline DATETIME NOT NULL,
    reminder_sent BOOLEAN DEFAULT FALSE COMMENT 'Whether reminder was sent to customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_payment_deadline (payment_deadline),
    INDEX idx_reminder_sent (reminder_sent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks orders awaiting payment with deadline';
