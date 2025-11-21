-- Fix existing orders that have "Cash on Delivery" instead of "cod"
UPDATE orders 
SET remaining_payment_method = 'cod'
WHERE remaining_payment_method = 'Cash on Delivery' 
   OR remaining_payment_method = 'cash on delivery'
   OR remaining_payment_method = 'CASH ON DELIVERY';

-- Verify the fix
SELECT order_id, payment_status, remaining_balance, remaining_payment_method 
FROM orders 
WHERE remaining_balance > 0 
ORDER BY order_id DESC 
LIMIT 10;

