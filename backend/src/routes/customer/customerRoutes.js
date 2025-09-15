const express = require('express');
const router = express.Router();
const customerController = require('../../controller/customer/customerController');

// Update customer profile
router.put('/profile/:user_id', customerController.updateCustomerProfile);

module.exports = router;
