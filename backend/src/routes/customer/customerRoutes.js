const express = require('express');
const router = express.Router();
const customerController = require('../../controller/customer/customerController');

// Update customer profile (with optional profile image upload)
router.put('/profile/:user_id', customerController.upload.single('profile_image'), customerController.updateCustomerProfile);

module.exports = router;
