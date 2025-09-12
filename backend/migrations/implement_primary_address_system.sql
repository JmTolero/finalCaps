-- Implementation of Primary Address System
-- Based on your actual database structure
-- 
-- IMPORTANT: Create a backup before running this script!
-- mysqldump -u your_username -p your_database_name > backup_before_address_implementation.sql

-- Step 1: Create the addresses table (structured address data)
CREATE TABLE IF NOT EXISTS addresses (
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

-- Step 2: Create user_addresses table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_addresses (
    user_address_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    address_id INT(11) NOT NULL,
    address_label VARCHAR(50) DEFAULT 'Home',
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys (using your actual table structure)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_address_id (address_id),
    INDEX idx_is_default (is_default),
    INDEX idx_user_default (user_id, is_default),
    
    -- Ensure only one default address per user
    UNIQUE KEY unique_user_default (user_id, is_default, address_label)
);

-- Step 3: Add primary_address_id to users table
ALTER TABLE users ADD COLUMN primary_address_id INT(11) AFTER email;
ALTER TABLE users ADD FOREIGN KEY fk_user_primary_address (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL;

-- Step 4: Add primary_address_id to vendors table
ALTER TABLE vendors ADD COLUMN primary_address_id INT(11) AFTER location;
ALTER TABLE vendors ADD FOREIGN KEY fk_vendor_primary_address (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL;

-- Step 5: Create some sample Philippine address data for testing
INSERT INTO addresses (unit_number, street_name, barangay, cityVillage, province, region, postal_code, address_type, is_active) VALUES
('Unit 101', 'Rizal Street', 'Poblacion', 'Makati City', 'Metro Manila', 'National Capital Region (NCR)', '1200', 'business', 1),
('', 'Bonifacio Avenue', 'Barangay 1', 'Manila', 'Metro Manila', 'National Capital Region (NCR)', '1000', 'residential', 1),
('2nd Floor', 'Quezon Avenue', 'Central', 'Quezon City', 'Metro Manila', 'National Capital Region (NCR)', '1100', 'commercial', 1),
('Stall 15', 'Market Street', 'Poblacion', 'Cebu City', 'Cebu', 'Central Visayas (Region VII)', '6000', 'business', 1),
('', 'Main Road', 'Proper', 'Davao City', 'Davao del Sur', 'Davao Region (Region XI)', '8000', 'residential', 1);

-- Step 6: Create a view for easy vendor location lookup
CREATE OR REPLACE VIEW vendor_locations AS
SELECT 
    v.id as vendor_id,
    v.shop_name,
    v.location as old_location,
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
    v.ratings,
    v.is_approved
FROM vendors v
LEFT JOIN addresses a ON v.primary_address_id = a.address_id;

-- Step 7: Create a view for user addresses
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

-- Verification queries (uncomment to test after running migration)
-- SELECT 'Addresses table created' as status;
-- SELECT address_id, street_name, barangay, cityVillage, province FROM addresses LIMIT 5;

-- SELECT 'User_addresses table created' as status;
-- DESCRIBE user_addresses;

-- SELECT 'Vendors table updated' as status;
-- SHOW COLUMNS FROM vendors LIKE '%address%';

-- SELECT 'Users table updated' as status;
-- SHOW COLUMNS FROM users LIKE '%address%';

-- SELECT 'Views created' as status;
-- SELECT * FROM vendor_locations LIMIT 3;

-- Migration completed successfully!
-- You now have:
-- 1. Structured addresses table
-- 2. User-address relationship table
-- 3. Primary address references in users and vendors tables
-- 4. Sample data for testing
-- 5. Helpful views for queries
        