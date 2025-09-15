-- Add vendor_id and image_url columns to flavors table
-- This migration adds vendor association and image support to flavors

-- Add vendor_id column to flavors table
ALTER TABLE flavors 
ADD COLUMN vendor_id INT(11) AFTER flavor_description,
ADD COLUMN image_url VARCHAR(255) AFTER vendor_id,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER image_url;

-- Add foreign key constraint
ALTER TABLE flavors 
ADD CONSTRAINT fk_flavors_vendor_id 
FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_flavors_vendor_id ON flavors(vendor_id);
