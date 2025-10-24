const express = require('express');
const router = express.Router();
const { 
  createPaymentIntent, 
  getPaymentIntentStatus, 
  handleWebhook, 
  getPaymentHistory,
  testXenditIntegration 
} = require('../controller/paymentController');

// Create payment intent for GCash payment
router.post('/create-payment-intent', createPaymentIntent);

// Get payment intent status
router.get('/intent/:payment_intent_id', getPaymentIntentStatus);

// Get invoice status (for Xendit)
router.get('/status/:payment_intent_id', getPaymentIntentStatus);

// PayMongo webhook endpoint
router.post('/webhook', handleWebhook);

// Get payment history for customer
router.get('/history/:customer_id', getPaymentHistory);

// Test Xendit integration
router.get('/test', testXenditIntegration);

module.exports = router;
