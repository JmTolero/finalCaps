-- Add Cart System for Database-Backed Cart Storage
-- This migration creates a cart table to store user cart items in the database

-- Create cart table
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    flavor_id INT(11) NOT NULL,
    size ENUM('small', 'medium', 'large') NOT NULL,
    quantity INT(11) NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (flavor_id) REFERENCES flavors(flavor_id) ON DELETE CASCADE,
    INDEX idx_cart_items_user_id (user_id),
    INDEX idx_cart_items_flavor_id (flavor_id),
    INDEX idx_cart_items_user_flavor_size (user_id, flavor_id, size),
    UNIQUE KEY unique_user_flavor_size (user_id, flavor_id, size)
);

-- Additional indexes are already defined in the table creation above
