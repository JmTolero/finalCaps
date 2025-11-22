const express = require('express');
const router = express.Router();
const vendorController = require('../../controller/vendor/vendorController');
const { authenticateToken } = require('../../middleware/auth');

// Vendor registration route
router.post('/register', vendorController.upload.fields([
    { name: 'valid_id', maxCount: 1 },
    { name: 'business_permit', maxCount: 1 },
    { name: 'proof_image', maxCount: 1 }
]), vendorController.registerVendor);

// Get current vendor info
router.get('/current', vendorController.getCurrentVendor);

// Get vendor info for setup (includes username but not password)
router.get('/setup/:vendor_id', vendorController.getVendorForSetup);

// Update vendor profile
router.put('/profile/:vendor_id', vendorController.upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'proof_image', maxCount: 1 }
]), vendorController.updateVendorProfile);

// Set vendor primary address (business location)
router.put('/:vendor_id/primary-address/:address_id', vendorController.setVendorPrimaryAddress);

// Check if vendor setup is complete
router.get('/setup-status/:user_id', vendorController.checkVendorSetupComplete);

// Get vendor dashboard data
router.get('/dashboard/:vendor_id', vendorController.getVendorDashboardData);

// Register existing user as vendor
router.post('/register-existing-user', vendorController.upload.fields([
    { name: 'valid_id', maxCount: 1 },
    { name: 'business_permit', maxCount: 1 },
    { name: 'proof_image', maxCount: 1 }
]), vendorController.registerExistingUserAsVendor);

// Get products for a specific vendor
router.get('/products/:vendorId', vendorController.getVendorProducts);

// Get all products from all approved vendors (for marketplace)
router.get('/all-products', vendorController.getAllProducts);

// Get vendors with their locations for map display
router.get('/with-locations', vendorController.getVendorsWithLocations);

// Get all approved vendors for customer store listing
router.get('/all-approved', vendorController.getAllApprovedVendors);

// Check vendor rejection status (for customers who want to become vendors)
router.get('/check-rejection-status', authenticateToken, vendorController.checkVendorRejectionStatus);

module.exports = router;
