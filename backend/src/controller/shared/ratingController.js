const pool = require('../../db/config');

// Rate a flavor
const rateFlavor = async (req, res) => {
  try {
    const { flavorId } = req.params;
    const { rating, review_text } = req.body;
    const customer_id = req.user.user_id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if flavor exists (excluding deleted flavors)
    const [flavors] = await pool.query(
      'SELECT flavor_id FROM flavors WHERE flavor_id = ? AND store_status = "published" AND deleted_at IS NULL',
      [flavorId]
    );

    if (flavors.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Flavor not found'
      });
    }

    // Always create a new rating (allow multiple ratings per user per flavor)
    const [result] = await pool.query(
      'INSERT INTO flavor_ratings (flavor_id, customer_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [flavorId, customer_id, rating, review_text]
    );
    
    const ratingId = result.insertId;

    // Update flavor's average rating and total ratings
    await updateFlavorRatings(flavorId);

    res.json({
      success: true,
      message: 'Rating added successfully',
      rating_id: ratingId
    });

  } catch (error) {
    console.error('Error rating flavor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate flavor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get ratings for a flavor
const getFlavorRatings = async (req, res) => {
  try {
    const { flavorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get ratings with customer info
    const [ratings] = await pool.query(`
      SELECT 
        fr.rating_id,
        fr.rating,
        fr.review_text,
        fr.created_at,
        fr.updated_at,
        u.fname,
        u.lname
      FROM flavor_ratings fr
      JOIN users u ON fr.customer_id = u.user_id
      WHERE fr.flavor_id = ?
      ORDER BY fr.created_at DESC
      LIMIT ? OFFSET ?
    `, [flavorId, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM flavor_ratings WHERE flavor_id = ?',
      [flavorId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      ratings,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_ratings: total,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching flavor ratings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ratings',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get customer's rating for a flavor
const getCustomerRating = async (req, res) => {
  try {
    const { flavorId } = req.params;
    const customer_id = req.user.user_id;

    const [ratings] = await pool.query(
      'SELECT rating, review_text, created_at, updated_at FROM flavor_ratings WHERE customer_id = ? AND flavor_id = ?',
      [customer_id, flavorId]
    );

    res.json({
      success: true,
      rating: ratings.length > 0 ? ratings[0] : null
    });

  } catch (error) {
    console.error('Error fetching customer rating:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer rating',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete a rating
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const customer_id = req.user.user_id;

    // Check if rating exists and belongs to customer
    const [ratings] = await pool.query(
      'SELECT flavor_id FROM flavor_ratings WHERE rating_id = ? AND customer_id = ?',
      [ratingId, customer_id]
    );

    if (ratings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }

    const flavorId = ratings[0].flavor_id;

    // Delete the rating
    await pool.query(
      'DELETE FROM flavor_ratings WHERE rating_id = ? AND customer_id = ?',
      [ratingId, customer_id]
    );

    // Update flavor's average rating and total ratings
    await updateFlavorRatings(flavorId);

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete rating',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to update flavor's average rating and total ratings
const updateFlavorRatings = async (flavorId) => {
  try {
    // Calculate average rating and total count
    const [stats] = await pool.query(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_ratings
      FROM flavor_ratings 
      WHERE flavor_id = ?
    `, [flavorId]);

    const averageRating = stats[0].average_rating ? parseFloat(stats[0].average_rating).toFixed(2) : 0.00;
    const totalRatings = stats[0].total_ratings || 0;

    // Update flavor table
    await pool.query(
      'UPDATE flavors SET average_rating = ?, total_ratings = ? WHERE flavor_id = ?',
      [averageRating, totalRatings, flavorId]
    );

  } catch (error) {
    console.error('Error updating flavor ratings:', error);
  }
};

module.exports = {
  rateFlavor,
  getFlavorRatings,
  getCustomerRating,
  deleteRating
};
