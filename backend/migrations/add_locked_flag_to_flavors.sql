-- Migration: Add subscription lock flag to flavors
-- Date: 2025
-- Description: Adds a boolean flag to mark flavors hidden due to subscription downgrade

ALTER TABLE flavors
  ADD COLUMN locked_by_subscription TINYINT(1) NOT NULL DEFAULT 0 AFTER store_status;

CREATE INDEX idx_flavors_locked_subscription ON flavors(locked_by_subscription);

