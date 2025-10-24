-- Migration: Add GCash QR code system for direct vendor payments
-- This migration adds tables to store vendor QR codes for direct payments

-- Table for vendor GCash QR codes (direct payment system)
CREATE TABLE vendor_gcash_qr (
    qr_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    qr_code_image VARCHAR(255) NOT NULL,
    gcash_number VARCHAR(20) NOT NULL,
    business_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_vendor_qr (vendor_id)
);

-- Table for direct QR payment transactions
CREATE TABLE qr_payment_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    vendor_id INT NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('gcash_qr') DEFAULT 'gcash_qr',
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    qr_code_used VARCHAR(255),
    payment_confirmation_image VARCHAR(255),
    customer_notes TEXT,
    vendor_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_payment_status (payment_status)
);

-- Add indexes for better performance
CREATE INDEX idx_vendor_qr_vendor ON vendor_gcash_qr(vendor_id);
CREATE INDEX idx_qr_transactions_date ON qr_payment_transactions(created_at);
