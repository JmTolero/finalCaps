    -- Migration: Add subscription payments table for Xendit GCash integration
    -- This table tracks vendor subscription payments and upgrades

    CREATE TABLE IF NOT EXISTS subscription_payments (
        payment_id INT PRIMARY KEY AUTO_INCREMENT,
        vendor_id INT NOT NULL,
        plan_name ENUM('free', 'professional', 'premium') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
        xendit_invoice_id VARCHAR(255) UNIQUE,
        xendit_payment_id VARCHAR(255),
        payment_method VARCHAR(50) DEFAULT 'GCASH',
        payment_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
        INDEX idx_vendor_id (vendor_id),
        INDEX idx_payment_status (payment_status),
        INDEX idx_xendit_invoice_id (xendit_invoice_id)
    );

    -- Note: The vendors table already has the following subscription-related columns:
    -- - subscription_plan ENUM('free','professional','premium')
    -- - flavor_limit INT
    -- - drum_limit INT  
    -- - order_limit INT
    -- - subscription_start_date DATE
    -- - subscription_end_date DATE
    -- - qr_code_setup_completed TINYINT(1)

    -- No additional columns need to be added to vendors table as they already exist
