-- Add profile_image_url column to vendors table
-- This migration adds support for vendor profile images

-- Add profile_image_url column to vendors table
ALTER TABLE vendors ADD COLUMN profile_image_url VARCHAR(255) AFTER business_permit_url;

-- Add index for better performance when querying by profile image
CREATE INDEX idx_vendors_profile_image ON vendors(profile_image_url);

-- Verification query (uncomment to test after running migration)
-- DESCRIBE vendors;
-- SHOW COLUMNS FROM vendors LIKE '%profile%';

-- Migration completed successfully!
-- Vendors can now have profile images stored in the database
