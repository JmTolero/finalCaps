const express = require('express');
const router = express.Router();
const autoReturnController = require('../../controller/admin/autoReturnController');

// Trigger manual auto-return process (for testing/admin use)
router.post('/trigger', autoReturnController.triggerAutoReturn);

// Get vendors currently in rejection period
router.get('/rejection-period', autoReturnController.getRejectionPeriodVendors);

// Get vendor rejection statistics
router.get('/stats', autoReturnController.getRejectionStats);

module.exports = router;
