const express = require('express');
const router = express.Router();
const statisticsController = require('../../controller/admin/statisticsController');

// Subscription statistics routes
router.get('/subscription', statisticsController.getSubscriptionStatistics);
router.get('/subscription/live', statisticsController.getLiveSubscriptionStats);

module.exports = router;

