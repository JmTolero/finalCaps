-- PayMongo Payment Integration Migration
-- This migration creates tables for PayMongo payment processing

-- Create payment_intents table
CREATE TABLE payment_intents (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
    order_id VARCHAR(100) NOT NULL,
    customer_id INT(11),
    vendor_id INT(11),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PHP',
    status ENUM('awaiting_payment_method', 'awaiting_next_action', 'processing', 'succeeded', 'failed', 'cancelled') DEFAULT 'awaiting_payment_method',
    payment_method VARCHAR(50) DEFAULT 'gcash',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payment_intent_id (payment_intent_id),
    INDEX idx_order_id (order_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Add payment-related columns to orders table (only if they don't exist)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255) DEFAULT NULL;

-- Add indexes for payment columns (only if they don't exist)
ALTER TABLE orders 
ADD INDEX IF NOT EXISTS idx_payment_status (payment_status),
ADD INDEX IF NOT EXISTS idx_payment_method (payment_method),
ADD INDEX IF NOT EXISTS idx_payment_intent_id (payment_intent_id);

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
