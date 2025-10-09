-- Actual Database Schema for ChillNet Application
-- Updated to reflect current database structure
-- Database: chill_db

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS chill_db;
-- USE chill_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(45),
    lname VARCHAR(45),
    gender VARCHAR(45),
    birth_date DATE,
    username VARCHAR(45),
    password VARCHAR(45),
    contact_no VARCHAR(45),
    email VARCHAR(100),
    primary_address_id INT(11),
    role VARCHAR(50) DEFAULT 'customer',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT 'User account status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_primary_address (primary_address_id),
    FOREIGN KEY (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11),
    store_name VARCHAR(50),
    valid_id_url VARCHAR(100),
    business_permit_url VARCHAR(100),
    proof_image_url VARCHAR(100),
    profile_image_url VARCHAR(100),
    status VARCHAR(45) DEFAULT 'pending',
    primary_address_id INT(11),
    exact_latitude DECIMAL(10, 8) NULL COMMENT 'Exact GPS latitude from vendor device',
    exact_longitude DECIMAL(11, 8) NULL COMMENT 'Exact GPS longitude from vendor device',
    location_accuracy VARCHAR(20) DEFAULT 'approximate' COMMENT 'Location type: exact or approximate',
    location_set_at TIMESTAMP NULL COMMENT 'When vendor set their exact location',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL,
    INDEX idx_vendors_user_id (user_id),
    INDEX idx_vendors_status (status),
    INDEX idx_vendors_primary_address (primary_address_id),
    INDEX idx_vendors_exact_coords (exact_latitude, exact_longitude)
);

-- Addresses table (structured address system)
CREATE TABLE IF NOT EXISTS addresses (
    address_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    unit_number VARCHAR(50),
    street_name VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    cityVillage VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    landmark VARCHAR(200),
    address_type ENUM('residential','commercial','business','warehouse') DEFAULT 'residential',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_addresses_city_province (cityVillage, province),
    INDEX idx_addresses_barangay (barangay),
    INDEX idx_addresses_postal_code (postal_code),
    INDEX idx_addresses_type (address_type),
    INDEX idx_addresses_active (is_active)
);

-- User addresses relationship table (many-to-many)
CREATE TABLE IF NOT EXISTS user_addresses (
    user_address_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    address_id INT(11) NOT NULL,
    address_label VARCHAR(50) DEFAULT 'Home',
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE CASCADE,
    INDEX idx_user_addresses_user_id (user_id),
    INDEX idx_user_addresses_address_id (address_id),
    INDEX idx_user_addresses_default (is_default)
);

-- Container Drum table
CREATE TABLE IF NOT EXISTS container_drum (
    drum_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    size ENUM('small', 'medium', 'large'),
    gallons INT(11),
    stock INT(11),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drum Stats table
CREATE TABLE IF NOT EXISTS drum_stats (
    drum_status_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    status_name ENUM('in use', 'not returned', 'returned')
);

-- Flavors table
CREATE TABLE IF NOT EXISTS flavors (
    flavor_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    flavor_name VARCHAR(100),
    flavor_description VARCHAR(500),
    vendor_id INT(11),
    sold_count INT(11) DEFAULT 0,
    store_status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    INDEX idx_flavors_vendor_id (vendor_id),
    INDEX idx_flavors_status (store_status)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    product_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    description VARCHAR(200),
    flavor_id INT(11),
    drum_id INT(11),
    vendor_id INT(11),
    product_url_image VARCHAR(100),
    review_id INT(11),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (flavor_id) REFERENCES flavors(flavor_id) ON DELETE SET NULL,
    FOREIGN KEY (drum_id) REFERENCES container_drum(drum_id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    INDEX idx_products_vendor_id (vendor_id),
    INDEX idx_products_flavor_id (flavor_id),
    INDEX idx_products_drum_id (drum_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    customer_id INT(11),
    vendor_id INT(11),
    delivery_datetime DATETIME,
    delivery_address VARCHAR(100),
    total_amount VARCHAR(45),
    status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refund') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    INDEX idx_orders_customer_id (customer_id),
    INDEX idx_orders_vendor_id (vendor_id),
    INDEX idx_orders_status (status)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    orderItemsID INT(11) AUTO_INCREMENT PRIMARY KEY,
    order_id INT(11),
    product_id INT(11),
    containerDrum_id INT(11),
    quantity INT(11),
    price DECIMAL(10,2),
    drum_status_id INT(11),
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (containerDrum_id) REFERENCES container_drum(drum_id) ON DELETE SET NULL,
    FOREIGN KEY (drum_status_id) REFERENCES drum_stats(drum_status_id) ON DELETE SET NULL,
    INDEX idx_order_items_order_id (order_id)
);

-- Views for easy data access
CREATE OR REPLACE VIEW user_formatted_addresses AS
SELECT 
    ua.user_address_id,
    ua.user_id,
    ua.address_label,
    ua.is_default,
    a.address_id,
    a.unit_number,
    a.street_name,
    a.barangay,
    a.cityVillage,
    a.province,
    a.region,
    a.postal_code,
    a.landmark,
    a.address_type,
    CONCAT_WS(', ', 
        NULLIF(a.unit_number, ''),
        a.street_name,
        a.barangay,
        a.cityVillage,
        a.province,
        a.region
    ) as full_address,
    ua.created_at,
    ua.updated_at
FROM user_addresses ua
JOIN addresses a ON ua.address_id = a.address_id
WHERE a.is_active = 1;

CREATE OR REPLACE VIEW vendor_locations AS
SELECT 
    v.vendor_id,
    v.store_name,
    v.primary_address_id,
    a.unit_number,
    a.street_name,
    a.barangay,
    a.cityVillage,
    a.province,
    a.region,
    a.postal_code,
    a.landmark,
    a.address_type,
    CONCAT_WS(', ', 
        NULLIF(a.unit_number, ''),
        a.street_name,
        a.barangay,
        a.cityVillage,
        a.province,
        a.region
    ) as full_address,
    v.status,
    v.created_at
FROM vendors v
LEFT JOIN addresses a ON v.primary_address_id = a.address_id;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('customer', 'vendor') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM(
        'order_placed',
        'order_accepted', 
        'order_rejected',
        'order_preparing',
        'order_ready',
        'order_delivered',
        'order_cancelled',
        'payment_confirmed',
        'payment_failed',
        'drum_return_requested',
        'drum_picked_up',
        'system_announcement',
        'review_received'
    ) NOT NULL,
    related_order_id INT NULL,
    related_vendor_id INT NULL,
    related_customer_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_notifications (user_id, user_type),
    INDEX idx_notification_type (notification_type),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
);

-- Vendor Reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (order_id, customer_id),
    INDEX idx_vendor_reviews (vendor_id),
    INDEX idx_customer_reviews (customer_id),
    INDEX idx_order_reviews (order_id),
    INDEX idx_rating (rating)
);

-- Database schema is now up to date with the actual database structure
-- This includes:
-- 1. Primary address system with primary_address_id columns
-- 2. Structured addresses table with detailed fields
-- 3. User-address relationship table for multiple addresses
-- 4. Proper foreign key relationships
-- 5. Indexes for performance
-- 6. Views for easy data access
-- 7. Notifications system with review_received support
-- 8. Vendor reviews system