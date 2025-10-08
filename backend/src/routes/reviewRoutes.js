const express = require('express');
const router = express.Router();
const reviewController = require('../controller/shared/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Create a new review (authenticated customers only)
router.post('/reviews', authenticateToken, reviewController.createReview);

// Get all reviews for a vendor (public)
router.get('/reviews/vendor/:vendorId', reviewController.getVendorReviews);

// Get customer's own reviews (authenticated)
router.get('/reviews/my-reviews', authenticateToken, reviewController.getMyReviews);

// Check if customer can review an order (authenticated)
router.get('/reviews/can-review/:orderId', authenticateToken, reviewController.checkReviewEligibility);

module.exports = router;
