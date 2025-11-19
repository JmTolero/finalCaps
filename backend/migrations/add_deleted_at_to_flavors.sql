-- Add deleted_at column to flavors table for soft delete functionality
-- This allows flavors to be hidden from display while preserving sales records

ALTER TABLE flavors 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;

-- Add index for better performance when filtering out deleted flavors
CREATE INDEX idx_flavors_deleted_at ON flavors(deleted_at);

