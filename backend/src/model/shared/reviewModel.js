const pool = require('../../db/config');

const reviewModel = {
  // Create a new review
  async createReview(reviewData) {
    const { order_id, vendor_id, customer_id, rating, comment } = reviewData;
    
    const query = `
      INSERT INTO vendor_reviews (order_id, vendor_id, customer_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [order_id, vendor_id, customer_id, rating, comment]);
    
    // Update vendor's average rating
    await this.updateVendorRating(vendor_id);
    
    return result.insertId;
  },

  // Get all reviews for a vendor
  async getVendorReviews(vendorId) {
    const query = `
      SELECT 
        vr.*,
        u.fname as customer_fname,
        u.lname as customer_lname,
        o.order_id
      FROM vendor_reviews vr
      JOIN users u ON vr.customer_id = u.user_id
      JOIN orders o ON vr.order_id = o.order_id
      WHERE vr.vendor_id = ?
      ORDER BY vr.created_at DESC
    `;
    
    const [reviews] = await pool.query(query, [vendorId]);
    return reviews;
  },

  // Get reviews by customer
  async getCustomerReviews(customerId) {
    const query = `
      SELECT 
        vr.*,
        v.store_name as vendor_name,
        o.order_id
      FROM vendor_reviews vr
      JOIN vendors v ON vr.vendor_id = v.vendor_id
      JOIN orders o ON vr.order_id = o.order_id
      WHERE vr.customer_id = ?
      ORDER BY vr.created_at DESC
    `;
    
    const [reviews] = await pool.query(query, [customerId]);
    return reviews;
  },

  // Check if customer has already reviewed an order
  async hasReviewed(orderId) {
    const query = `SELECT review_id FROM vendor_reviews WHERE order_id = ?`;
    const [result] = await pool.query(query, [orderId]);
    return result.length > 0;
  },

  // Get review summary for a vendor
  async getVendorReviewSummary(vendorId) {
    const query = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM vendor_reviews
      WHERE vendor_id = ?
    `;
    
    const [result] = await pool.query(query, [vendorId]);
    return result[0];
  },

  // Update vendor's average rating
  async updateVendorRating(vendorId) {
    const summary = await this.getVendorReviewSummary(vendorId);
    
    const updateQuery = `
      UPDATE vendors 
      SET average_rating = ?, total_reviews = ?
      WHERE vendor_id = ?
    `;
    
    await pool.query(updateQuery, [
      summary.average_rating || 0,
      summary.total_reviews || 0,
      vendorId
    ]);
  },

  // Check if customer can review (order must be delivered)
  async canReview(orderId, customerId) {
    const query = `
      SELECT o.order_id, o.status, o.vendor_id
      FROM orders o
      WHERE o.order_id = ? AND o.customer_id = ? AND o.status = 'delivered'
    `;
    
    const [result] = await pool.query(query, [orderId, customerId]);
    return result.length > 0 ? result[0] : null;
  }
};

module.exports = reviewModel;
