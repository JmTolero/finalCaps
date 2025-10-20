-- Migration: Create Subscription System
-- Date: 2024
-- Description: Add subscription plans and vendor subscription management

-- Subscription Plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    plan_type ENUM('free', 'basic', 'professional', 'premium', 'enterprise') NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
    max_flavors INT(11) DEFAULT 5,
    max_orders_per_month INT(11) DEFAULT 100,
    features JSON COMMENT 'JSON array of features included in this plan',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_plan_type (plan_type),
    INDEX idx_plan_active (is_active)
);

-- Vendor Subscriptions table
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
    subscription_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT(11) NOT NULL,
    plan_id INT(11) NOT NULL,
    status ENUM('active', 'inactive', 'cancelled', 'expired', 'trial') DEFAULT 'trial',
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method VARCHAR(100),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id) ON DELETE RESTRICT,
    INDEX idx_vendor_subscriptions (vendor_id),
    INDEX idx_subscription_status (status),
    INDEX idx_billing_date (next_billing_date)
);

-- Subscription Usage Tracking table
CREATE TABLE IF NOT EXISTS subscription_usage (
    usage_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT(11) NOT NULL,
    subscription_id INT(11) NOT NULL,
    month_year VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
    flavors_used INT(11) DEFAULT 0,
    orders_processed INT(11) DEFAULT 0,
    features_used JSON COMMENT 'Track which premium features were used',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES vendor_subscriptions(subscription_id) ON DELETE CASCADE,
    UNIQUE KEY unique_vendor_month (vendor_id, month_year),
    INDEX idx_usage_month (month_year)
);

-- Payment History table
CREATE TABLE IF NOT EXISTS payment_history (
    payment_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT(11) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(100),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_id) REFERENCES vendor_subscriptions(subscription_id) ON DELETE CASCADE,
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_date (payment_date)
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, plan_type, price, billing_cycle, max_flavors, max_orders_per_month, features) VALUES
('Free Plan', 'free', 0.00, 'monthly', 5, 50, '["Basic analytics", "Standard support", "Basic store listing"]'),
('Professional Plan', 'professional', 29.99, 'monthly', 50, 500, '["Advanced analytics", "Priority support", "Featured listing", "Custom branding", "Bulk order management"]'),
('Premium Plan', 'premium', 59.99, 'monthly', 999, 9999, '["All Professional features", "API access", "White-label options", "Advanced marketing tools", "Dedicated account manager"]'),
('Enterprise Plan', 'enterprise', 199.99, 'monthly', 9999, 99999, '["All Premium features", "Custom integrations", "24/7 phone support", "Custom reporting", "Multi-location support"]');

-- Add subscription status to vendors table
ALTER TABLE vendors ADD COLUMN subscription_status ENUM('trial', 'active', 'expired', 'cancelled') DEFAULT 'trial' AFTER status;
ALTER TABLE vendors ADD COLUMN trial_end_date DATE NULL AFTER subscription_status;

-- Create index for subscription status
CREATE INDEX idx_vendors_subscription_status ON vendors(subscription_status);
