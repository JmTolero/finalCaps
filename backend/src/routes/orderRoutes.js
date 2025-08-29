const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');

router.get('/api/admin/orderRecords', orderController.getOrderRecord);

module.exports = router;
