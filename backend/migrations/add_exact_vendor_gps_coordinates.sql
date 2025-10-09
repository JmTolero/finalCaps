-- Migration: Add Exact GPS Coordinates to Vendors Table
-- Purpose: Allow vendors to set their exact shop location for accurate map display
-- Date: 2025-10-09

-- Step 1: Add exact GPS coordinates columns to vendors table
ALTER TABLE vendors
ADD COLUMN exact_latitude DECIMAL(10, 8) NULL COMMENT 'Exact GPS latitude from vendor device',
ADD COLUMN exact_longitude DECIMAL(11, 8) NULL COMMENT 'Exact GPS longitude from vendor device',
ADD COLUMN location_accuracy VARCHAR(20) DEFAULT 'approximate' COMMENT 'Location type: exact or approximate',
ADD COLUMN location_set_at TIMESTAMP NULL COMMENT 'When vendor set their exact location',
ADD INDEX idx_vendors_exact_coords (exact_latitude, exact_longitude);

-- Step 2: Add comments explaining the coordinate system
-- Two types of coordinates:
-- 1. addresses.latitude/longitude - Geocoded from city/province (approximate, city-level)
-- 2. vendors.exact_latitude/exact_longitude - Set by vendor from their device (exact, building-level)
--
-- Priority for display:
-- - Use exact_latitude/exact_longitude if available (accurate pin)
-- - Fall back to addresses.latitude/longitude (approximate area)

-- Step 3: Update existing vendors to show they have approximate locations
UPDATE vendors v
LEFT JOIN addresses a ON v.primary_address_id = a.address_id
SET v.location_accuracy = CASE 
    WHEN a.latitude IS NOT NULL AND a.longitude IS NOT NULL THEN 'approximate'
    ELSE 'none'
END
WHERE v.exact_latitude IS NULL AND v.exact_longitude IS NULL;

-- Verification query (uncomment to test)
-- SELECT 
--     v.vendor_id,
--     v.store_name,
--     v.exact_latitude,
--     v.exact_longitude,
--     v.location_accuracy,
--     a.latitude as address_latitude,
--     a.longitude as address_longitude
-- FROM vendors v
-- LEFT JOIN addresses a ON v.primary_address_id = a.address_id
-- WHERE v.status = 'approved';

