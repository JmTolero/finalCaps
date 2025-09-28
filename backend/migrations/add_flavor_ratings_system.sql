-- Add flavor ratings system
-- This migration creates a comprehensive rating system for flavors

-- Create flavor_ratings table
CREATE TABLE IF NOT EXISTS flavor_ratings (
    rating_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    flavor_id INT(11) NOT NULL,
    customer_id INT(11) NOT NULL,
    rating TINYINT(1) NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (flavor_id) REFERENCES flavors(flavor_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_flavor_rating (customer_id, flavor_id),
    INDEX idx_flavor_ratings_flavor_id (flavor_id),
    INDEX idx_flavor_ratings_customer_id (customer_id),
    INDEX idx_flavor_ratings_rating (rating)
);

-- Add rating columns to flavors table
ALTER TABLE flavors ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE flavors ADD COLUMN total_ratings INT(11) DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX idx_flavors_average_rating ON flavors(average_rating);
CREATE INDEX idx_flavors_total_ratings ON flavors(total_ratings);
