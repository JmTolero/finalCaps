# finalCaps

# 🍦 ChillNet Database Schema Documentation

This document describes the tables, columns, and relationships in the **ChillNet Ice Cream Order Management System**.

---

## 📌 Tables and Columns

### 1. vendors
Stores information about ice cream vendors.

- **vendor_id** (INT, PK, AI) → Unique vendor ID  
- **user_id** (INT, FK → users.user_id) → Associated user account  
- **store_name** (VARCHAR(50)) → Vendor store name  
- **valid_id_url** (VARCHAR(100)) → Link to uploaded valid ID  
- **business_permit_url** (VARCHAR(100)) → Link to uploaded business permit  
- **status** (VARCHAR(45)) → Approval status (pending, approved, rejected, etc.)  
- **address_id** (INT) → Address reference  
- **created_at** (TIMESTAMP) → Record creation time  

---

### 2. users
Stores all registered users (customers, vendors, admins).

- **user_id** (INT, PK, AI) → Unique user ID  
- **fname** (VARCHAR(45)) → First name  
- **lname** (VARCHAR(45)) → Last name  
- **username** (VARCHAR(45)) → Login username  
- **password** (VARCHAR(45)) → Login password  
- **contact_no** (VARCHAR(45)) → Contact number  
- **email** (VARCHAR(100)) → Email address  
- **role** (VARCHAR(50)) → User role (`customer`, `vendor`, `admin`)  
- **created_at** (TIMESTAMP) → Record creation time  

---

### 3. products
Stores products offered by vendors.

- **product_id** (INT, PK, AI) → Unique product ID  
- **name** (VARCHAR(100)) → Product name  
- **description** (VARCHAR(200)) → Product description  
- **flavor_id** (INT, FK → flavors.flavor_id) → Linked flavor  
- **drum_id** (INT, FK → container_drum.drum_id) → Container drum reference  
- **vendor_id** (INT, FK → vendors.vendor_id) → Vendor offering the product  
- **product_url_image** (VARCHAR(100)) → Product image URL  
- **review_id** (INT) → Linked review (future feature)  
- **created_at** (TIMESTAMP) → Record creation time  

---

### 4. orders
Stores customer orders.

- **order_id** (INT, PK, AI) → Unique order ID  
- **customer_id** (INT, FK → users.user_id) → Customer placing the order  
- **vendor_id** (INT, FK → vendors.vendor_id) → Vendor fulfilling the order  
- **delivery_datetime** (DATETIME) → Scheduled delivery time  
- **delivery_address** (VARCHAR(100)) → Delivery address  
- **total_amount** (VARCHAR(45)) → Total order amount  
- **status** (ENUM) → Order status (`pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`, `refund`)  
- **payment_status** (ENUM) → Payment status (`unpaid`, `partial`, `paid`)  
- **created_at** (TIMESTAMP) → Record creation time  

---

### 5. order_items
Stores individual items within an order.

- **orderItemsID** (INT, PK, AI) → Unique order item ID  
- **order_id** (INT, FK → orders.order_id) → Parent order  
- **product_id** (INT, FK → products.product_id) → Ordered product  
- **containerDrum_id** (INT, FK → container_drum.drum_id) → Container drum used  
- **quantity** (INT) → Number of items ordered  
- **price** (DECIMAL(10,0)) → Price of the item  
- **drum_status_id** (INT, FK → drum_stats.drum_status_id) → Drum return status  

---

### 6. flavors
Stores available ice cream flavors.

- **flavor_id** (INT, PK, AI) → Unique flavor ID  
- **flavor_name** (VARCHAR(100)) → Flavor name  
- **flavor_description** (VARCHAR(500)) → Flavor description  

---

### 7. drum_stats
Tracks the return status of container drums.

- **drum_status_id** (INT, PK, AI) → Unique drum status ID  
- **status_name** (ENUM) → Drum status (`in use`, `not returned`, `returned`)  

---

### 8. container_drum
Stores container drum details.

- **drum_id** (INT, PK, AI) → Unique drum ID  
- **size** (ENUM) → Drum size (`small`, `medium`, `large`)  
- **gallons** (INT) → Number of gallons in the drum  
- **stock** (INT) → Available stock  
- **created_at** (TIMESTAMP) → Record creation time  

---

## 🔗 Relationships

- **users (1) → vendors (M)**  
  Each vendor account is linked to a user.  

- **vendors (1) → products (M)**  
  A vendor can have multiple products.  

- **flavors (1) → products (M)**  
  Each product has one flavor.  

- **container_drum (1) → products (M)**  
  Each product uses one type of container drum.  

- **orders (1) → order_items (M)**  
  Each order can have multiple items.  

- **users (1) → orders (M)**  
  Customers (users) can place multiple orders.  

- **vendors (1) → orders (M)**  
  A vendor can receive many orders.  

- **drum_stats (1) → order_items (M)**  
  Each order item tracks its drum return status.  

---

## 📊 Example Query

Get customer orders with vendor, drum, and status details:

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