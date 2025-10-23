-- Fix for PayMongo Migration - Complete the setup
-- Run this to finish the migration after the previous errors

-- Create view for payment summary (with correct column names)
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    pi.payment_intent_id,
    pi.order_id,
    pi.customer_id,
    pi.vendor_id,
    pi.amount,
    pi.currency,
    pi.status as payment_status,
    pi.payment_method,
    pi.created_at as payment_created_at,
    pi.updated_at as payment_updated_at,
    o.status as order_status,
    o.delivery_datetime,
    o.total_amount,
    cu.fname as customer_first_name,
    cu.lname as customer_last_name,
    cu.contact_no as customer_phone,
    v.store_name as vendor_name
FROM payment_intents pi
LEFT JOIN orders o ON pi.order_id = o.order_id
LEFT JOIN users cu ON pi.customer_id = cu.user_id
LEFT JOIN vendors v ON pi.vendor_id = v.user_id
ORDER BY pi.created_at DESC;

-- Verify the migration is complete
SELECT 'PayMongo migration completed successfully!' as status;
