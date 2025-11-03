const pool = require('../../db/config');    
const Orders = require('../../model/shared/orderModel');
const { createNotification } = require('./notificationController');

const getOrderRecord = async (req, res) => {
    try{
        const rows = await Orders.getOrderRecords();
        res.json(rows) 
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Orders Record admin error"})
    }
}

// Get a single order by ID
const getOrderById = async (req, res) => {
    try {
        const { order_id } = req.params;
        
        if (!order_id) {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
        }

        const [rows] = await pool.query(`
            SELECT 
                o.*,
                u.fname as customer_fname,
                u.lname as customer_lname,
                u.contact_no as customer_contact,
                v.store_name as business_name,
                vu.contact_no as vendor_contact
            FROM orders o
            LEFT JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
            LEFT JOIN users vu ON v.user_id = vu.user_id
            WHERE o.order_id = ?
        `, [order_id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Get order items
        const [items] = await pool.query(`
            SELECT 
                oi.*,
                p.name as flavor_name,
                oi.price,
                p.product_url_image as image_url,
                f.flavor_name as flavor_description,
                cd.size as drum_size,
                cd.gallons
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN flavors f ON p.flavor_id = f.flavor_id
            LEFT JOIN container_drum cd ON oi.containerDrum_id = cd.drum_id
            WHERE oi.order_id = ?
        `, [order_id]);

        const order = rows[0];
        order.items = items;

        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('Error fetching order by ID:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order details',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Create a new order
const createOrder = async (req, res) => {
    try {
        const {
            customer_id,
            vendor_id,
            delivery_address,
            delivery_datetime,
            payment_method,
            payment_type,
            subtotal,
            delivery_fee,
            total_amount,
            payment_amount, // Amount being paid (for partial payments)
            status = 'pending',
            payment_status = 'unpaid',
            items = []
        } = req.body;

        console.log('Creating order with data:', req.body);
        console.log('Delivery details received:', {
            delivery_address: delivery_address,
            delivery_datetime: delivery_datetime,
            delivery_datetime_type: typeof delivery_datetime
        });

        // Validate required fields
        if (!customer_id || !vendor_id || !delivery_address || !total_amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customer_id, vendor_id, delivery_address, total_amount'
            });
        }

        // Check if customer has a contact number
        const [customerData] = await pool.query(`
            SELECT contact_no FROM users WHERE user_id = ?
        `, [customer_id]);

        if (customerData.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Customer not found'
            });
        }

        if (!customerData[0].contact_no || customerData[0].contact_no.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Contact number is required to place an order. Please add your contact number in your profile settings.'
            });
        }

        // VALIDATION: 24-hour minimum advance notice
        const deliveryDateTime = new Date(delivery_datetime);
        const now = new Date();
        
        // Validate delivery_datetime is valid
        if (isNaN(deliveryDateTime.getTime())) {
            console.error('Invalid delivery_datetime:', delivery_datetime);
            return res.status(400).json({
                success: false,
                error: 'Invalid delivery date/time format'
            });
        }
        
        const hoursUntilDelivery = (deliveryDateTime - now) / (1000 * 60 * 60);

        if (hoursUntilDelivery < 24) {
            return res.status(400).json({
                success: false,
                error: `Orders must be placed at least 24 hours before delivery time. Ice cream preparation requires 24 hours. You tried to order for ${hoursUntilDelivery.toFixed(1)} hours from now. Please select a delivery time at least 24 hours in the future.`
            });
        }

        // Calculate reservation expiry: 24 hours before delivery
        const reservationExpiry = new Date(deliveryDateTime);
        reservationExpiry.setHours(reservationExpiry.getHours() - 24);

        // Calculate payment_amount and remaining_balance for partial payments
        const totalAmountNum = parseFloat(total_amount) || 0;
        const paymentAmountNum = payment_amount ? parseFloat(payment_amount) : totalAmountNum;
        const remainingBalance = totalAmountNum - paymentAmountNum;

        // Validate payment amounts
        if (paymentAmountNum < 0 || paymentAmountNum > totalAmountNum) {
            return res.status(400).json({
                success: false,
                error: `Invalid payment amount. Must be between 0 and ${totalAmountNum}`
            });
        }

        // RESERVE INVENTORY for each item (before creating order)
        if (items && items.length > 0) {
            for (const item of items) {
                try {
                    const deliveryDate = deliveryDateTime.toISOString().split('T')[0];
                    
                    // Get drum size from item or query it
                    let drumSize = item.size;
                    
                    if (!drumSize && item.flavor_id) {
                        // Get size from container_drum if not provided
                        const [drums] = await pool.query(`
                            SELECT cd.size 
                            FROM container_drum cd
                            JOIN products p ON cd.drum_id = p.drum_id
                            JOIN flavors f ON p.flavor_id = f.flavor_id
                            WHERE p.vendor_id = ? AND f.flavor_id = ?
                            LIMIT 1
                        `, [vendor_id, item.flavor_id]);
                        
                        if (drums.length > 0) {
                            drumSize = drums[0].size;
                        }
                    }
                    
                    if (!drumSize) {
                        return res.status(400).json({
                            success: false,
                            error: `Could not determine drum size for ${item.name}. Please contact support.`
                        });
                    }
                    
                    // Check/create availability record
                    const [availability] = await pool.query(`
                        SELECT availability_id, available_count, reserved_count, booked_count, total_capacity
                        FROM daily_drum_availability
                        WHERE vendor_id = ? AND delivery_date = ? AND drum_size = ?
                    `, [vendor_id, deliveryDate, drumSize]);
                    
                    if (availability.length === 0) {
                        // Create from base capacity
                        const [capacity] = await pool.query(`
                            SELECT stock FROM vendor_drum_pricing
                            WHERE vendor_id = ? AND drum_size = ?
                        `, [vendor_id, drumSize]);
                        
                        const totalCapacity = capacity[0]?.stock || 0;
                        
                        if (totalCapacity < item.quantity) {
                            return res.status(400).json({
                                success: false,
                                error: `Insufficient capacity: Only ${totalCapacity} ${drumSize} drums available`
                            });
                        }
                        
                        await pool.query(`
                            INSERT INTO daily_drum_availability (
                                vendor_id, delivery_date, drum_size,
                                total_capacity, reserved_count, booked_count, available_count
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [vendor_id, deliveryDate, drumSize, totalCapacity, item.quantity, 0, totalCapacity - item.quantity]);
                    } else {
                        // Check if enough available
                        const avail = availability[0];
                        
                        if (avail.available_count < item.quantity) {
                            return res.status(400).json({
                                success: false,
                                error: `Only ${avail.available_count} ${drumSize} drums available for ${deliveryDate}. Another customer may have reserved them.`
                            });
                        }
                        
                        // Reserve drums
                        await pool.query(`
                            UPDATE daily_drum_availability
                            SET reserved_count = reserved_count + ?,
                                available_count = available_count - ?
                            WHERE availability_id = ?
                        `, [item.quantity, item.quantity, avail.availability_id]);
                    }
                } catch (reservationError) {
                    console.error('Error reserving inventory for item:', reservationError);
                    // Don't fail the entire order - log error and continue
                    // The verification step later will catch and fix missing reservations
                }
            }
        }

        // Insert order into database
        const [orderResult] = await pool.query(`
            INSERT INTO orders (
                customer_id, 
                vendor_id, 
                delivery_datetime, 
                delivery_address, 
                total_amount, 
                payment_amount,
                remaining_balance,
                status, 
                payment_status,
                payment_method,
                reservation_expires_at,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            customer_id,
            vendor_id,
            delivery_datetime,
            delivery_address,
            total_amount,
            paymentAmountNum,
            remainingBalance,
            status,
            payment_status,
            payment_method,
            reservationExpiry
        ]);

        const orderId = orderResult.insertId;
        console.log('Order created with ID:', orderId);

        // Create notifications for both customer and vendor
        try {
            // Notification for customer
            await createNotification({
                user_id: customer_id,
                user_type: 'customer',
                title: 'Order Placed Successfully',
                message: `Your order #${orderId} has been placed successfully. Please proceed with payment via GCash to confirm your order. The vendor will start preparing your ice cream on your scheduled delivery date once payment is received.`,
                notification_type: 'order_placed',
                related_order_id: orderId,
                related_vendor_id: vendor_id,
                related_customer_id: customer_id
            });

            // Notification for vendor - get vendor's user_id first
            const [vendorUser] = await pool.query(`
                SELECT user_id FROM vendors WHERE vendor_id = ?
            `, [vendor_id]);
            
            if (vendorUser.length > 0) {
                await createNotification({
                    user_id: vendorUser[0].user_id,
                    user_type: 'vendor',
                    title: 'New Order Received',
                    message: `You have received a new order #${orderId} from a customer. The order will be confirmed once payment is received.`,
                    notification_type: 'order_placed',
                    related_order_id: orderId,
                    related_vendor_id: vendor_id,
                    related_customer_id: customer_id
                });
            }
        } catch (notificationError) {
            console.error('Failed to create notifications for order:', orderId, notificationError);
            // Don't fail the order creation if notification creation fails
        }

        // Insert order items if provided
        if (items && items.length > 0) {
            
            for (const item of items) {
                // Get the product_id for this flavor and size, or create a basic one
                const [products] = await pool.query(`
                    SELECT p.product_id, cd.drum_id
                    FROM products p
                    JOIN flavors f ON p.flavor_id = f.flavor_id
                    JOIN container_drum cd ON p.drum_id = cd.drum_id
                    WHERE f.flavor_id = ? AND cd.size = ? AND p.vendor_id = ?
                `, [item.flavor_id, item.size, vendor_id]);
                
                let productId, drumId;
                
                if (products.length > 0) {
                    const product = products[0];
                    productId = product.product_id;
                    drumId = product.drum_id;
                } else {
                    // If no product exists, get drum_id for the size and create a basic product
                    const [drums] = await pool.query(`
                        SELECT drum_id FROM container_drum WHERE size = ?
                    `, [item.size]);
                    
                    if (drums.length > 0) {
                        drumId = drums[0].drum_id;
                        
                        // Create a basic product for this flavor and size
                        const [productResult] = await pool.query(`
                            INSERT INTO products (name, description, flavor_id, drum_id, vendor_id, created_at)
                            VALUES (?, ?, ?, ?, ?, NOW())
                        `, [
                            `${item.name} - ${item.size}`,
                            `${item.name} ice cream`,
                            item.flavor_id,
                            drumId,
                            vendor_id
                        ]);
                        
                        productId = productResult.insertId;
                    } else {
                        continue;
                    }
                }
                
                // Insert order item
                await pool.query(`
                    INSERT INTO order_items (
                        order_id, 
                        product_id, 
                        containerDrum_id, 
                        quantity, 
                        price,
                        drum_status_id
                    ) VALUES (?, ?, ?, ?, ?, 1)
                `, [
                    orderId,
                    productId,
                    drumId,
                    item.quantity,
                    item.price
                ]);
                
            }
            
            // VERIFICATION: Ensure reservations happened (fallback if size wasn't available earlier)
            const [orderItemsForVerification] = await pool.query(`
                SELECT oi.quantity, cd.size, o.delivery_datetime
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.order_id
                JOIN container_drum cd ON oi.containerDrum_id = cd.drum_id
                WHERE oi.order_id = ?
            `, [orderId]);
            
            for (const orderItem of orderItemsForVerification) {
                const deliveryDate = new Date(orderItem.delivery_datetime).toISOString().split('T')[0];
                
                // Check if reservation exists
                const [existingReservation] = await pool.query(`
                    SELECT availability_id, available_count, reserved_count, booked_count, total_capacity
                    FROM daily_drum_availability
                    WHERE vendor_id = ? AND delivery_date = ? AND drum_size = ?
                `, [vendor_id, deliveryDate, orderItem.size]);
                
                if (existingReservation.length === 0) {
                    // Reservation wasn't created - create it now from order_items data
                    const [capacity] = await pool.query(`
                        SELECT stock FROM vendor_drum_pricing
                        WHERE vendor_id = ? AND drum_size = ?
                    `, [vendor_id, orderItem.size]);
                    
                    const totalCapacity = capacity[0]?.stock || 0;
                    
                    if (totalCapacity >= orderItem.quantity) {
                        await pool.query(`
                            INSERT INTO daily_drum_availability (
                                vendor_id, delivery_date, drum_size,
                                total_capacity, reserved_count, booked_count, available_count
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [vendor_id, deliveryDate, orderItem.size, totalCapacity, orderItem.quantity, 0, totalCapacity - orderItem.quantity]);
                    }
                } else {
                    // Reservation record exists - verify if this order was properly reserved
                    const currentState = existingReservation[0];
                    
                    // Convert to numbers and handle null/undefined
                    const totalCapacity = Number(currentState.total_capacity) || 0;
                    const reservedCount = Number(currentState.reserved_count) || 0;
                    const bookedCount = Number(currentState.booked_count) || 0;
                    const availableCount = Number(currentState.available_count) || 0;
                    
                    // Verify consistency: total should equal reserved + booked + available
                    const calculatedTotal = reservedCount + bookedCount + availableCount;
                    
                    if (totalCapacity > 0 && calculatedTotal !== totalCapacity) {
                        const correctAvailable = totalCapacity - reservedCount - bookedCount;
                        
                        if (!isNaN(correctAvailable) && isFinite(correctAvailable)) {
                            await pool.query(`
                                UPDATE daily_drum_availability
                                SET available_count = ?
                                WHERE availability_id = ?
                            `, [Math.max(0, correctAvailable), currentState.availability_id]);
                        }
                    }
                    
                    // Check if reservation was likely missed: if available = total_capacity and reserved = 0,
                    // it means no reservations were made yet, so we should reserve this order
                    if (totalCapacity > 0 && 
                        availableCount === totalCapacity && 
                        reservedCount === 0 && 
                        bookedCount === 0) {
                        
                        // No reservations exist yet - this order should be reserved
                        await pool.query(`
                            UPDATE daily_drum_availability
                            SET reserved_count = reserved_count + ?,
                                available_count = available_count - ?
                            WHERE availability_id = ? AND available_count >= ?
                        `, [orderItem.quantity, orderItem.quantity, currentState.availability_id, orderItem.quantity]);
                    }
                }
            }
        }

        res.json({
            success: true,
            message: 'Order created successfully',
            order_id: orderId,
            order: {
                order_id: orderId,
                customer_id,
                vendor_id,
                delivery_address,
                delivery_datetime,
                total_amount,
                status,
                payment_status
            }
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get orders for a specific customer
const getCustomerOrders = async (req, res) => {
    try {
        const { customer_id } = req.params;

        console.log('Fetching orders for customer:', customer_id);

        const [orders] = await pool.query(`
            SELECT 
                o.*,
                v.store_name as vendor_name,
                u.fname as customer_fname,
                u.lname as customer_lname,
                CASE 
                    WHEN GROUP_CONCAT(DISTINCT ds.status_name SEPARATOR ', ') LIKE '%not returned%' THEN 'return_requested'
                    WHEN GROUP_CONCAT(DISTINCT ds.status_name SEPARATOR ', ') LIKE '%returned%' THEN 'returned'
                    WHEN GROUP_CONCAT(DISTINCT ds.status_name SEPARATOR ', ') LIKE '%in use%' THEN 'in_use'
                    ELSE 'in_use'
                END as drum_status,
                MAX(oi.return_requested_at) as return_requested_at,
                o.decline_reason,
                COALESCE(
                    GROUP_CONCAT(
                        CONCAT(
                            COALESCE(f.flavor_name, 'Unknown Flavor'), 
                            ' (', 
                            COALESCE(cd.size, 'Unknown'), 
                            ' - ', 
                            COALESCE(cd.gallons, '0'), 
                            ' gallons) x', 
                            oi.quantity
                        ) 
                        SEPARATOR ', '
                    ), 
                    'No items found'
                ) as order_items_details,
                COALESCE(GROUP_CONCAT(f.flavor_name SEPARATOR ', '), 'Unknown') as flavors,
                COALESCE(GROUP_CONCAT(cd.size SEPARATOR ', '), 'Unknown') as sizes,
                COALESCE(GROUP_CONCAT(oi.quantity SEPARATOR ', '), 'Unknown') as quantities
            FROM orders o
            LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
            LEFT JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN flavors f ON p.flavor_id = f.flavor_id
            LEFT JOIN container_drum cd ON oi.containerDrum_id = cd.drum_id
            LEFT JOIN drum_stats ds ON oi.drum_status_id = ds.drum_status_id
            WHERE o.customer_id = ?
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
        `, [customer_id]);

        console.log('Found orders for customer:', orders.length);
        
        // Debug: Log order items details for first few orders
        if (orders.length > 0) {
            console.log('Sample order data:');
            orders.slice(0, 2).forEach((order, index) => {
                console.log(`Order ${index + 1} (ID: ${order.order_id}):`, {
                    vendor_name: order.vendor_name,
                    order_items_details: order.order_items_details,
                    flavors: order.flavors,
                    total_amount: order.total_amount
                });
            });
        }

        res.json({
            success: true,
            orders: orders
        });

    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get orders for a specific vendor
const getVendorOrders = async (req, res) => {
    try {
        const { vendor_id } = req.params;

        console.log('Fetching orders for vendor:', vendor_id);

        const [orders] = await pool.query(`
            SELECT 
                o.*,
                u.fname as customer_fname,
                u.lname as customer_lname,
                u.email as customer_email,
                u.contact_no as customer_contact,
                CASE 
                    WHEN GROUP_CONCAT(DISTINCT ds.status_name SEPARATOR ', ') LIKE '%not returned%' THEN 'return_requested'
                    WHEN GROUP_CONCAT(DISTINCT ds.status_name SEPARATOR ', ') LIKE '%returned%' THEN 'returned'
                    WHEN GROUP_CONCAT(DISTINCT ds.status_name SEPARATOR ', ') LIKE '%in use%' THEN 'in_use'
                    ELSE 'in_use'
                END as drum_status,
                MAX(oi.return_requested_at) as return_requested_at,
                o.decline_reason,
                GROUP_CONCAT(
                    CONCAT(
                        f.flavor_name, 
                        ' (', 
                        cd.size, 
                        ' - ', 
                        cd.gallons, 
                        ' gallons) x', 
                        oi.quantity
                    ) 
                    SEPARATOR ', '
                ) as order_items_details,
                GROUP_CONCAT(f.flavor_name SEPARATOR ', ') as flavors,
                GROUP_CONCAT(cd.size SEPARATOR ', ') as sizes,
                GROUP_CONCAT(oi.quantity SEPARATOR ', ') as quantities
            FROM orders o
            LEFT JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN flavors f ON p.flavor_id = f.flavor_id
            LEFT JOIN container_drum cd ON oi.containerDrum_id = cd.drum_id
            LEFT JOIN drum_stats ds ON oi.drum_status_id = ds.drum_status_id
            WHERE o.vendor_id = ?
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
        `, [vendor_id]);

        console.log('Found orders for vendor:', orders.length);

        // Get payment confirmation data for orders that have QR payments
        const orderIds = orders.map(order => order.order_id);
        let paymentData = {};
        
        if (orderIds.length > 0) {
            try {
                const [paymentRows] = await pool.query(`
                    SELECT order_id, payment_confirmation_image, customer_notes as payment_notes, 
                           payment_amount as qr_payment_amount, payment_method as qr_payment_method
                    FROM qr_payment_transactions 
                    WHERE order_id IN (${orderIds.map(() => '?').join(',')})
                `, orderIds);
                
                // Create a lookup object for payment data
                paymentRows.forEach(payment => {
                    paymentData[payment.order_id] = payment;
                });
            } catch (error) {
                console.error('Error fetching payment data:', error);
                // Continue without payment data if there's an error
            }
        }

        // Merge payment data with orders
        const ordersWithPaymentData = orders.map(order => ({
            ...order,
            ...paymentData[order.order_id]
        }));

        res.json({
            success: true,
            orders: ordersWithPaymentData
        });

    } catch (error) {
        console.error('Error fetching vendor orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { status, decline_reason } = req.body;

        console.log('Updating order status:', order_id, 'to', status);
        if (decline_reason) {
            console.log('Decline reason:', decline_reason);
        }

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refund'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        // If status is cancelled and decline_reason is provided, include it in the update
        let updateQuery, updateParams;
        if (status === 'cancelled' && decline_reason) {
            updateQuery = `
                UPDATE orders 
                SET status = ?, decline_reason = ? 
                WHERE order_id = ?
            `;
            updateParams = [status, decline_reason, order_id];
        } else {
            updateQuery = `
                UPDATE orders 
                SET status = ? 
                WHERE order_id = ?
            `;
            updateParams = [status, order_id];
        }

        const [result] = await pool.query(updateQuery, updateParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Get order details for notification
        const [orderDetails] = await pool.query(`
            SELECT customer_id, vendor_id, status 
            FROM orders 
            WHERE order_id = ?
        `, [order_id]);

        if (orderDetails.length > 0) {
            const { customer_id, vendor_id } = orderDetails[0];
            
            // Create appropriate notifications based on status
            try {
                let notificationType, title, message;
                
                switch (status) {
                    case 'confirmed':
                        notificationType = 'order_accepted';
                        title = 'Order Confirmed';
                        message = `Great news! Your order #${order_id} has been confirmed by the vendor. Please complete your payment first, then the vendor will start preparing your order.`;
                        break;
                    case 'preparing':
                        notificationType = 'order_preparing';
                        title = 'Order Being Prepared';
                        message = `Your order #${order_id} is now being prepared by the vendor.`;
                        break;
                    case 'out_for_delivery':
                        notificationType = 'order_ready';
                        title = 'Order Out for Delivery';
                        message = `Your order #${order_id} is on its way to you! Track your delivery.`;
                        break;
                    case 'delivered':
                        notificationType = 'order_delivered';
                        title = 'Order Delivered';
                        message = `Your order #${order_id} has been delivered successfully. Enjoy your ice cream!`;
                        break;
                    case 'cancelled':
                        notificationType = 'order_cancelled';
                        title = 'Order Declined';
                        message = decline_reason 
                            ? `Your order #${order_id} has been declined by the vendor. Reason: ${decline_reason}`
                            : `Your order #${order_id} has been cancelled. Contact support if you have any questions.`;
                        break;
                    default:
                        return; // No notification for other statuses
                }

                // Create notification for customer
                await createNotification({
                    user_id: customer_id,
                    user_type: 'customer',
                    title,
                    message,
                    notification_type: notificationType,
                    related_order_id: parseInt(order_id),
                    related_vendor_id: vendor_id,
                    related_customer_id: customer_id
                });

                console.log(`📬 Status notification created for order ${order_id}: ${status}`);
            } catch (notificationError) {
                console.error('Failed to create status notification:', notificationError);
                // Don't fail the status update if notification creation fails
            }
        }

        res.json({
            success: true,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        
        // Check if this is a QR payment confirmation with image
        if (req.body.payment_method === 'gcash_qr' && (req.file || req.body.payment_confirmation_image)) {
            return await updateQRPaymentStatus(req, res);
        }
        
        const { payment_status } = req.body;

        console.log('Updating payment status:', order_id, 'to', payment_status);

        // Validate payment status
        const validPaymentStatuses = ['unpaid', 'partial', 'paid'];
        if (!validPaymentStatuses.includes(payment_status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment status. Must be one of: ' + validPaymentStatuses.join(', ')
            });
        }

        const [result] = await pool.query(`
            UPDATE orders 
            SET payment_status = ? 
            WHERE order_id = ?
        `, [payment_status, order_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Get order details for notification
        const [orderDetails] = await pool.query(`
            SELECT customer_id, vendor_id, payment_status 
            FROM orders 
            WHERE order_id = ?
        `, [order_id]);

        if (orderDetails.length > 0) {
            const { customer_id, vendor_id } = orderDetails[0];
            
            // Create appropriate notifications based on payment status
            try {
                let notificationType, title, message;
                
                switch (payment_status) {
                    case 'paid':
                        notificationType = 'payment_confirmed';
                        title = 'Payment Confirmed';
                        message = `Your payment for order #${order_id} has been confirmed. The vendor will now start preparing your order.`;
                        
                        // Create notification for customer
                        await createNotification({
                            user_id: customer_id,
                            user_type: 'customer',
                            title,
                            message,
                            notification_type: notificationType,
                            related_order_id: parseInt(order_id),
                            related_vendor_id: vendor_id,
                            related_customer_id: customer_id
                        });

                        // Create notification for vendor - get vendor's user_id first
                        const [vendorUser] = await pool.query(`
                            SELECT user_id FROM vendors WHERE vendor_id = ?
                        `, [vendor_id]);
                        
                        if (vendorUser.length > 0) {
                            await createNotification({
                                user_id: vendorUser[0].user_id,
                                user_type: 'vendor',
                                title: 'Payment Received',
                                message: `Payment confirmed for order #${order_id}. You can now start preparing the order.`,
                                notification_type: 'payment_confirmed',
                                related_order_id: parseInt(order_id),
                                related_vendor_id: vendor_id,
                                related_customer_id: customer_id
                            });
                        }
                        break;
                    case 'partial':
                        notificationType = 'payment_confirmed';
                        title = 'Partial Payment Received';
                        message = `Partial payment received for order #${order_id}. Remaining balance due on delivery.`;
                        
                        await createNotification({
                            user_id: customer_id,
                            user_type: 'customer',
                            title,
                            message,
                            notification_type: notificationType,
                            related_order_id: parseInt(order_id),
                            related_vendor_id: vendor_id,
                            related_customer_id: customer_id
                        });
                        break;
                    default:
                        // No notification for other payment statuses
                        break;
                }

                console.log(`📬 Payment notification created for order ${order_id}: ${payment_status}`);
            } catch (notificationError) {
                console.error('Failed to create payment notification:', notificationError);
                // Don't fail the payment update if notification creation fails
            }
        }

        res.json({
            success: true,
            message: 'Payment status updated successfully'
        });

    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update payment status',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Handle QR payment confirmation with image
const updateQRPaymentStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { payment_status, payment_method, customer_notes } = req.body;
        
        console.log('Updating QR payment status for order:', order_id);
        
        // Get order details
        const [orderDetails] = await pool.query(`
            SELECT customer_id, vendor_id, total_amount, status, payment_status, payment_amount, remaining_balance 
            FROM orders 
            WHERE order_id = ?
        `, [order_id]);
        
        if (orderDetails.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        const order = orderDetails[0];
        
        // Check if payment is already confirmed
        if (order.payment_status === 'paid') {
            return res.status(400).json({
                success: false,
                error: 'Payment already confirmed',
                message: 'This order has already been paid and cannot be modified'
            });
        }
        
        // Handle payment confirmation image upload to Cloudinary
        let paymentConfirmationImageUrl = null;
        if (req.file) {
            try {
                const cloudinary = require('cloudinary').v2;
                
                const cloudinaryResult = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'image',
                            folder: 'payment-confirmations',
                            public_id: `payment-${order_id}-${Date.now()}`,
                            transformation: [
                                { width: 800, height: 600, crop: 'limit' },
                                { quality: 'auto' }
                            ]
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(req.file.buffer);
                });
                
                paymentConfirmationImageUrl = cloudinaryResult.secure_url;
                console.log('Payment confirmation image uploaded to Cloudinary:', paymentConfirmationImageUrl);
            } catch (uploadError) {
                console.error('Error uploading payment confirmation image:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload payment confirmation image'
                });
            }
        }
        
        // Determine payment status: keep 'partial' if it's a partial payment, otherwise set to 'paid'
        // Check if payment_amount exists and is less than total_amount (indicating partial payment)
        const isPartialPayment = order.payment_amount && 
                                parseFloat(order.payment_amount) > 0 && 
                                parseFloat(order.payment_amount) < parseFloat(order.total_amount);
        
        const newPaymentStatus = isPartialPayment ? 'partial' : 'paid';
        
        // Update order payment status and set order status to 'confirmed' when payment is confirmed
        await pool.query(`
            UPDATE orders 
            SET payment_status = ?, status = 'confirmed'
            WHERE order_id = ?
        `, [newPaymentStatus, order_id]);

        // CONVERT RESERVED TO BOOKED IN INVENTORY
        console.log('Converting reserved drums to booked for order #' + order_id);
        
        const [orderItems] = await pool.query(`
            SELECT oi.quantity, cd.size, o.delivery_datetime, o.vendor_id, o.reservation_expires_at
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN container_drum cd ON oi.containerDrum_id = cd.drum_id
            WHERE oi.order_id = ?
        `, [order_id]);

        if (orderItems.length > 0) {
            // Check if reservation expired
            const now = new Date();
            
            for (const item of orderItems) {
                if (item.reservation_expires_at && new Date(item.reservation_expires_at) < now) {
                    // Rollback payment confirmation
                    await pool.query(`
                        UPDATE orders 
                        SET payment_status = 'unpaid', status = 'pending'
                        WHERE order_id = ?
                    `, [order_id]);
                    
                    return res.status(400).json({
                        success: false,
                        error: 'Reservation expired. Your payment was received too late - the reservation expired 24 hours before delivery time. Please place a new order.'
                    });
                }
                
                const deliveryDate = new Date(item.delivery_datetime).toISOString().split('T')[0];
                
                // Convert reserved to booked
                await pool.query(`
                    UPDATE daily_drum_availability
                    SET reserved_count = reserved_count - ?,
                        booked_count = booked_count + ?
                    WHERE vendor_id = ? AND delivery_date = ? AND drum_size = ?
                `, [item.quantity, item.quantity, item.vendor_id, deliveryDate, item.size]);
            }
        }
        
        // Create QR payment transaction record
        // Use payment_amount if it's a partial payment, otherwise use total_amount
        const transactionAmount = (order.payment_status === 'partial' && order.payment_amount) 
            ? order.payment_amount 
            : order.total_amount;
        
        await pool.query(`
            INSERT INTO qr_payment_transactions (
                order_id,
                customer_id,
                vendor_id,
                payment_amount,
                payment_method,
                payment_status,
                payment_confirmation_image,
                customer_notes,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            order_id,
            order.customer_id,
            order.vendor_id,
            transactionAmount,
            payment_method || 'gcash_qr',
            'completed',
            paymentConfirmationImageUrl,
            customer_notes
        ]);
        
        // Create notifications
        try {
            // Determine notification messages based on payment type
            const isPartialPayment = (newPaymentStatus === 'partial' && order.payment_amount);
            const customerMessage = isPartialPayment 
                ? `Your 50% payment (₱${parseFloat(order.payment_amount).toFixed(2)}) for order #${order_id} has been confirmed. Remaining balance of ₱${parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)} due on delivery. The vendor will now start preparing your order.`
                : `Your payment for order #${order_id} has been confirmed. The vendor will now start preparing your order.`;
            const vendorMessage = isPartialPayment
                ? `Customer has paid 50% (₱${parseFloat(order.payment_amount).toFixed(2)}) for order #${order_id}. Remaining balance of ₱${parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)} due on delivery. You can now start preparing the order.`
                : `Customer has paid for order #${order_id}. You can now start preparing the order.`;
            
            // Notification for customer
            await pool.query(`
                INSERT INTO notifications (
                    user_id, user_type, title, message, notification_type, is_read, created_at,
                    related_order_id, related_vendor_id, related_customer_id
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
            `, [
                order.customer_id,
                'customer',
                isPartialPayment ? 'Partial Payment Confirmed' : 'Payment Confirmed',
                customerMessage,
                'payment_confirmed',
                false,
                order_id,
                order.vendor_id,
                order.customer_id
            ]);
            
            // Notification for vendor - get vendor's user_id first
            const [vendorUser] = await pool.query(`
                SELECT user_id FROM vendors WHERE vendor_id = ?
            `, [order.vendor_id]);
            
            if (vendorUser.length > 0) {
                await pool.query(`
                    INSERT INTO notifications (
                        user_id, user_type, title, message, notification_type, is_read, created_at,
                        related_order_id, related_vendor_id, related_customer_id
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
                `, [
                    vendorUser[0].user_id,
                    'vendor',
                    isPartialPayment ? 'Partial Payment Received' : 'Payment Received',
                    vendorMessage,
                    'payment_confirmed',
                    false,
                    order_id,
                    order.vendor_id,
                    order.customer_id
                ]);
            }
        } catch (notificationError) {
            console.error('Failed to create QR payment notifications:', notificationError);
        }
        
        res.json({
            success: true,
            message: 'QR payment confirmed successfully',
            payment_confirmation_image: paymentConfirmationImageUrl
        });
        
    } catch (error) {
        console.error('Error updating QR payment status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to confirm QR payment',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get all orders for admin dashboard
const getAllOrdersAdmin = async (req, res) => {
    try {
        console.log('Fetching all orders for admin dashboard');

        const [orders] = await pool.query(`
            SELECT 
                o.order_id,
                o.customer_id,
                o.vendor_id,
                o.delivery_datetime,
                o.delivery_address,
                o.total_amount,
                o.status,
                o.payment_status,
                o.created_at,
                u.fname as customer_fname,
                u.lname as customer_lname,
                u.email as customer_email,
                u.contact_no as customer_contact,
                v.store_name as vendor_name,
                v.status as vendor_status
            FROM orders o
            LEFT JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
            ORDER BY o.created_at DESC
        `);

        console.log('Found orders for admin:', orders.length);

        res.json({
            success: true,
            orders: orders
        });

    } catch (error) {
        console.error('Error fetching all orders for admin:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Update drum return status
const updateDrumReturnStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { drum_status, return_requested_at } = req.body;

        console.log('Updating drum return status for order:', order_id, 'to', drum_status);

        // Validate drum status - map to drum_stats table values
        const statusMapping = {
            'in_use': 1,
            'return_requested': 2, // maps to 'not returned' in drum_stats
            'returned': 3
        };

        if (!statusMapping[drum_status]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid drum status. Must be one of: in_use, return_requested, returned'
            });
        }

        const drum_status_id = statusMapping[drum_status];

        // First, check if the order exists
        const [orderCheck] = await pool.query(`
            SELECT order_id FROM orders WHERE order_id = ?
        `, [order_id]);

        if (orderCheck.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Convert ISO datetime to MySQL format
        const mysqlDateTime = return_requested_at ? 
            new Date(return_requested_at).toISOString().slice(0, 19).replace('T', ' ') : 
            null;

        // Update drum status in order_items table for all items in this order
        const [result] = await pool.query(`
            UPDATE order_items 
            SET drum_status_id = ?, 
                return_requested_at = ?
            WHERE order_id = ?
        `, [drum_status_id, mysqlDateTime, order_id]);

        // If no order items exist, create a basic one for drum return tracking
        if (result.affectedRows === 0) {
            console.log(`No order items found for order ${order_id}, creating basic order item for drum return tracking`);
            
            // Get order details to create a basic order item
            const [orderDetails] = await pool.query(`
                SELECT customer_id, vendor_id, total_amount, created_at
                FROM orders 
                WHERE order_id = ?
            `, [order_id]);
            
            if (orderDetails.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found'
                });
            }
            
            const order = orderDetails[0];
            
            // Get a default drum_id (small size)
            const [drums] = await pool.query(`
                SELECT drum_id FROM container_drum WHERE size = 'small' LIMIT 1
            `);
            
            if (drums.length === 0) {
                return res.status(500).json({
                    success: false,
                    error: 'No drum sizes available'
                });
            }
            
            const drumId = drums[0].drum_id;
            
            // Create a basic product for this order if it doesn't exist
            const [products] = await pool.query(`
                SELECT product_id FROM products 
                WHERE vendor_id = ? AND flavor_id IS NULL 
                LIMIT 1
            `, [order.vendor_id]);
            
            let productId;
            if (products.length > 0) {
                productId = products[0].product_id;
            } else {
                // Create a basic product for drum return tracking
                const [productResult] = await pool.query(`
                    INSERT INTO products (name, description, flavor_id, drum_id, vendor_id, created_at)
                    VALUES (?, ?, NULL, ?, ?, NOW())
                `, ['Ice Cream Order', 'Ice cream order', drumId, order.vendor_id]);
                productId = productResult.insertId;
            }
            
            // Create order item for drum return tracking
            await pool.query(`
                INSERT INTO order_items (
                    order_id, 
                    product_id, 
                    containerDrum_id, 
                    quantity, 
                    price,
                    drum_status_id,
                    return_requested_at
                ) VALUES (?, ?, ?, 1, ?, ?, ?)
            `, [
                order_id,
                productId,
                drumId,
                order.total_amount,
                drum_status_id,
                mysqlDateTime
            ]);
            
            console.log(`Created order item for drum return tracking for order ${order_id}`);
        }

        console.log(`Updated drum return status for order ${order_id}: ${drum_status}`);

        // If this is a drum return request, notify the vendor
        if (drum_status === 'return_requested') {
            // Get order details to find vendor and customer info
            const [orderDetails] = await pool.query(`
                SELECT 
                    o.customer_id, 
                    o.vendor_id,
                    u.fname as customer_fname,
                    u.lname as customer_lname,
                    v.store_name
                FROM orders o
                LEFT JOIN users u ON o.customer_id = u.user_id
                LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
                WHERE o.order_id = ?
            `, [order_id]);

            if (orderDetails.length > 0) {
                const { customer_id, vendor_id, customer_fname, customer_lname, store_name } = orderDetails[0];
                
                try {
                    // Create notification for vendor - get vendor's user_id first
                    const [vendorUser] = await pool.query(`
                        SELECT user_id FROM vendors WHERE vendor_id = ?
                    `, [vendor_id]);
                    
                    if (vendorUser.length > 0) {
                        await createNotification({
                            user_id: vendorUser[0].user_id,
                            user_type: 'vendor',
                            title: 'Drum Return Requested 📦',
                            message: `Customer ${customer_fname} ${customer_lname} has requested to return the drum for order #${order_id}. Please arrange to pick up the drum from the customer.`,
                            notification_type: 'drum_return_requested',
                            related_order_id: parseInt(order_id),
                            related_vendor_id: vendor_id,
                            related_customer_id: customer_id
                        });
                    }
                    
                    console.log(`Drum return notification sent to vendor ${vendor_id} for order ${order_id}`);
                } catch (notificationError) {
                    console.error('Error creating drum return notification:', notificationError);
                    // Don't fail the entire request if notification fails
                }
            }
        }

        res.json({
            success: true,
            message: 'Drum return status updated successfully',
            drum_status: drum_status,
            items_updated: result.affectedRows || 1
        });

    } catch (error) {
        console.error('Error updating drum return status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update drum return status',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get vendor transactions for transaction history
const getVendorTransactions = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        const { start_date, end_date, payment_method, status, page = 1, limit = 20 } = req.query;
        
        console.log('Fetching transactions for vendor:', vendor_id);
        
        // Calculate offset for pagination
        const offset = (page - 1) * limit;
        
        // Build the query conditions
        let whereConditions = ['o.vendor_id = ?'];
        let queryParams = [vendor_id];
        
        // Date range filter
        if (start_date && end_date) {
            whereConditions.push('DATE(o.created_at) BETWEEN ? AND ?');
            queryParams.push(start_date, end_date);
        }
        
        // Payment method filter
        if (payment_method && payment_method !== 'all') {
            if (payment_method === 'gcash_qr') {
                whereConditions.push('qpt.payment_method IS NOT NULL');
            } else if (payment_method === 'cash') {
                whereConditions.push('qpt.payment_method IS NULL');
            }
        }
        
        // Status filter
        if (status && status !== 'all') {
            if (status === 'completed') {
                whereConditions.push('o.payment_status = "paid"');
            } else if (status === 'pending') {
                whereConditions.push('o.payment_status = "unpaid"');
            }
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Main query to get transactions
        const [transactions] = await pool.query(`
            SELECT 
                o.order_id,
                o.customer_id,
                o.vendor_id,
                o.total_amount,
                o.payment_status,
                o.status as order_status,
                o.created_at as order_date,
                u.fname as customer_fname,
                u.lname as customer_lname,
                u.contact_no as customer_contact,
                v.store_name as vendor_name,
                MAX(qpt.payment_method) as payment_method,
                MAX(qpt.payment_amount) as qr_payment_amount,
                MAX(qpt.customer_notes) as customer_notes,
                MAX(qpt.payment_confirmation_image) as payment_confirmation_image,
                MAX(qpt.created_at) as payment_date,
                CASE 
                    WHEN MAX(qpt.payment_method) IS NOT NULL THEN 'GCash QR'
                    ELSE 'Cash'
                END as transaction_type,
                CASE 
                    WHEN o.payment_status = 'paid' THEN 'completed'
                    WHEN o.payment_status = 'unpaid' THEN 'pending'
                    ELSE o.payment_status
                END as transaction_status
            FROM orders o
            LEFT JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
            LEFT JOIN qr_payment_transactions qpt ON o.order_id = qpt.order_id
            WHERE ${whereClause}
            GROUP BY o.order_id, o.customer_id, o.vendor_id, o.total_amount, o.payment_status, o.status, o.created_at, u.fname, u.lname, u.contact_no, v.store_name
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), parseInt(offset)]);
        
        // Get total count for pagination
        const [countResult] = await pool.query(`
            SELECT COUNT(DISTINCT o.order_id) as total
            FROM orders o
            LEFT JOIN qr_payment_transactions qpt ON o.order_id = qpt.order_id
            WHERE ${whereClause}
        `, queryParams);
        
        // Get transaction statistics
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN payment_status = 'paid' THEN CAST(total_amount AS DECIMAL(10,2)) ELSE 0 END) as total_earnings,
                SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN payment_status = 'paid' AND has_qr_payment = 1 THEN 1 ELSE 0 END) as gcash_transactions,
                SUM(CASE WHEN payment_status = 'paid' AND has_qr_payment = 0 THEN 1 ELSE 0 END) as cash_transactions
            FROM (
                SELECT DISTINCT 
                    o.order_id,
                    o.payment_status,
                    o.total_amount,
                    CASE WHEN qpt.payment_method IS NOT NULL THEN 1 ELSE 0 END as has_qr_payment
                FROM orders o
                LEFT JOIN qr_payment_transactions qpt ON o.order_id = qpt.order_id
                WHERE o.vendor_id = ?
            ) as unique_orders
        `, [vendor_id]);
        
        console.log('Found transactions for vendor:', transactions.length);
        
        res.json({
            success: true,
            transactions: transactions,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(countResult[0].total / limit),
                total_transactions: countResult[0].total,
                limit: parseInt(limit)
            },
            statistics: stats[0]
        });
        
    } catch (error) {
        console.error('Error fetching vendor transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor transactions',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Customer selects payment method for remaining balance (GCash or COD)
const selectRemainingPaymentMethod = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { payment_method } = req.body; // 'gcash' or 'cod'

        // Validate payment method
        if (!payment_method || !['gcash', 'cod'].includes(payment_method.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method. Must be "gcash" or "cod"'
            });
        }

        // Get order details
        const [orderDetails] = await pool.query(`
            SELECT order_id, customer_id, vendor_id, total_amount, payment_amount, remaining_balance, 
                   payment_status, status
            FROM orders 
            WHERE order_id = ?
        `, [order_id]);

        if (orderDetails.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const order = orderDetails[0];

        // Check if order has remaining balance
        if (!order.remaining_balance || parseFloat(order.remaining_balance) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'This order has no remaining balance'
            });
        }

        // Check if already fully paid
        if (order.payment_status === 'paid') {
            return res.status(400).json({
                success: false,
                error: 'Order is already fully paid'
            });
        }

        // Update order with payment method selection
        await pool.query(`
            UPDATE orders 
            SET remaining_payment_method = ?,
                remaining_payment_method_selected_at = NOW()
            WHERE order_id = ?
        `, [payment_method.toLowerCase(), order_id]);

        // Create notifications
        try {
            // Notify customer
            await pool.query(`
                INSERT INTO notifications (
                    user_id, user_type, title, message, notification_type, is_read, created_at,
                    related_order_id, related_vendor_id, related_customer_id
                ) VALUES (?, 'customer', ?, ?, 'payment_method_selected', 0, NOW(), ?, ?, ?)
            `, [
                order.customer_id,
                'Payment Method Selected',
                `You selected ${payment_method.toUpperCase()} payment for remaining balance of ₱${parseFloat(order.remaining_balance).toFixed(2)}. ${payment_method.toLowerCase() === 'gcash' ? 'Please proceed with payment.' : 'Please prepare cash on delivery.'}`,
                order_id,
                order.vendor_id,
                order.customer_id
            ]);

            // Notify vendor
            await pool.query(`
                INSERT INTO notifications (
                    user_id, user_type, title, message, notification_type, is_read, created_at,
                    related_order_id, related_vendor_id, related_customer_id
                ) VALUES (?, 'vendor', ?, ?, 'payment_method_selected', 0, NOW(), ?, ?, ?)
            `, [
                order.vendor_id,
                'Customer Selected Payment Method',
                `Customer selected ${payment_method.toUpperCase()} for remaining balance of ₱${parseFloat(order.remaining_balance).toFixed(2)} for order #${order_id}`,
                order_id,
                order.vendor_id,
                order.customer_id
            ]);
        } catch (notificationError) {
            console.error('Failed to create notifications:', notificationError);
            // Don't fail the request if notification fails
        }

        res.json({
            success: true,
            message: `Payment method selected: ${payment_method.toUpperCase()}`,
            order_id: order_id,
            remaining_balance: parseFloat(order.remaining_balance),
            payment_method: payment_method.toLowerCase()
        });

    } catch (error) {
        console.error('Error selecting payment method:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to select payment method',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Customer pays remaining balance via GCash
const payRemainingBalanceGCash = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { payment_confirmation_image } = req.body; // Base64 or URL

        // This is similar to updateQRPaymentStatus but for remaining balance
        // Get order details
        const [orderDetails] = await pool.query(`
            SELECT order_id, customer_id, vendor_id, total_amount, payment_amount, remaining_balance, 
                   payment_status, remaining_payment_method, status
            FROM orders 
            WHERE order_id = ?
        `, [order_id]);

        if (orderDetails.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const order = orderDetails[0];

        // Check if remaining balance exists
        const remainingBalance = parseFloat(order.remaining_balance) || 0;
        if (remainingBalance <= 0) {
            return res.status(400).json({
                success: false,
                error: 'No remaining balance to pay'
            });
        }

        // Check if payment method is GCash
        if (order.remaining_payment_method !== 'gcash') {
            return res.status(400).json({
                success: false,
                error: 'Payment method for remaining balance is not GCash. Please select GCash payment method first.'
            });
        }

        // Check if already fully paid
        if (order.payment_status === 'paid') {
            return res.status(400).json({
                success: false,
                error: 'Order is already fully paid'
            });
        }

        // Handle payment confirmation image upload to Cloudinary
        let paymentConfirmationImageUrl = null;
        if (req.file || payment_confirmation_image) {
            try {
                const cloudinary = require('cloudinary').v2;
                
                if (req.file) {
                    const cloudinaryResult = await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            {
                                resource_type: 'image',
                                folder: 'payment_confirmations'
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        ).end(req.file.buffer);
                    });
                    paymentConfirmationImageUrl = cloudinaryResult.secure_url;
                } else if (payment_confirmation_image) {
                    // If base64 or URL provided directly
                    paymentConfirmationImageUrl = payment_confirmation_image;
                }
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                // Continue without image if upload fails
            }
        }

        // Update order: mark as fully paid and clear remaining balance
        await pool.query(`
            UPDATE orders 
            SET payment_status = 'paid',
                remaining_balance = 0,
                remaining_payment_confirmed_at = NOW(),
                remaining_payment_confirmed_by = 'customer',
                payment_method = 'gcash'
            WHERE order_id = ?
        `, [order_id]);

        // Create QR payment transaction record for remaining balance
        await pool.query(`
            INSERT INTO qr_payment_transactions (
                order_id,
                customer_id,
                vendor_id,
                payment_amount,
                payment_method,
                payment_status,
                payment_confirmation_image,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            order_id,
            order.customer_id,
            order.vendor_id,
            remainingBalance,
            'gcash_qr',
            'completed',
            paymentConfirmationImageUrl
        ]);

        // Create notifications
        try {
            // Notify customer
            await pool.query(`
                INSERT INTO notifications (
                    user_id, user_type, title, message, notification_type, is_read, created_at,
                    related_order_id, related_vendor_id, related_customer_id
                ) VALUES (?, 'customer', ?, ?, 'payment_received', 0, NOW(), ?, ?, ?)
            `, [
                order.customer_id,
                'Remaining Balance Paid',
                `Your remaining balance of ₱${remainingBalance.toFixed(2)} for order #${order_id} has been paid successfully.`,
                order_id,
                order.vendor_id,
                order.customer_id
            ]);

            // Notify vendor
            await pool.query(`
                INSERT INTO notifications (
                    user_id, user_type, title, message, notification_type, is_read, created_at,
                    related_order_id, related_vendor_id, related_customer_id
                ) VALUES (?, 'vendor', ?, ?, 'payment_received', 0, NOW(), ?, ?, ?)
            `, [
                order.vendor_id,
                'Remaining Balance Received',
                `Customer paid remaining balance of ₱${remainingBalance.toFixed(2)} for order #${order_id} via GCash.`,
                order_id,
                order.vendor_id,
                order.customer_id
            ]);
        } catch (notificationError) {
            console.error('Failed to create notifications:', notificationError);
        }

        res.json({
            success: true,
            message: 'Remaining balance paid successfully',
            order_id: order_id,
            remaining_balance_paid: remainingBalance,
            payment_status: 'paid'
        });

    } catch (error) {
        console.error('Error paying remaining balance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process remaining balance payment',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Vendor confirms COD payment collection
const confirmCODPayment = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { amount_collected } = req.body;

        // Get order details
        const [orderDetails] = await pool.query(`
            SELECT order_id, customer_id, vendor_id, total_amount, payment_amount, remaining_balance, 
                   payment_status, remaining_payment_method, status
            FROM orders 
            WHERE order_id = ?
        `, [order_id]);

        if (orderDetails.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const order = orderDetails[0];
        const expectedAmount = parseFloat(order.remaining_balance) || 0;
        const collectedAmount = parseFloat(amount_collected) || 0;

        // Check if remaining balance exists
        if (expectedAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'No remaining balance to collect'
            });
        }

        // Check if payment method is COD
        if (order.remaining_payment_method !== 'cod') {
            return res.status(400).json({
                success: false,
                error: 'Payment method for remaining balance is not COD'
            });
        }

        // Validate amount (allow small rounding differences)
        const difference = Math.abs(collectedAmount - expectedAmount);
        if (difference > 0.01) {
            return res.status(400).json({
                success: false,
                error: `Amount mismatch. Expected ₱${expectedAmount.toFixed(2)}, received ₱${collectedAmount.toFixed(2)}`,
                expected_amount: expectedAmount,
                collected_amount: collectedAmount
            });
        }

        // Update order: mark as fully paid and clear remaining balance
        await pool.query(`
            UPDATE orders 
            SET payment_status = 'paid',
                remaining_balance = 0,
                remaining_payment_confirmed_at = NOW(),
                remaining_payment_confirmed_by = 'vendor',
                payment_method = CASE 
                    WHEN payment_method IS NULL THEN 'cod'
                    WHEN payment_method = 'gcash' THEN 'gcash_cod'
                    ELSE 'cod'
                END
            WHERE order_id = ?
        `, [order_id]);

        // Create payment transaction record
        await pool.query(`
            INSERT INTO qr_payment_transactions (
                order_id,
                customer_id,
                vendor_id,
                payment_amount,
                payment_method,
                payment_status,
                vendor_notes,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            order_id,
            order.customer_id,
            order.vendor_id,
            collectedAmount,
            'cod',
            'completed',
            `COD payment collected by vendor`
        ]);

        // Create notifications
        try {
            // Notify customer
            await pool.query(`
                INSERT INTO notifications (
                    user_id, user_type, title, message, notification_type, is_read, created_at,
                    related_order_id, related_vendor_id, related_customer_id
                ) VALUES (?, 'customer', ?, ?, 'payment_received', 0, NOW(), ?, ?, ?)
            `, [
                order.customer_id,
                'Remaining Balance Collected',
                `Remaining balance of ₱${collectedAmount.toFixed(2)} for order #${order_id} has been collected via Cash on Delivery.`,
                order_id,
                order.vendor_id,
                order.customer_id
            ]);
        } catch (notificationError) {
            console.error('Failed to create notifications:', notificationError);
        }

        res.json({
            success: true,
            message: 'COD payment confirmed successfully',
            order_id: order_id,
            amount_collected: collectedAmount,
            payment_status: 'paid'
        });

    } catch (error) {
        console.error('Error confirming COD payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to confirm COD payment',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getOrderRecord,
    getOrderById,
    createOrder,
    getCustomerOrders,
    getVendorOrders,
    updateOrderStatus,
    updatePaymentStatus,
    updateQRPaymentStatus,
    getAllOrdersAdmin,
    updateDrumReturnStatus,
    getVendorTransactions,
    selectRemainingPaymentMethod,
    payRemainingBalanceGCash,
    confirmCODPayment
};