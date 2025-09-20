const express = require('express');
const router = express.Router();
const locationController = require('../../controller/admin/locationController');

// Admin routes for managing vendor locations (simplified)
router.get('/vendor-locations', locationController.getAllVendorLocations);
router.get('/vendor-locations/search', locationController.searchVendorLocations);
router.get('/vendor-locations/count', locationController.getVendorCount);

// Individual vendor location routes for admin
router.get('/vendor/:vendorId/location', locationController.getVendorLocation);
router.put('/vendor/:vendorId/location/:addressId', locationController.updateVendorLocation);

module.exports = router;