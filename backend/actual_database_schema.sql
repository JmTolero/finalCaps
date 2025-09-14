-- Actual Database Schema for ChillNet Application
-- Based on your real database structure

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS chillnet_db;
-- USE chillnet_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(45),
    lname VARCHAR(45),
    username VARCHAR(45),
    password VARCHAR(45),
    contact_no VARCHAR(45),
    email VARCHAR(100),
    birth_date DATE,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    role VARCHAR(50),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT 'User account status',
    created_at TIMESTAMP
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11),
    store_name VARCHAR(50),
    valid_id_url VARCHAR(100),
    business_permit_url VARCHAR(100),
    profile_image_url VARCHAR(100),
    proof_image_url VARCHAR(100),
    status VARCHAR(45),
    address_id INT(11),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Container Drum table
CREATE TABLE IF NOT EXISTS container_drum (
    drum_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    size ENUM('small', 'medium', 'large'),
    gallons INT(11),
    stock INT(11),
    created_at TIMESTAMP
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
    flavor_description VARCHAR(500)
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
    created_at TIMESTAMP,
    FOREIGN KEY (flavor_id) REFERENCES flavors(flavor_id) ON DELETE SET NULL,
    FOREIGN KEY (drum_id) REFERENCES container_drum(drum_id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    customer_id INT(11),
    vendor_id INT(11),
    delivery_datetime DATETIME,
    delivery_address VARCHAR(100),
    total_amount VARCHAR(45),
    status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refund'),
    payment_status ENUM('unpaid', 'partial', 'paid'),
    created_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    orderItemsID INT(11) AUTO_INCREMENT PRIMARY KEY,
    order_id INT(11),
    product_id INT(11),
    containerDrum_id INT(11),
    quantity INT(11),
    price DECIMAL(10,0),
    drum_status_id INT(11),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (containerDrum_id) REFERENCES container_drum(drum_id) ON DELETE SET NULL,
    FOREIGN KEY (drum_status_id) REFERENCES drum_stats(drum_status_id) ON DELETE SET NULL
);

-- Addresses table (for vendor addresses)
CREATE TABLE IF NOT EXISTS addresses (
    address_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    address_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_birth_date ON users(birth_date);
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_proof_image ON vendors(proof_image_url);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_flavor_id ON products(flavor_id);
CREATE INDEX idx_products_drum_id ON products(drum_id);
