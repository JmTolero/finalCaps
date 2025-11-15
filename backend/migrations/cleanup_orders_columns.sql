-- Migration: Cleanup orders table - Add missing columns and remove unused ones
-- Purpose: Add initial_payment_method and remove unused columns
-- Date: 2025-01-XX

-- Step 1: Add initial_payment_method column if it doesn't exist
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

-- Step 2: Add index for initial_payment_method if it doesn't exist
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

SELECT '✅ Step 1-2: Added initial_payment_method column and index' AS status;

-- Step 3: Remove unused column: delivery_time
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_time';

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE orders DROP COLUMN delivery_time',
    'SELECT "Column delivery_time does not exist" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Step 3: Removed delivery_time column' AS status;

-- Step 4: Remove unused column: delivery_address_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_address_id';

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE orders DROP COLUMN delivery_address_id',
    'SELECT "Column delivery_address_id does not exist" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Step 4: Removed delivery_address_id column' AS status;

-- Step 5: Remove unused column: delivery_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_status';

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE orders DROP COLUMN delivery_status',
    'SELECT "Column delivery_status does not exist" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Step 5: Removed delivery_status column' AS status;

-- Final verification
SELECT 
    CONCAT('✅ Migration completed successfully! Orders table now has ', COUNT(*), ' columns.') AS status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders';

-- Show remaining columns
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders'
ORDER BY ORDINAL_POSITION;

