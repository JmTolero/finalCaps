const express = require('express');
const router = express.Router();
const orderController = require('../../controller/shared/orderController');

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders for admin dashboard
router.get('/admin/all', orderController.getAllOrdersAdmin);

// Get orders for a specific customer
router.get('/customer/:customer_id', orderController.getCustomerOrders);

// Get orders for a specific vendor
router.get('/vendor/:vendor_id', orderController.getVendorOrders);

// Update order status
router.put('/:order_id/status', orderController.updateOrderStatus);

// Update payment status
router.put('/:order_id/payment-status', orderController.updatePaymentStatus);

// Update drum return status
router.post('/:order_id/drum-return', orderController.updateDrumReturnStatus);

module.exports = router;
