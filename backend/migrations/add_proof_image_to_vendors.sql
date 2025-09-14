-- Add proof_image_url column to vendors table
-- Migration: add_proof_image_to_vendors.sql

USE chill_db;

-- Add proof_image_url column for storing proof of identity/business images
ALTER TABLE vendors ADD COLUMN proof_image_url VARCHAR(100) AFTER business_permit_url;

-- Add index for proof_image_url for potential queries
CREATE INDEX idx_vendors_proof_image ON vendors(proof_image_url);
