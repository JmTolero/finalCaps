const pool = require('../../db/config');

// Get delivery pricing for a specific vendor
const getDeliveryPricing = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    // Get vendor's delivery pricing zones
    const [deliveryZones] = await pool.query(`
      SELECT 
        delivery_pricing_id,
        city,
        province,
        delivery_price,
        is_active,
        created_at,
        updated_at
      FROM vendor_delivery_pricing
      WHERE vendor_id = ? AND is_active = 1
      ORDER BY city ASC, province ASC
    `, [vendor_id]);

    res.json({
      success: true,
      delivery_zones: deliveryZones
    });

  } catch (error) {
    console.error('Error fetching delivery pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery pricing'
    });
  }
};

// Update delivery pricing for a specific vendor
const updateDeliveryPricing = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { delivery_zones } = req.body;

    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    if (!delivery_zones || !Array.isArray(delivery_zones)) {
      return res.status(400).json({
        success: false,
        error: 'Delivery zones array is required'
      });
    }

    // Validate each delivery zone
    for (const zone of delivery_zones) {
      if (!zone.city || !zone.province || zone.delivery_price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Each delivery zone must have city, province, and delivery_price'
        });
      }
      if (zone.delivery_price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Delivery price cannot be negative'
        });
      }
    }

    // Start transaction
    await pool.query('START TRANSACTION');

    try {
      // First, deactivate all existing delivery zones for this vendor
      await pool.query(
        'UPDATE vendor_delivery_pricing SET is_active = 0 WHERE vendor_id = ?',
        [vendor_id]
      );

      // Insert or update delivery zones
      for (const zone of delivery_zones) {
        await pool.query(`
          INSERT INTO vendor_delivery_pricing 
          (vendor_id, city, province, delivery_price, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          delivery_price = VALUES(delivery_price),
          is_active = 1,
          updated_at = NOW()
        `, [vendor_id, zone.city, zone.province, zone.delivery_price]);
      }

      // Commit transaction
      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Delivery pricing updated successfully',
        delivery_zones: delivery_zones
      });

    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating delivery pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery pricing'
    });
  }
};

// Add a new delivery zone for a vendor
const addDeliveryZone = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { city, province, delivery_price } = req.body;

    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    if (!city || !province || delivery_price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'City, province, and delivery_price are required'
      });
    }

    if (delivery_price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Delivery price cannot be negative'
      });
    }

    // Insert new delivery zone
    const [result] = await pool.query(`
      INSERT INTO vendor_delivery_pricing 
      (vendor_id, city, province, delivery_price, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, NOW(), NOW())
    `, [vendor_id, city, province, delivery_price]);

    res.json({
      success: true,
      message: 'Delivery zone added successfully',
      delivery_zone: {
        delivery_pricing_id: result.insertId,
        city,
        province,
        delivery_price
      }
    });

  } catch (error) {
    console.error('Error adding delivery zone:', error);
    
    // Handle duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Delivery zone for this city and province already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to add delivery zone'
    });
  }
};

// Remove a delivery zone for a vendor
const removeDeliveryZone = async (req, res) => {
  try {
    const { vendor_id, delivery_pricing_id } = req.params;

    if (!vendor_id || !delivery_pricing_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID and delivery pricing ID are required'
      });
    }

    // Deactivate the delivery zone
    const [result] = await pool.query(
      'UPDATE vendor_delivery_pricing SET is_active = 0 WHERE vendor_id = ? AND delivery_pricing_id = ?',
      [vendor_id, delivery_pricing_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Delivery zone not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery zone removed successfully'
    });

  } catch (error) {
    console.error('Error removing delivery zone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove delivery zone'
    });
  }
};

// Get delivery price for a specific vendor and customer location
const getDeliveryPriceForLocation = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { city, province } = req.query;

    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    if (!city || !province) {
      return res.status(400).json({
        success: false,
        error: 'City and province are required'
      });
    }

    // Find delivery price for the specified location
    const [deliveryPricing] = await pool.query(`
      SELECT 
        delivery_price,
        city,
        province
      FROM vendor_delivery_pricing
      WHERE vendor_id = ? 
        AND city = ? 
        AND province = ? 
        AND is_active = 1
    `, [vendor_id, city, province]);

    if (deliveryPricing.length === 0) {
      return res.json({
        success: true,
        delivery_available: true,
        delivery_price: 0,
        location: {
          city: city,
          province: province
        }
      });
    }

    res.json({
      success: true,
      delivery_available: true,
      delivery_price: parseFloat(deliveryPricing[0].delivery_price),
      location: {
        city: deliveryPricing[0].city,
        province: deliveryPricing[0].province
      }
    });

  } catch (error) {
    console.error('Error fetching delivery price for location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery price'
    });
  }
};

module.exports = {
  getDeliveryPricing,
  updateDeliveryPricing,
  addDeliveryZone,
  removeDeliveryZone,
  getDeliveryPriceForLocation
};
