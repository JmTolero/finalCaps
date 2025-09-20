const express = require('express');
const router = express.Router();
const { getAllPublishedFlavors, getFlavorById } = require('../../controller/shared/flavorController');

// Get all published flavors for customer marketplace
router.get('/all-published', getAllPublishedFlavors);

// Get individual flavor details
router.get('/:flavorId', getFlavorById);

module.exports = router;
