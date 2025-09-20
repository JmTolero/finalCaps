-- Add delivery pricing system for vendors
-- This migration adds support for city-based delivery pricing

-- Step 1: Create vendor_delivery_pricing table
CREATE TABLE IF NOT EXISTS vendor_delivery_pricing (
    delivery_pricing_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT(11) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    delivery_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_city_province (city, province),
    INDEX idx_vendor_city (vendor_id, city, province),
    INDEX idx_is_active (is_active),
    
    -- Ensure unique pricing per vendor per city
    UNIQUE KEY unique_vendor_city (vendor_id, city, province)
);

-- Step 2: Create a view for easy delivery pricing lookup
CREATE OR REPLACE VIEW vendor_delivery_zones AS
SELECT 
    vdp.delivery_pricing_id,
    vdp.vendor_id,
    v.store_name,
    vdp.city,
    vdp.province,
    vdp.delivery_price,
    vdp.is_active,
    vdp.created_at,
    vdp.updated_at,
    CONCAT(vdp.city, ', ', vdp.province) as full_location
FROM vendor_delivery_pricing vdp
INNER JOIN vendors v ON vdp.vendor_id = v.vendor_id
WHERE vdp.is_active = 1 AND v.status = 'approved';

-- Verification query
SELECT 'Delivery pricing system created successfully' as status;
