const express = require('express');
const router = express.Router();
const vendorQRController = require('../controller/vendor/vendorQRController');
const { authenticateToken } = require('../middleware/auth');

// Get QR code for current vendor (authenticated)
router.get('/qr-code', authenticateToken, vendorQRController.getMyQRCode);

// Upload QR code/GCash number for current vendor (authenticated)
// Handles both JSON (for GCash number only) and multipart/form-data (if QR code image is included)
router.post('/qr-code', authenticateToken, (req, res, next) => {
  // Check if request is JSON
  if (req.headers['content-type']?.includes('application/json')) {
    // JSON request - skip multer, set req.file to undefined and continue
    req.file = undefined;
    return next();
  } else {
    // Multipart request - use multer middleware
    return vendorQRController.upload.single('qr_code_image')(req, res, next);
  }
}, vendorQRController.uploadQRCode);

// Get QR code for specific vendor (public, for customers)
router.get('/:vendor_id/qr-code', vendorQRController.getQRCode);

// Upload QR code/GCash number for specific vendor (admin only - future use)
router.post('/:vendor_id/qr-code', authenticateToken, (req, res, next) => {
  // Check if request is JSON
  if (req.headers['content-type']?.includes('application/json')) {
    // JSON request - skip multer, set req.file to undefined and continue
    req.file = undefined;
    return next();
  } else {
    // Multipart request - use multer middleware
    return vendorQRController.upload.single('qr_code_image')(req, res, next);
  }
}, vendorQRController.uploadQRCode);

// Delete QR code for current vendor (authenticated)
router.delete('/qr-code', authenticateToken, vendorQRController.deleteQRCode);

// Delete QR code for specific vendor (admin only - future use)
router.delete('/:vendor_id/qr-code', authenticateToken, vendorQRController.deleteQRCode);

module.exports = router;
