const express = require('express');
const router = express.Router();
const availabilityController = require('../../controller/shared/availabilityController');

// GET /api/availability/:vendor_id/:date - Get availability for all sizes on a specific date
router.get('/:vendor_id/:date', availabilityController.getAvailabilityByDate);

// GET /api/availability/:vendor_id/:date/:size - Get availability for specific size and date
router.get('/:vendor_id/:date/:size', availabilityController.getAvailabilityByDateAndSize);

module.exports = router;
