const express = require('express');
const router = express.Router();
const vendorStatsController = require('../../controller/vendor/vendorStatsController');

// Get vendor statistics for dashboard
router.get('/:vendor_id', vendorStatsController.getVendorStatistics);

module.exports = router;

