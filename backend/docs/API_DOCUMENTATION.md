# ChillNet API Documentation

## Database Structure Overview

Based on your actual database schema, here are the key tables and their relationships:

### Core Tables:
- **users** - User accounts (customers, vendors, admins)
- **vendors** - Vendor-specific information
- **orders** - Order management
- **order_items** - Individual items in orders
- **products** - Product catalog
- **flavors** - Ice cream flavors
- **container_drum** - Container/drum inventory
- **drum_stats** - Drum status tracking

## API Endpoints

### 1. Vendor Registration
- **Endpoint**: `POST /register-vendor`
- **Content-Type**: `multipart/form-data`
- **Description**: Register a new vendor with documents

**Request Body:**
```json
{
  "fname": "John Doe",
  "username": "johndoe_vendor",
  "password": "password123",
  "contact_no": "1234567890",
  "email": "john@example.com",
  "store_name": "John's Ice Cream Store",
  "address": "123 Main Street, City, State 12345",
  "role": "vendor",
  "valid_id": "file",
  "business_permit": "file",
  "ice_cream_photo": "file"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vendor registration successful. Your account is pending approval.",
  "user": {
    "id": 123,
    "username": "johndoe_vendor",
    "firstName": "John",
    "lastName": "Doe",
    "role": "vendor"
  }
}
```

### 2. User Login
- **Endpoint**: `POST /login`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "username": "johndoe_vendor",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "username": "johndoe_vendor",
    "firstName": "John",
    "lastName": "Doe",
    "role": "vendor"
  }
}
```

### 3. Database Health Check
- **Endpoint**: `GET /db/health`
- **Description**: Check database connection

**Response:**
```json
{
  "ok": true
}
```

## Database Relationships

### Your JOIN Query Reference:
```sql
SELECT 
    o.order_id, 
    u.fname, 
    v.store_name, 
    cd.size, 
    o.status, 
    o.payment_status, 
    ds.status_name
FROM orders AS o
INNER JOIN order_items AS oi ON o.order_id = oi.order_id
INNER JOIN users AS u ON o.customer_id = u.user_id
INNER JOIN vendors AS v ON o.vendor_id = v.vendor_id
INNER JOIN container_drum AS cd ON oi.containerDrum_id = cd.drum_id
INNER JOIN drum_stats AS ds ON ds.drum_status_id = oi.drum_status_id;
```

## Table Structures

### Users Table
```sql
CREATE TABLE users (
    user_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(45),
    lname VARCHAR(45),
    username VARCHAR(45),
    password VARCHAR(45),
    contact_no VARCHAR(45),
    email VARCHAR(100),
    role VARCHAR(50),
    created_at TIMESTAMP
);
```

### Vendors Table
```sql
CREATE TABLE vendors (
    vendor_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11),
    store_name VARCHAR(50),
    valid_id_url VARCHAR(100),
    business_permit_url VARCHAR(100),
    status VARCHAR(45),
    address_id INT(11),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### Orders Table
```sql
CREATE TABLE orders (
    order_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    customer_id INT(11),
    vendor_id INT(11),
    delivery_datetime DATETIME,
    delivery_address VARCHAR(100),
    total_amount VARCHAR(45),
    status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refund'),
    payment_status ENUM('unpaid', 'partial', 'paid'),
    created_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
);
```

## File Upload Configuration

- **Upload Directory**: `uploads/vendor-documents/`
- **Allowed File Types**: Images (JPEG, JPG, PNG) and PDF
- **File Size Limit**: 5MB per file
- **File Naming**: `{fieldname}-{timestamp}-{random}.{extension}`

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `409` - Conflict (duplicate username/email)
- `500` - Internal Server Error

## Security Notes

⚠️ **Important**: 
- Passwords are currently stored in plain text
- Implement password hashing (bcrypt) for production
- Add input validation and sanitization
- Implement rate limiting for registration attempts
