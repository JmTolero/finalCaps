const express = require('express');
const router = express.Router();
const { getDrumPricing, updateDrumPrices, updateDrumStock, updateDrumCapacity } = require('../../controller/vendor/drumController');
const { checkDrumLimit } = require('../../middleware/subscriptionMiddleware');

// Get drum pricing and availability for a vendor
router.get('/:vendor_id/pricing', getDrumPricing);

// Update drum prices for a vendor
router.put('/:vendor_id/pricing', updateDrumPrices);

// Update drum stock for a vendor
router.put('/:vendor_id/stock', checkDrumLimit, updateDrumStock);

// Update drum capacity for a vendor
router.put('/:vendor_id/capacity', checkDrumLimit, updateDrumCapacity);

module.exports = router;
