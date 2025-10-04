-- Add latitude and longitude columns to addresses table
-- This migration adds coordinate support for map functionality

-- Add latitude column (DECIMAL(10, 8) allows for precision up to 1.1 meters)
ALTER TABLE addresses ADD COLUMN latitude DECIMAL(10, 8) NULL;

-- Add longitude column (DECIMAL(11, 8) allows for precision up to 1.1 meters)
ALTER TABLE addresses ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- Add index for better performance when querying by coordinates
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude);

-- Add some sample coordinates for testing (Philippines locations)
-- You can update these with real vendor locations later

-- Sample coordinates for common Philippine cities
-- Manila: 14.5995, 120.9842
-- Cebu City: 10.3157, 123.8854
-- Davao City: 7.1907, 125.4553
-- Quezon City: 14.6760, 121.0437
-- Makati: 14.5547, 121.0244

-- Update existing addresses with sample coordinates (optional)
-- Uncomment and modify these based on your actual vendor locations

-- UPDATE addresses SET latitude = 14.5995, longitude = 120.9842 WHERE cityVillage LIKE '%Manila%';
-- UPDATE addresses SET latitude = 10.3157, longitude = 123.8854 WHERE cityVillage LIKE '%Cebu%';
-- UPDATE addresses SET latitude = 7.1907, longitude = 125.4553 WHERE cityVillage LIKE '%Davao%';
-- UPDATE addresses SET latitude = 14.6760, longitude = 121.0437 WHERE cityVillage LIKE '%Quezon%';
-- UPDATE addresses SET latitude = 14.5547, longitude = 121.0244 WHERE cityVillage LIKE '%Makati%';

-- Add comments for documentation
ALTER TABLE addresses COMMENT = 'Addresses table with coordinate support for map functionality';
