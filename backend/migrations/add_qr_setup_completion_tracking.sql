-- Add QR code setup completion tracking to vendors table
-- This ensures vendors must complete QR code setup before they can start selling

ALTER TABLE vendors 
ADD COLUMN qr_code_setup_completed BOOLEAN DEFAULT FALSE;

-- Update existing vendors who already have QR codes to mark them as completed
UPDATE vendors 
SET qr_code_setup_completed = TRUE 
WHERE gcash_qr_code IS NOT NULL AND gcash_qr_code != '';

-- Add index for faster lookups
CREATE INDEX idx_vendors_qr_setup ON vendors(qr_code_setup_completed);
