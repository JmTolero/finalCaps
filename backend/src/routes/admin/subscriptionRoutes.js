const express = require('express');
const router = express.Router();
const subscriptionController = require('../../controller/admin/subscriptionController');

// Get all subscription plans
router.get('/plans', subscriptionController.getSubscriptionPlans);

// Get all vendors with subscription info
router.get('/vendors', subscriptionController.getAllVendorSubscriptions);

// Get subscription revenue summary
router.get('/revenue', subscriptionController.getSubscriptionRevenue);

// Get specific vendor subscription details
router.get('/vendor/:vendor_id', subscriptionController.getVendorSubscription);

// Update vendor subscription plan
router.put('/vendor/:vendor_id', subscriptionController.updateVendorSubscription);

module.exports = router;
