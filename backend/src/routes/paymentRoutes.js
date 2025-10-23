const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  getPaymentIntentStatus,
  handleWebhook,
  getPaymentHistory,
  testPayMongoIntegration
} = require('../controller/paymentController');

// Create payment intent for GCash payment
router.post('/create-intent', createPaymentIntent);

// Get payment intent status
router.get('/intent/:payment_intent_id', getPaymentIntentStatus);

// PayMongo webhook endpoint
router.post('/webhook', handleWebhook);

// Get payment history for customer
router.get('/history/:customer_id', getPaymentHistory);

// Test PayMongo integration
router.get('/test', testPayMongoIntegration);

module.exports = router;
