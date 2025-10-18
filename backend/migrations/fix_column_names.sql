-- Fix Primary Address Column Names
-- This renames the existing address_id column to primary_address_id in vendors table
-- and adds the missing primary_address_id column to users table

USE chill_db;

-- Step 1: Rename address_id to primary_address_id in vendors table
ALTER TABLE vendors CHANGE COLUMN address_id primary_address_id INT(11);

-- Step 2: Add primary_address_id column to users table (if it doesn't exist)
ALTER TABLE users ADD COLUMN primary_address_id INT(11) AFTER email;

-- Step 3: Add foreign key constraints (if addresses table exists with proper structure)
-- Note: Only run these if your addresses table has address_id column
-- ALTER TABLE users ADD FOREIGN KEY fk_user_primary_address (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL;
-- ALTER TABLE vendors ADD FOREIGN KEY fk_vendor_primary_address (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL;

-- Verify the changes
SELECT 'Column rename completed' as status;
DESCRIBE users;
DESCRIBE vendors;

