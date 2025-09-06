const express = require('express')
const router = express.Router();
const userController = require('../controller/userController')


router.post('/login', userController.userLogin);
router.get('/api/total',userController.countTotal);

// Vendor management routes
router.get('/vendors', userController.getAllVendors);
router.put('/vendors/:vendor_id/status', userController.updateVendorStatus);

// Vendor registration route
router.post('/register-vendor', userController.upload.fields([
    { name: 'valid_id', maxCount: 1 },
    { name: 'business_permit', maxCount: 1 },
    { name: 'ice_cream_photo', maxCount: 1 }
]), userController.registerVendor);



module.exports = router;