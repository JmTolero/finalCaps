const pool = require('../../db/config');    
const Orders = require('../../model/shared/orderModel');

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

        // TODO: Insert order items if provided
        // For now, we'll store order items info in a separate table if needed

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
                oi.return_requested_at
            FROM orders o
            LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
            LEFT JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
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
                oi.return_requested_at
            FROM orders o
            LEFT JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
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
        const { status } = req.body;

        console.log('Updating order status:', order_id, 'to', status);

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refund'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        const [result] = await pool.query(`
            UPDATE orders 
            SET status = ? 
            WHERE order_id = ?
        `, [status, order_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
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

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'No order items found for this order'
            });
        }

        console.log(`Updated ${result.affectedRows} order items with drum status: ${drum_status}`);

        res.json({
            success: true,
            message: 'Drum return status updated successfully',
            drum_status: drum_status,
            items_updated: result.affectedRows
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