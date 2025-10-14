-- Add exact coordinate fields to addresses table for better location accuracy
-- This migration adds fields to track GPS coordinates vs geocoded coordinates

-- Add exact coordinate fields
ALTER TABLE addresses 
ADD COLUMN exact_latitude DECIMAL(10, 8) NULL COMMENT 'Exact GPS latitude from vendor pin',
ADD COLUMN exact_longitude DECIMAL(11, 8) NULL COMMENT 'Exact GPS longitude from vendor pin',
ADD COLUMN coordinate_accuracy ENUM('exact', 'approximate', 'estimated') DEFAULT 'estimated' COMMENT 'Accuracy level of coordinates',
ADD COLUMN coordinate_source ENUM('gps', 'geocoding', 'manual', 'vendor_pin') DEFAULT 'geocoding' COMMENT 'Source of coordinate data',
ADD COLUMN coordinate_updated_at TIMESTAMP NULL COMMENT 'When coordinates were last updated';

-- Add index for faster coordinate-based queries
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude);
CREATE INDEX idx_addresses_exact_coordinates ON addresses(exact_latitude, exact_longitude);

-- Update existing records to mark current coordinates as 'geocoding' source
UPDATE addresses 
SET coordinate_source = 'geocoding', 
    coordinate_accuracy = 'approximate'
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
ALTER TABLE addresses 
MODIFY COLUMN latitude DECIMAL(10, 8) NULL COMMENT 'Approximate latitude from geocoding',
MODIFY COLUMN longitude DECIMAL(11, 8) NULL COMMENT 'Approximate longitude from geocoding';

-- Create a view for vendor locations with coordinate accuracy info
CREATE OR REPLACE VIEW vendor_location_accuracy AS
SELECT 
    v.vendor_id,
    v.store_name,
    v.status as vendor_status,
    a.address_id,
    a.latitude,
    a.longitude,
    a.exact_latitude,
    a.exact_longitude,
    a.coordinate_accuracy,
    a.coordinate_source,
    a.coordinate_updated_at,
    CASE 
        WHEN a.exact_latitude IS NOT NULL AND a.exact_longitude IS NOT NULL THEN 'exact'
        WHEN a.latitude IS NOT NULL AND a.longitude IS NOT NULL THEN 'approximate'
        ELSE 'none'
    END as location_status,
    CONCAT_WS(', ',
        NULLIF(a.cityVillage, ''),
        NULLIF(a.province, '')
    ) as location_text
FROM vendors v
LEFT JOIN addresses a ON v.primary_address_id = a.address_id;

-- Verification query
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_addresses FROM addresses;
SELECT COUNT(*) as addresses_with_coordinates FROM addresses WHERE latitude IS NOT NULL;
SELECT COUNT(*) as addresses_with_exact_coordinates FROM addresses WHERE exact_latitude IS NOT NULL;
