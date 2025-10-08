-- Migration: Add Vendor Reviews System
-- Description: Creates vendor_reviews table and adds rating columns to vendors table

-- Create vendor_reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  vendor_id INT NOT NULL,
  customer_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_order_review (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_vendor_reviews (vendor_id),
  INDEX idx_customer_reviews (customer_id)
);

-- Check and add average_rating column to vendors table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'vendors' 
AND COLUMN_NAME = 'average_rating';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE vendors ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00', 
    'SELECT "Column average_rating already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add total_reviews column to vendors table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'vendors' 
AND COLUMN_NAME = 'total_reviews';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE vendors ADD COLUMN total_reviews INT DEFAULT 0', 
    'SELECT "Column total_reviews already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Success message
SELECT 'Vendor reviews system migration completed successfully!' AS status;
