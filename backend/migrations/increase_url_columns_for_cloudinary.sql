-- Increase URL column sizes to support Cloudinary URLs
-- Cloudinary URLs are longer than typical filenames

-- Update vendors table
ALTER TABLE vendors 
MODIFY COLUMN business_permit_url VARCHAR(500),
MODIFY COLUMN valid_id_url VARCHAR(500),
MODIFY COLUMN proof_image_url VARCHAR(500),
MODIFY COLUMN profile_image_url VARCHAR(500);

-- Update flavors table (if you have image URLs there)
ALTER TABLE flavors 
MODIFY COLUMN image_urls TEXT;

-- Verify the changes
SHOW COLUMNS FROM vendors LIKE '%_url';

