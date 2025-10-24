const express = require('express');
const router = express.Router();
const {
    createSubscriptionPayment,
    handlePaymentWebhook,
    getPaymentStatus
} = require('../../controller/vendor/subscriptionController');

        // Test endpoint
router.get('/test', (req, res) => {
    console.log('✅ Subscription test endpoint called');
    res.json({ success: true, message: 'Subscription routes working' });
});

// Create subscription payment (vendor only)
router.post('/create-payment', createSubscriptionPayment);

// Get payment status (vendor only)
router.get('/payment-status/:invoice_id', getPaymentStatus);

// Xendit webhook endpoint (no auth required - webhook verification handled internally)
router.post('/webhook', handlePaymentWebhook);

module.exports = router;
