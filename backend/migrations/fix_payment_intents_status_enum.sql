-- Fix payment_intents status column to support Xendit status values
-- This migration expands the ENUM to include Xendit status values

-- Update the status column to include Xendit status values
ALTER TABLE payment_intents 
MODIFY COLUMN status ENUM(
  'awaiting_payment_method', 
  'awaiting_next_action', 
  'processing', 
  'succeeded', 
  'failed', 
  'cancelled',
  'PENDING',
  'PAID',
  'EXPIRED',
  'FAILED'
) DEFAULT 'awaiting_payment_method';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON payment_intents(order_id);
