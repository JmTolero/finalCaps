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
        CASE 
          WHEN (a.address_id IS NULL OR (
            (a.cityVillage IS NULL OR a.cityVillage = '') AND 
            (a.province IS NULL OR a.province = '')
          )) AND (a2.address_id IS NULL OR (
            (a2.cityVillage IS NULL OR a2.cityVillage = '') AND 
            (a2.province IS NULL OR a2.province = '')
          ))
          THEN 'Location not specified'
          WHEN a.address_id IS NOT NULL AND (
            (a.cityVillage IS NOT NULL AND a.cityVillage != '') OR 
            (a.province IS NOT NULL AND a.province != '')
          )
          THEN CONCAT_WS(', ',
            COALESCE(NULLIF(a.cityVillage, ''), NULL),
            COALESCE(NULLIF(a.province, ''), NULL)
          )
          ELSE CONCAT_WS(', ',
            COALESCE(NULLIF(a2.cityVillage, ''), NULL),
            COALESCE(NULLIF(a2.province, ''), NULL)
          )
        END as location,
        COALESCE(SUM(CASE WHEN o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered') THEN oi.quantity ELSE 0 END), 0) as calculated_sold_count,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'small' THEN vdp.price END), 0) as small_price,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'medium' THEN vdp.price END), 0) as medium_price,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'large' THEN vdp.price END), 0) as large_price
      FROM flavors f
      LEFT JOIN vendors v ON f.vendor_id = v.vendor_id
      LEFT JOIN addresses a ON v.primary_address_id = a.address_id
      LEFT JOIN user_addresses ua ON v.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN addresses a2 ON ua.address_id = a2.address_id
      LEFT JOIN vendor_drum_pricing vdp ON f.vendor_id = vdp.vendor_id
      LEFT JOIN products p ON f.flavor_id = p.flavor_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE f.store_status = 'published' AND v.status = 'approved'
      GROUP BY f.flavor_id, f.flavor_name, f.flavor_description, f.image_url, f.store_status, f.created_at, f.vendor_id, f.sold_count, v.store_name, v.profile_image_url, a.unit_number, a.street_name, a.barangay, a.cityVillage, a.province, a.region, a.postal_code, a2.unit_number, a2.street_name, a2.barangay, a2.cityVillage, a2.province, a2.region, a2.postal_code
      ORDER BY f.created_at DESC
    `);

    // Update sold_count in database if calculated count is different
    for (const flavor of flavors) {
      // Get additional sold count from orders without order items
      const [ordersWithoutItems] = await pool.query(`
        SELECT COUNT(*) as count FROM orders 
        WHERE vendor_id = ? 
        AND status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered')
        AND order_id NOT IN (SELECT DISTINCT order_id FROM order_items)
      `, [flavor.vendor_id]);
      
      const additionalSoldCount = ordersWithoutItems[0].count || 0;
      const totalSoldCount = parseInt(flavor.calculated_sold_count) + parseInt(additionalSoldCount);
      
      if (totalSoldCount !== flavor.sold_count) {
        await pool.query(`
          UPDATE flavors 
          SET sold_count = ? 
          WHERE flavor_id = ?
        `, [totalSoldCount, flavor.flavor_id]);
        flavor.sold_count = totalSoldCount;
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

const getFlavorById = async (req, res) => {
  try {
    const { flavorId } = req.params;
    
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
        v.status as vendor_status,
        u.fname,
        u.lname,
        u.email,
        u.contact_no,
        CASE 
          WHEN (a.address_id IS NULL OR (
            (a.cityVillage IS NULL OR a.cityVillage = '') AND 
            (a.province IS NULL OR a.province = '')
          )) AND (a2.address_id IS NULL OR (
            (a2.cityVillage IS NULL OR a2.cityVillage = '') AND 
            (a2.province IS NULL OR a2.province = '')
          ))
          THEN 'Location not specified'
          WHEN a.address_id IS NOT NULL AND (
            (a.cityVillage IS NOT NULL AND a.cityVillage != '') OR 
            (a.province IS NOT NULL AND a.province != '')
          )
          THEN CONCAT_WS(', ',
            COALESCE(NULLIF(a.cityVillage, ''), NULL),
            COALESCE(NULLIF(a.province, ''), NULL)
          )
          ELSE CONCAT_WS(', ',
            COALESCE(NULLIF(a2.cityVillage, ''), NULL),
            COALESCE(NULLIF(a2.province, ''), NULL)
          )
        END as location,
        COALESCE(SUM(CASE WHEN o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered') THEN oi.quantity ELSE 0 END), 0) as calculated_sold_count,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'small' THEN vdp.price END), 0) as small_price,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'medium' THEN vdp.price END), 0) as medium_price,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'large' THEN vdp.price END), 0) as large_price,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'small' THEN vdp.stock END), 0) as small_available,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'medium' THEN vdp.stock END), 0) as medium_available,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'large' THEN vdp.stock END), 0) as large_available,
        GROUP_CONCAT(DISTINCT vdp.drum_size ORDER BY 
          CASE vdp.drum_size 
            WHEN 'small' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'large' THEN 3 
          END
        ) as available_sizes
      FROM flavors f
      LEFT JOIN vendors v ON f.vendor_id = v.vendor_id
      LEFT JOIN users u ON v.user_id = u.user_id
      LEFT JOIN addresses a ON v.primary_address_id = a.address_id
      LEFT JOIN user_addresses ua ON v.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN addresses a2 ON ua.address_id = a2.address_id
      LEFT JOIN vendor_drum_pricing vdp ON f.vendor_id = vdp.vendor_id
      LEFT JOIN products p ON f.flavor_id = p.flavor_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE f.flavor_id = ? AND f.store_status = 'published' AND v.status = 'approved'
      GROUP BY f.flavor_id, f.flavor_name, f.flavor_description, f.image_url, f.store_status, f.created_at, f.vendor_id, f.sold_count, v.store_name, v.profile_image_url, v.status, u.fname, u.lname, u.email, u.contact_no, a.unit_number, a.street_name, a.barangay, a.cityVillage, a.province, a.region, a.postal_code, a2.unit_number, a2.street_name, a2.barangay, a2.cityVillage, a2.province, a2.region, a2.postal_code
    `, [flavorId]);

    if (flavors.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Flavor not found or not available' 
      });
    }

    const flavor = flavors[0];
    
    // Update sold_count if there's a discrepancy
    if (flavor.calculated_sold_count !== flavor.sold_count) {
      await pool.query(
        'UPDATE flavors SET sold_count = ? WHERE flavor_id = ?',
        [flavor.calculated_sold_count, flavorId]
      );
      flavor.sold_count = flavor.calculated_sold_count;
    }

    // Parse available sizes
    flavor.available_sizes = flavor.available_sizes ? flavor.available_sizes.split(',') : [];

    // Create drum availability object
    flavor.drum_availability = {
      small: flavor.small_available || 0,
      medium: flavor.medium_available || 0,
      large: flavor.large_available || 0
    };

    // Clean up individual availability fields
    delete flavor.small_available;
    delete flavor.medium_available;
    delete flavor.large_available;

    res.json({ success: true, flavor: flavor });
  } catch (error) {
    console.error('Error fetching flavor details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch flavor details' 
    });
  }
};

module.exports = {
  getAllPublishedFlavors,
  getFlavorById
};
