const express = require('express');
const router = express.Router();
const { getAllPublishedFlavors } = require('../../controller/shared/flavorController');

// Get all published flavors for customer marketplace
router.get('/all-published', getAllPublishedFlavors);

module.exports = router;
