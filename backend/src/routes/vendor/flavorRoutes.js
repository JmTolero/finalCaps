const express = require('express');
const router = express.Router();
const flavorController = require('../../controller/vendor/flavorController');

// Get all flavors for a vendor
router.get('/:vendor_id', flavorController.getVendorFlavors);

// Create a new flavor
router.post('/:vendor_id', 
  (req, res, next) => {
    console.log('🔍 Multer middleware debug:');
    console.log('  - Content-Type:', req.headers['content-type']);
    console.log('  - Body keys:', Object.keys(req.body));
    next();
  },
  flavorController.upload.array('images', 10), // Allow up to 10 images
  (err, req, res, next) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({
        success: false,
        error: 'File upload error: ' + err.message
      });
    }
    next();
  },
  flavorController.createFlavor
);

// Update a flavor
router.put('/:flavor_id',
  (req, res, next) => {
    console.log('🔍 Multer update middleware debug:');
    console.log('  - Content-Type:', req.headers['content-type']);
    console.log('  - Body keys:', Object.keys(req.body));
    next();
  },
  flavorController.upload.array('images', 10), // Allow up to 10 images
  (err, req, res, next) => {
    if (err) {
      console.error('❌ Multer update error:', err.message);
      return res.status(400).json({
        success: false,
        error: 'File upload error: ' + err.message
      });
    }
    next();
  },
  flavorController.updateFlavor
);

// Update flavor store status
router.patch('/:flavor_id/store-status', flavorController.updateFlavorStoreStatus);

// Delete a flavor
router.delete('/:flavor_id', flavorController.deleteFlavor);

module.exports = router;
