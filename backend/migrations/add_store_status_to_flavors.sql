-- Add store_status column to flavors table
ALTER TABLE flavors ADD COLUMN store_status ENUM('draft', 'ready', 'published') DEFAULT 'draft';

-- Add index for better performance
CREATE INDEX idx_flavors_store_status ON flavors(store_status);
