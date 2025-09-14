-- Add profile_image_url column to vendors table
ALTER TABLE vendors ADD COLUMN profile_image_url VARCHAR(100) NULL AFTER proof_image_url;

-- Add index for profile_image_url
CREATE INDEX idx_vendors_profile_image_url ON vendors(profile_image_url);