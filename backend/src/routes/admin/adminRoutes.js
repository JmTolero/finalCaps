const express = require('express');
const router = express.Router();
const adminController = require('../../controller/admin/adminController');
const orderController = require('../../controller/shared/orderController');

// User management routes
router.get('/total', adminController.countTotal);
router.get('/users', adminController.getAllUsers);
router.get('/users/:user_id', adminController.getUserById);
router.put('/users/:user_id', adminController.updateUser);
router.put('/users/:user_id/status', adminController.updateUserStatus);

// Vendor management routes
router.get('/vendors', adminController.getAllVendors);
router.get('/vendors/:vendor_id', adminController.getVendorById);
router.get('/vendors/:vendor_id/ongoing-orders', adminController.checkVendorOngoingOrders);
router.put('/vendors/:vendor_id/status', adminController.updateVendorStatus);

// Order management routes (admin-specific)
router.get('/orderRecords', orderController.getOrderRecord);

module.exports = router;
