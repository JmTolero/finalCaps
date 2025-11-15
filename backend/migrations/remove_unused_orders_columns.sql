-- Migration: Remove unused columns from orders table
-- Purpose: Clean up database by removing unused columns
-- Date: 2025-01-XX

SELECT '🧹 Starting cleanup of unused columns...' AS status;

-- Step 1: Remove unused column: delivery_time
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_time';

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE orders DROP COLUMN delivery_time',
    'SELECT "Column delivery_time does not exist (already removed)" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Step 1: Removed delivery_time column' AS status;

-- Step 2: Remove unused column: delivery_address_id
-- First, check and drop the foreign key constraint if it exists
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME = 'delivery_address_id'
  AND CONSTRAINT_NAME = 'fk_order_delivery_address';

SET @sql = IF(@fk_exists > 0,
    'ALTER TABLE orders DROP FOREIGN KEY fk_order_delivery_address',
    'SELECT "Foreign key fk_order_delivery_address does not exist" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now drop the column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_address_id';

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE orders DROP COLUMN delivery_address_id',
    'SELECT "Column delivery_address_id does not exist (already removed)" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Step 2: Removed delivery_address_id column (and foreign key)' AS status;

-- Step 3: Remove unused column: delivery_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_status';

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE orders DROP COLUMN delivery_status',
    'SELECT "Column delivery_status does not exist (already removed)" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Step 3: Removed delivery_status column' AS status;

-- Final verification
SELECT '🎉 Cleanup completed successfully!' AS status;

-- Show remaining columns
SELECT 
    CONCAT('📊 Orders table now has ', COUNT(*), ' columns') AS summary
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders';

-- Display all columns for verification
SELECT 
    ORDINAL_POSITION AS '#',
    COLUMN_NAME AS 'Column Name',
    DATA_TYPE AS 'Type',
    IS_NULLABLE AS 'Nullable',
    COLUMN_COMMENT AS 'Comment'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders'
ORDER BY ORDINAL_POSITION;

