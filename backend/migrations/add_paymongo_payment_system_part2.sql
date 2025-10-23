-- PayMongo Migration - Part 2 (Run this after the first part)
-- This handles the remaining migration steps

-- Add payment-related columns to orders table (with error handling)
-- Check if columns exist before adding them

-- Add payment_status column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'payment_status') = 0,
    'ALTER TABLE orders ADD COLUMN payment_status ENUM(''pending'', ''paid'', ''failed'', ''refunded'') DEFAULT ''pending''',
    'SELECT ''Column payment_status already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add payment_method column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'payment_method') = 0,
    'ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL',
    'SELECT ''Column payment_method already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add payment_intent_id column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'payment_intent_id') = 0,
    'ALTER TABLE orders ADD COLUMN payment_intent_id VARCHAR(255) DEFAULT NULL',
    'SELECT ''Column payment_intent_id already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add payment_reference column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'payment_reference') = 0,
    'ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255) DEFAULT NULL',
    'SELECT ''Column payment_reference already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for payment columns (with error handling)
-- Check if indexes exist before adding them

-- Add idx_payment_status index if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'orders' 
     AND INDEX_NAME = 'idx_payment_status') = 0,
    'ALTER TABLE orders ADD INDEX idx_payment_status (payment_status)',
    'SELECT ''Index idx_payment_status already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add idx_payment_method index if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'orders' 
     AND INDEX_NAME = 'idx_payment_method') = 0,
    'ALTER TABLE orders ADD INDEX idx_payment_method (payment_method)',
    'SELECT ''Index idx_payment_method already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add idx_payment_intent_id index if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'orders' 
     AND INDEX_NAME = 'idx_payment_intent_id') = 0,
    'ALTER TABLE orders ADD INDEX idx_payment_intent_id (payment_intent_id)',
    'SELECT ''Index idx_payment_intent_id already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create payment_transactions table for detailed transaction logs
CREATE TABLE payment_transactions (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    payment_intent_id VARCHAR(255) NOT NULL,
    transaction_type ENUM('payment_intent_created', 'payment_method_attached', 'payment_succeeded', 'payment_failed', 'payment_cancelled', 'webhook_received') NOT NULL,
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'PHP',
    status VARCHAR(50),
    metadata JSON,
    webhook_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_payment_intent_id (payment_intent_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(payment_intent_id) ON DELETE CASCADE
);

-- Create system_settings table
CREATE TABLE system_settings (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key)
);

-- Insert sample PayMongo configuration (for development)
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('paymongo_enabled', 'true', 'Enable PayMongo payment processing'),
('paymongo_public_key', '', 'PayMongo public key'),
('paymongo_secret_key', '', 'PayMongo secret key'),
('paymongo_webhook_secret', '', 'PayMongo webhook secret'),
('paymongo_api_url', 'https://api.paymongo.com/v1', 'PayMongo API URL'),
('gcash_payment_enabled', 'true', 'Enable GCash payment method');

-- Create view for payment summary
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    pi.payment_intent_id,
    pi.order_id,
    pi.customer_id,
    pi.vendor_id,
    pi.amount,
    pi.currency,
    pi.status as payment_status,
    pi.payment_method,
    pi.created_at as payment_created_at,
    pi.updated_at as payment_updated_at,
    o.status as order_status,
    o.delivery_datetime,
    o.total_amount,
    cu.fname as customer_first_name,
    cu.lname as customer_last_name,
    cu.contact_no as customer_phone,
    v.store_name as vendor_name
FROM payment_intents pi
LEFT JOIN orders o ON pi.order_id = o.order_id
LEFT JOIN users cu ON pi.customer_id = cu.user_id
LEFT JOIN vendors v ON pi.vendor_id = v.user_id
ORDER BY pi.created_at DESC;
