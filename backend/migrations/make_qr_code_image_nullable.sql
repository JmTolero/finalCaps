-- Migration: Make qr_code_image nullable in vendor_gcash_qr table
-- This allows vendors to set up GCash number without uploading a QR code image

ALTER TABLE vendor_gcash_qr 
MODIFY COLUMN qr_code_image VARCHAR(255) NULL;

