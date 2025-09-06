-- Query Reference for ChillNet Application
-- Based on your actual database structure

-- Main Order Details Query (your provided query)
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

-- Additional useful queries for your application:

-- 1. Get all orders with customer and vendor details
SELECT 
    o.order_id,
    o.delivery_datetime,
    o.delivery_address,
    o.total_amount,
    o.status,
    o.payment_status,
    u.fname AS customer_name,
    u.contact_no AS customer_phone,
    v.store_name AS vendor_name
FROM orders AS o
INNER JOIN users AS u ON o.customer_id = u.user_id
INNER JOIN vendors AS v ON o.vendor_id = v.vendor_id;

-- 2. Get order items with product and container details
SELECT 
    oi.orderItemsID,
    oi.order_id,
    p.name AS product_name,
    p.description,
    f.flavor_name,
    cd.size AS container_size,
    cd.gallons,
    oi.quantity,
    oi.price,
    ds.status_name AS drum_status
FROM order_items AS oi
INNER JOIN products AS p ON oi.product_id = p.product_id
INNER JOIN flavors AS f ON p.flavor_id = f.flavor_id
INNER JOIN container_drum AS cd ON oi.containerDrum_id = cd.drum_id
INNER JOIN drum_stats AS ds ON oi.drum_status_id = ds.drum_status_id;

-- 3. Get vendor products with details
SELECT 
    p.product_id,
    p.name,
    p.description,
    f.flavor_name,
    f.flavor_description,
    cd.size,
    cd.gallons,
    v.store_name,
    p.product_url_image
FROM products AS p
INNER JOIN flavors AS f ON p.flavor_id = f.flavor_id
INNER JOIN container_drum AS cd ON p.drum_id = cd.drum_id
INNER JOIN vendors AS v ON p.vendor_id = v.vendor_id;

-- 4. Get pending vendor approvals
SELECT 
    v.vendor_id,
    v.store_name,
    v.status,
    u.fname,
    u.lname,
    u.email,
    u.contact_no,
    v.valid_id_url,
    v.business_permit_url,
    v.created_at
FROM vendors AS v
INNER JOIN users AS u ON v.user_id = u.user_id
WHERE v.status = 'pending';

-- 5. Get order statistics
SELECT 
    COUNT(*) AS total_orders,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
    SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_orders
FROM orders;

-- 6. Get vendor performance
SELECT 
    v.store_name,
    COUNT(o.order_id) AS total_orders,
    SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS completed_orders,
    AVG(CAST(o.total_amount AS DECIMAL(10,2))) AS avg_order_value
FROM vendors AS v
LEFT JOIN orders AS o ON v.vendor_id = o.vendor_id
GROUP BY v.vendor_id, v.store_name;

-- 7. Get container drum inventory
SELECT 
    cd.drum_id,
    cd.size,
    cd.gallons,
    cd.stock,
    COUNT(oi.orderItemsID) AS in_use_count
FROM container_drum AS cd
LEFT JOIN order_items AS oi ON cd.drum_id = oi.containerDrum_id 
    AND oi.drum_status_id = (SELECT drum_status_id FROM drum_stats WHERE status_name = 'in use')
GROUP BY cd.drum_id, cd.size, cd.gallons, cd.stock;
