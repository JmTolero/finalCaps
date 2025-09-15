const pool = require('../../db/config');

// Get all published flavors from all vendors for customer marketplace
const getAllPublishedFlavors = async (req, res) => {
  try {
    const [flavors] = await pool.query(`
      SELECT 
        f.flavor_id,
        f.flavor_name,
        f.flavor_description,
        f.image_url,
        f.store_status,
        f.created_at,
        f.vendor_id,
        f.sold_count,
        v.store_name,
        v.profile_image_url,
        'Cordova, Cebu' as location,
        COALESCE(SUM(oi.quantity), 0) as calculated_sold_count,
        MIN(CASE WHEN vdp.drum_size = 'small' THEN vdp.price END) as small_price,
        MIN(CASE WHEN vdp.drum_size = 'medium' THEN vdp.price END) as medium_price,
        MIN(CASE WHEN vdp.drum_size = 'large' THEN vdp.price END) as large_price
      FROM flavors f
      LEFT JOIN vendors v ON f.vendor_id = v.vendor_id
      LEFT JOIN vendor_drum_pricing vdp ON f.vendor_id = vdp.vendor_id
      LEFT JOIN products p ON f.flavor_id = p.flavor_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE f.store_status = 'published' AND v.status = 'approved'
      AND (o.status IS NULL OR o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered'))
      GROUP BY f.flavor_id, f.flavor_name, f.flavor_description, f.image_url, f.store_status, f.created_at, f.vendor_id, f.sold_count, v.store_name, v.profile_image_url
      ORDER BY f.created_at DESC
    `);

    // Update sold_count in database if calculated count is different
    for (const flavor of flavors) {
      if (flavor.calculated_sold_count !== flavor.sold_count) {
        await pool.query(`
          UPDATE flavors 
          SET sold_count = ? 
          WHERE flavor_id = ?
        `, [flavor.calculated_sold_count, flavor.flavor_id]);
        flavor.sold_count = flavor.calculated_sold_count;
      }
      // Remove the calculated_sold_count from response
      delete flavor.calculated_sold_count;
    }

    res.json({
      success: true,
      flavors: flavors
    });
  } catch (error) {
    console.error('Error fetching all published flavors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flavors',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllPublishedFlavors
};
