const express = require('express');
const multer = require('multer');
const router = express.Router();
const orderController = require('../../controller/shared/orderController');
const { checkOrderLimit } = require('../../middleware/subscriptionMiddleware');

// Configure multer for payment confirmation image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for payment confirmations
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed for payment confirmations'));
    }
  }
});

// Create a new order
router.post('/', checkOrderLimit, orderController.createOrder);

// Get a single order by ID
router.get('/:order_id', orderController.getOrderById);

// Get all orders for admin dashboard
router.get('/admin/all', orderController.getAllOrdersAdmin);

// Get orders for a specific customer
router.get('/customer/:customer_id', orderController.getCustomerOrders);

// Get orders for a specific vendor
router.get('/vendor/:vendor_id', orderController.getVendorOrders);

// Get vendor transactions for transaction history
router.get('/vendor/:vendor_id/transactions', orderController.getVendorTransactions);

// Update order status
router.put('/:order_id/status', orderController.updateOrderStatus);

// Update payment status
router.put('/:order_id/payment-status', orderController.updatePaymentStatus);

// Update payment status (alternative endpoint)
router.put('/:order_id/payment', upload.single('payment_confirmation_image'), orderController.updatePaymentStatus);

// Update drum return status
router.post('/:order_id/drum-return', orderController.updateDrumReturnStatus);

module.exports = router;
