-- Add vendor_rejections table for tracking vendor rejection and auto-return
CREATE TABLE IF NOT EXISTS vendor_rejections (
    rejection_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    user_id INT NOT NULL,
    rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_return_at DATETIME NOT NULL,
    is_returned BOOLEAN DEFAULT FALSE,
    returned_at TIMESTAMP NULL,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_vendor_rejections_vendor_id (vendor_id),
    INDEX idx_vendor_rejections_user_id (user_id),
    INDEX idx_vendor_rejections_auto_return (auto_return_at),
    INDEX idx_vendor_rejections_returned (is_returned)
);
