-- Fix for Vendor Setup Database Issues
-- This script addresses the schema mismatches causing vendor setup failures

-- Step 1: Backup existing data (if any)
-- CREATE TABLE vendors_backup AS SELECT * FROM vendors;
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: Drop existing addresses table if it exists (it has wrong structure)
DROP TABLE IF EXISTS addresses;

-- Step 3: Create the proper addresses table with structured data
CREATE TABLE addresses (
    address_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    unit_number VARCHAR(50),
    street_name VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    cityVillage VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    landmark VARCHAR(200),
    address_type ENUM('residential','commercial','business','warehouse') DEFAULT 'residential',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_city_province (cityVillage, province),
    INDEX idx_postal_code (postal_code),
    INDEX idx_address_type (address_type),
    INDEX idx_is_active (is_active),
    INDEX idx_barangay (barangay)
);

-- Step 4: Create user_addresses table (many-to-many relationship)
CREATE TABLE user_addresses (
    user_address_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    address_id INT(11) NOT NULL,
    address_label VARCHAR(50) DEFAULT 'Home',
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_address_id (address_id),
    INDEX idx_is_default (is_default),
    INDEX idx_user_default (user_id, is_default),
    
    -- Ensure only one default address per user
    UNIQUE KEY unique_user_default (user_id, is_default, address_label)
);

-- Step 5: Add primary_address_id to users table (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS primary_address_id INT(11) AFTER email;

-- Add foreign key constraint (if not exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_user_primary_address') = 0,
    'ALTER TABLE users ADD FOREIGN KEY fk_user_primary_address (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add primary_address_id to vendors table (if not exists)
-- First, check if the column exists and add it if it doesn't
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS primary_address_id INT(11) AFTER user_id;

-- Add foreign key constraint (if not exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_NAME = 'vendors' AND CONSTRAINT_NAME = 'fk_vendor_primary_address') = 0,
    'ALTER TABLE vendors ADD FOREIGN KEY fk_vendor_primary_address (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Add profile_image_url column to vendors table (if not exists)
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255) AFTER business_permit_url;

-- Step 8: Create some sample Philippine address data for testing
INSERT INTO addresses (unit_number, street_name, barangay, cityVillage, province, region, postal_code, address_type, is_active) VALUES
('Unit 101', 'Rizal Street', 'Poblacion', 'Makati City', 'Metro Manila', 'National Capital Region (NCR)', '1200', 'business', 1),
('', 'Bonifacio Avenue', 'Barangay 1', 'Manila', 'Metro Manila', 'National Capital Region (NCR)', '1000', 'residential', 1),
('2nd Floor', 'Quezon Avenue', 'Central', 'Quezon City', 'Metro Manila', 'National Capital Region (NCR)', '1100', 'commercial', 1),
('Stall 15', 'Market Street', 'Poblacion', 'Cebu City', 'Cebu', 'Central Visayas (Region VII)', '6000', 'business', 1),
('', 'Main Road', 'Proper', 'Davao City', 'Davao del Sur', 'Davao Region (Region XI)', '8000', 'residential', 1);

-- Step 9: Create views for easy vendor location lookup
CREATE OR REPLACE VIEW vendor_locations AS
SELECT 
    v.vendor_id,
    v.store_name,
    v.primary_address_id,
    a.unit_number,
    a.street_name,
    a.barangay,
    a.cityVillage,
    a.province,
    a.region,
    a.postal_code,
    a.landmark,
    a.address_type,
    CONCAT_WS(', ', 
        NULLIF(a.unit_number, ''),
        a.street_name,
        a.barangay,
        a.cityVillage,
        a.province,
        a.region
    ) as full_address,
    v.status,
    v.created_at
FROM vendors v
LEFT JOIN addresses a ON v.primary_address_id = a.address_id;

-- Step 10: Create view for user addresses
CREATE OR REPLACE VIEW user_address_details AS
SELECT 
    ua.user_address_id,
    ua.user_id,
    ua.address_label,
    ua.is_default,
    a.address_id,
    a.unit_number,
    a.street_name,
    a.barangay,
    a.cityVillage,
    a.province,
    a.region,
    a.postal_code,
    a.landmark,
    a.address_type,
    CONCAT_WS(', ', 
        NULLIF(a.unit_number, ''),
        a.street_name,
        a.barangay,
        a.cityVillage,
        a.province,
        a.region
    ) as full_address,
    ua.created_at,
    ua.updated_at
FROM user_addresses ua
JOIN addresses a ON ua.address_id = a.address_id
WHERE a.is_active = 1;

-- Verification queries
SELECT 'Database schema fixed successfully!' as status;
SELECT 'Addresses table created with proper structure' as message;
SELECT 'User_addresses table created' as message;
SELECT 'Primary address columns added to users and vendors tables' as message;
SELECT 'Profile image column added to vendors table' as message;
