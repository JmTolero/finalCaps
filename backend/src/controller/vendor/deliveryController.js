const pool = require('../../db/config');
const addressMatcher = require('../../utils/addressMatcher');

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

    // Insert new delivery zone or update existing one
    const [result] = await pool.query(`
      INSERT INTO vendor_delivery_pricing 
      (vendor_id, city, province, delivery_price, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
      delivery_price = VALUES(delivery_price),
      is_active = VALUES(is_active),
      updated_at = NOW()
    `, [vendor_id, city, province, delivery_price]);

    res.json({
      success: true,
      message: result.affectedRows === 1 ? 'Delivery zone added successfully' : 'Delivery zone updated successfully',
      delivery_zone: {
        delivery_pricing_id: result.insertId || 'existing',
        city,
        province,
        delivery_price
      }
    });

  } catch (error) {
    console.error('Error adding delivery zone:', error);
    
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

    // Use fuzzy matching to find delivery price
    const result = await addressMatcher.getDeliveryPriceWithFuzzyMatching(vendor_id, city, province);

    if (result.success) {
      res.json({
        success: true,
        delivery_available: true,
        delivery_price: result.delivery_price,
        match_type: result.match_type,
        location: result.matched_location,
        original_input: result.original_input,
        suggestions: result.suggestions || null
      });
    } else {
      res.json({
        success: false,
        delivery_available: false,
        delivery_price: 0,
        match_type: result.match_type,
        original_input: result.original_input,
        suggestions: result.suggestions,
        message: result.message || 'Delivery not available to this location'
      });
    }

  } catch (error) {
    console.error('Error fetching delivery price for location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery price'
    });
  }
};

// Validate and suggest corrections for address
const validateAddress = async (req, res) => {
  try {
    const { city, province } = req.query;

    if (!city || !province) {
      return res.status(400).json({
        success: false,
        error: 'City and province are required'
      });
    }

    const validation = addressMatcher.validateAndSuggestAddress(city, province);

    res.json({
      success: true,
      validation: validation
    });

  } catch (error) {
    console.error('Error validating address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate address'
    });
  }
};

module.exports = {
  getDeliveryPricing,
  updateDeliveryPricing,
  addDeliveryZone,
  removeDeliveryZone,
  getDeliveryPriceForLocation,
  validateAddress
};
