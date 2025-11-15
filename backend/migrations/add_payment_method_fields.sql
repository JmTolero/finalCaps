-- Migration: Add initial_payment_method and remaining_payment_method columns to orders table
-- Purpose: Support 50% partial payment option with customer choice for remaining balance payment
-- Date: 2025-01-XX

-- Check and display current columns
SELECT 'Checking existing columns...' AS status;

-- Note: MySQL doesn't support IF NOT EXISTS for ADD COLUMN in older versions
-- So we'll handle errors gracefully or check first

-- Add initial_payment_method column (skip if already exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'initial_payment_method';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN initial_payment_method VARCHAR(50) DEFAULT NULL COMMENT "Initial payment method for partial payments (e.g., GCash)"',
    'SELECT "Column initial_payment_method already exists" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add remaining_payment_method column (skip if already exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'remaining_payment_method';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN remaining_payment_method VARCHAR(50) DEFAULT NULL COMMENT "Payment method for remaining balance (e.g., GCash, Cash on Delivery)"',
    'SELECT "Column remaining_payment_method already exists" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for initial_payment_method (skip if exists)
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'orders'
  AND INDEX_NAME = 'idx_initial_payment_method';

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE orders ADD INDEX idx_initial_payment_method (initial_payment_method)',
    'SELECT "Index idx_initial_payment_method already exists" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for remaining_payment_method (skip if exists)
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'orders'
  AND INDEX_NAME = 'idx_remaining_payment_method';

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE orders ADD INDEX idx_remaining_payment_method (remaining_payment_method)',
    'SELECT "Index idx_remaining_payment_method already exists" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Display success message
SELECT 'Migration completed successfully!' AS status;

