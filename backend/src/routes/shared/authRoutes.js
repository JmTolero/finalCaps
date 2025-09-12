const express = require('express');
const router = express.Router();
const authController = require('../../controller/shared/authController');
const securityController = require('../../controller/auth/authController');

router.post('/login', authController.userLogin);

// Security verification endpoints
router.get('/verify-admin', securityController.verifyAdmin);
router.get('/verify-vendor', securityController.verifyVendor);
router.get('/verify-customer', securityController.verifyCustomer);
router.post('/logout', securityController.logout);

module.exports = router;
