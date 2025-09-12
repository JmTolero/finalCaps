const express = require('express');
const router = express.Router();
const locationController = require('../../controller/admin/locationController');

// Admin routes for managing all vendor locations
router.get('/vendor-locations', locationController.getAllVendorLocations);
router.get('/vendor-locations/stats', locationController.getVendorLocationStats);
router.get('/vendor-locations/search', locationController.searchVendorLocations);

// Vendor-specific location routes for admin
router.get('/vendor/:vendorId/locations', locationController.getVendorLocations);
router.put('/vendor/:vendorId/location/:addressId', locationController.updateVendorLocation);
router.put('/vendor/:vendorId/locations/bulk', locationController.bulkUpdateVendorLocations);

module.exports = router;
