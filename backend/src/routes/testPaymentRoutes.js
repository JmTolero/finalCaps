const express = require('express');
const router = express.Router();
const { markPaymentCompleted, checkOrderStatus } = require('../controller/testPaymentController');

// Test endpoints - FOR DEVELOPMENT ONLY
if (process.env.NODE_ENV === 'development') {
  // Mark payment as completed (simulates webhook)
  router.post('/complete-payment/:order_id', markPaymentCompleted);
  
  // GET version for easy browser testing
  router.get('/complete-payment/:order_id', markPaymentCompleted);
  
  // Check order status
  router.get('/order-status/:order_id', checkOrderStatus);
}

module.exports = router;
