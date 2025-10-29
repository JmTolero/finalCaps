-- Migration: Create daily_drum_availability table
-- Purpose: Track date-specific drum availability per vendor and size
-- Date: 2025-01-XX

CREATE TABLE IF NOT EXISTS daily_drum_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    delivery_date DATE NOT NULL,
    drum_size ENUM('small', 'medium', 'large') NOT NULL,
    total_capacity INT NOT NULL DEFAULT 0 COMMENT 'Total drums vendor has for this date/size',
    booked_count INT NOT NULL DEFAULT 0 COMMENT 'Number of drums currently booked',
    available_count INT NOT NULL DEFAULT 0 COMMENT 'Available drums (capacity - booked)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_vendor_date_size (vendor_id, delivery_date, drum_size),
    INDEX idx_vendor_date (vendor_id, delivery_date),
    INDEX idx_delivery_date (delivery_date),
    INDEX idx_vendor_size (vendor_id, drum_size),
    INDEX idx_date_size (delivery_date, drum_size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks daily drum availability per vendor, date, and size';
