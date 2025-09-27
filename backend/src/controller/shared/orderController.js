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

        // Insert order into database
        const [orderResult] = await pool.query(`
            INSERT INTO orders (
                customer_id, 
                vendor_id, 
                delivery_datetime, 
                delivery_address, 
                total_amount, 
                status, 
                payment_status,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            customer_id,
            vendor_id,
            delivery_datetime,
            delivery_address,
            total_amount,
            status,
            payment_status
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
                message: `Your order #${orderId} has been placed and is waiting for vendor approval. Once approved, you'll need to pay first before the vendor starts preparing your order.`,
                notification_type: 'order_placed',
                related_order_id: orderId,
                related_vendor_id: vendor_id,
                related_customer_id: customer_id
            });

            // Notification for vendor
            await createNotification({
                user_id: vendor_id,
                user_type: 'vendor',
                title: 'New Order Received',
                message: `You have received a new order #${orderId} from a customer. Please review and respond.`,
                notification_type: 'order_placed',
                related_order_id: orderId,
                related_vendor_id: vendor_id,
                related_customer_id: customer_id
            });

            console.log('📬 Notifications created for order:', orderId);
        } catch (notificationError) {
            console.error('Failed to create notifications for order:', orderId, notificationError);
            // Don't fail the order creation if notification creation fails
        }

        // Insert order items if provided
        if (items && items.length > 0) {
            console.log('Inserting order items:', items);
            
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
                        console.log(`Created product: ${item.name} - ${item.size} with ID: ${productId}`);
                    } else {
                        console.warn(`No drum found for size: ${item.size}`);
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
                
                console.log(`Inserted order item: ${item.name} (${item.size}) x${item.quantity}`);
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
                ds.status_name as drum_status,
                oi.return_requested_at,
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
                u.contact_no as customer_contact,
                ds.status_name as drum_status,
                oi.return_requested_at,
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

        res.json({
            success: true,
            orders: orders
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

                        // Create notification for vendor
                        await createNotification({
                            user_id: vendor_id,
                            user_type: 'vendor',
                            title: 'Payment Received',
                            message: `Payment confirmed for order #${order_id}. You can now start preparing the order.`,
                            notification_type: 'payment_confirmed',
                            related_order_id: parseInt(order_id),
                            related_vendor_id: vendor_id,
                            related_customer_id: customer_id
                        });
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

        // Update drum status in order_items table for all items in this order
        const [result] = await pool.query(`
            UPDATE order_items 
            SET drum_status_id = ?, 
                return_requested_at = ?
            WHERE order_id = ?
        `, [drum_status_id, return_requested_at, order_id]);

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
                return_requested_at
            ]);
            
            console.log(`Created order item for drum return tracking for order ${order_id}`);
        }

        console.log(`Updated drum return status for order ${order_id}: ${drum_status}`);

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

module.exports = {
    getOrderRecord,
    createOrder,
    getCustomerOrders,
    getVendorOrders,
    updateOrderStatus,
    updatePaymentStatus,
    getAllOrdersAdmin,
    updateDrumReturnStatus
};