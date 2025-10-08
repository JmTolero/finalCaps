const reviewModel = require('../../model/shared/reviewModel');
const { createNotification } = require('./notificationController');

const reviewController = {
  // Create a new review
  async createReview(req, res) {
    try {
      console.log('📝 Review submission received');
      console.log('📝 req.user:', req.user);
      console.log('📝 req.body:', req.body);
      
      const { order_id, vendor_id, rating, comment } = req.body;
      const customer_id = req.user.user_id || req.user.id;
      
      console.log('📝 Extracted customer_id:', customer_id);

      // Validate required fields
      if (!order_id || !vendor_id || !rating) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: order_id, vendor_id, rating'
        });
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }

      // Check if customer can review this order
      const orderInfo = await reviewModel.canReview(order_id, customer_id);
      if (!orderInfo) {
        return res.status(403).json({
          success: false,
          error: 'You can only review delivered orders'
        });
      }

      // Check if already reviewed
      const hasReviewed = await reviewModel.hasReviewed(order_id);
      if (hasReviewed) {
        return res.status(409).json({
          success: false,
          error: 'You have already reviewed this order'
        });
      }

      // Create review
      const reviewId = await reviewModel.createReview({
        order_id,
        vendor_id,
        customer_id,
        rating,
        comment: comment || null
      });

      console.log(`⭐ Review created: ID ${reviewId} for order ${order_id} by customer ${customer_id}`);

      // Create notification for vendor about the new review
      try {
        // Get customer name for the notification
        const pool = require('../../db/config');
        const [customerData] = await pool.query(
          'SELECT fname, lname FROM users WHERE user_id = ?',
          [customer_id]
        );
        
        const customerName = customerData.length > 0 
          ? `${customerData[0].fname} ${customerData[0].lname}` 
          : 'A customer';

      // Create notification for vendor using vendor_id
      await createNotification({
        user_id: vendor_id,
        user_type: 'vendor',
        title: 'New Customer Review Received! ⭐',
        message: `${customerName} left a ${rating}-star review for order #${order_id}. ${comment ? 'They also left a comment.' : ''}`,
        notification_type: 'review_received',
        related_order_id: parseInt(order_id),
        related_vendor_id: vendor_id,
        related_customer_id: customer_id
      });

      console.log(`📬 Review notification created for vendor ${vendor_id} (user_id: ${vendor_id})`);
      } catch (notificationError) {
        console.error('Failed to create review notification:', notificationError);
        // Don't fail the review creation if notification creation fails
      }

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        review_id: reviewId
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit review'
      });
    }
  },

  // Get all reviews for a vendor
  async getVendorReviews(req, res) {
    try {
      const { vendorId } = req.params;

      const reviews = await reviewModel.getVendorReviews(vendorId);
      const summary = await reviewModel.getVendorReviewSummary(vendorId);

      res.json({
        success: true,
        reviews,
        summary: {
          total_reviews: summary.total_reviews || 0,
          average_rating: parseFloat(summary.average_rating || 0).toFixed(2),
          five_star: summary.five_star || 0,
          four_star: summary.four_star || 0,
          three_star: summary.three_star || 0,
          two_star: summary.two_star || 0,
          one_star: summary.one_star || 0
        }
      });
    } catch (error) {
      console.error('Error fetching vendor reviews:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reviews'
      });
    }
  },

  // Get customer's own reviews
  async getMyReviews(req, res) {
    try {
      const customer_id = req.user.user_id || req.user.id;

      const reviews = await reviewModel.getCustomerReviews(customer_id);

      res.json({
        success: true,
        reviews
      });
    } catch (error) {
      console.error('Error fetching customer reviews:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch your reviews'
      });
    }
  },

  // Check if customer can review an order
  async checkReviewEligibility(req, res) {
    try {
      const { orderId } = req.params;
      const customer_id = req.user.user_id || req.user.id;

      const canReview = await reviewModel.canReview(orderId, customer_id);
      const hasReviewed = await reviewModel.hasReviewed(orderId);

      res.json({
        success: true,
        can_review: canReview && !hasReviewed,
        has_reviewed: hasReviewed
      });
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check review eligibility'
      });
    }
  }
};

module.exports = reviewController;
