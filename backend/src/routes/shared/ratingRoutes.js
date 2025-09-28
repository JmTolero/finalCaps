const express = require('express');
const router = express.Router();
const { rateFlavor, getFlavorRatings, getCustomerRating, deleteRating } = require('../../controller/shared/ratingController');
const { authenticateToken } = require('../../middleware/auth');

// Rate a flavor (requires authentication)
router.post('/flavors/:flavorId/rate', authenticateToken, rateFlavor);

// Get ratings for a flavor (public)
router.get('/flavors/:flavorId/ratings', getFlavorRatings);

// Get customer's rating for a flavor (requires authentication)
router.get('/flavors/:flavorId/my-rating', authenticateToken, getCustomerRating);

// Delete a rating (requires authentication)
router.delete('/ratings/:ratingId', authenticateToken, deleteRating);

module.exports = router;
