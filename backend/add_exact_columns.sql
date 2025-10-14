-- Add exact coordinate columns to addresses table
ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS exact_latitude DECIMAL(10, 8) NULL COMMENT 'Exact GPS latitude from vendor pin',
ADD COLUMN IF NOT EXISTS exact_longitude DECIMAL(11, 8) NULL COMMENT 'Exact GPS longitude from vendor pin',
ADD COLUMN IF NOT EXISTS coordinate_accuracy ENUM('exact', 'approximate', 'estimated') DEFAULT 'estimated' COMMENT 'Accuracy level of coordinates',
ADD COLUMN IF NOT EXISTS coordinate_source ENUM('gps', 'geocoding', 'manual', 'vendor_pin') DEFAULT 'geocoding' COMMENT 'Source of coordinate data',
ADD COLUMN IF NOT EXISTS coordinate_updated_at TIMESTAMP NULL COMMENT 'When coordinates were last updated';
