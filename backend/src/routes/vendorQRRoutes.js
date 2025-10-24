const express = require('express');
const router = express.Router();
const vendorQRController = require('../controller/vendor/vendorQRController');
const { authenticateToken } = require('../middleware/auth');

// Get QR code for current vendor (authenticated)
router.get('/qr-code', authenticateToken, vendorQRController.getMyQRCode);

// Upload QR code for current vendor (authenticated)
router.post('/qr-code', authenticateToken, vendorQRController.upload.single('qr_code_image'), vendorQRController.uploadQRCode);

// Get QR code for specific vendor (public, for customers)
router.get('/:vendor_id/qr-code', vendorQRController.getQRCode);

// Upload QR code for specific vendor (admin only - future use)
router.post('/:vendor_id/qr-code', authenticateToken, vendorQRController.upload.single('qr_code_image'), vendorQRController.uploadQRCode);

// Delete QR code for current vendor (authenticated)
router.delete('/qr-code', authenticateToken, vendorQRController.deleteQRCode);

// Delete QR code for specific vendor (admin only - future use)
router.delete('/:vendor_id/qr-code', authenticateToken, vendorQRController.deleteQRCode);

module.exports = router;
