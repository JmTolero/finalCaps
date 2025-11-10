const pool = require('../../db/config');

// Get drum pricing and availability for a specific vendor
const getDrumPricing = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    // Get vendor-specific drum pricing and capacity
    const [vendorDrums] = await pool.query(`
      SELECT 
        vdp.drum_size,
        vdp.price,
        vdp.stock,
        vdp.gallons
      FROM vendor_drum_pricing vdp
      WHERE vdp.vendor_id = ?
      ORDER BY 
        CASE vdp.drum_size 
          WHEN 'small' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'large' THEN 3 
        END
    `, [vendor_id]);

    // Format the data for frontend
    const drumData = {
      small: { gallons: 3, price: 0, stock: 0 },
      medium: { gallons: 5, price: 0, stock: 0 },
      large: { gallons: 8, price: 0, stock: 0 }
    };

    vendorDrums.forEach(drum => {
      drumData[drum.drum_size] = {
        gallons: drum.gallons,
        price: parseFloat(drum.price),
        stock: drum.stock
      };
    });

    res.json({
      success: true,
      drums: drumData
    });

  } catch (error) {
    console.error('Error fetching drum pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drum pricing'
    });
  }
};

// Update drum prices for a specific vendor
const updateDrumPrices = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { small, medium, large } = req.body;

    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    if (small === undefined || medium === undefined || large === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All drum prices are required'
      });
    }

    if (small < 0 || medium < 0 || large < 0) {
      return res.status(400).json({
        success: false,
        error: 'Drum prices cannot be negative'
      });
    }

    // Update vendor-specific drum prices (INSERT or UPDATE)
    await pool.query(
      `INSERT INTO vendor_drum_pricing (vendor_id, drum_size, price, stock, gallons) 
       VALUES (?, 'small', ?, 0, 3)
       ON DUPLICATE KEY UPDATE price = VALUES(price)`,
      [vendor_id, small]
    );
    
    await pool.query(
      `INSERT INTO vendor_drum_pricing (vendor_id, drum_size, price, stock, gallons) 
       VALUES (?, 'medium', ?, 0, 5)
       ON DUPLICATE KEY UPDATE price = VALUES(price)`,
      [vendor_id, medium]
    );
    
    await pool.query(
      `INSERT INTO vendor_drum_pricing (vendor_id, drum_size, price, stock, gallons) 
       VALUES (?, 'large', ?, 0, 8)
       ON DUPLICATE KEY UPDATE price = VALUES(price)`,
      [vendor_id, large]
    );

    res.json({
      success: true,
      message: 'Drum prices updated successfully',
      prices: { small, medium, large }
    });

  } catch (error) {
    console.error('Error updating drum prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update drum prices'
    });
  }
};

// Update drum stock for a specific vendor
const updateDrumStock = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { small, medium, large } = req.body;

    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    if (small === undefined || medium === undefined || large === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All drum stock quantities are required'
      });
    }

    if (small < 0 || medium < 0 || large < 0) {
      return res.status(400).json({
        success: false,
        error: 'Drum stock cannot be negative'
      });
    }

    // Get existing pricing/capacity so we preserve values when inserting new rows
    const [existingDrums] = await pool.query(
      'SELECT drum_size, price, gallons FROM vendor_drum_pricing WHERE vendor_id = ?',
      [vendor_id]
    );

    const drumDefaults = {
      small: { price: 0, gallons: 3 },
      medium: { price: 0, gallons: 5 },
      large: { price: 0, gallons: 8 }
    };

    existingDrums.forEach(drum => {
      const price = drum.price !== null ? parseFloat(drum.price) : drumDefaults[drum.drum_size].price;
      const gallons = drum.gallons || drumDefaults[drum.drum_size].gallons;

      drumDefaults[drum.drum_size] = {
        price: Number.isNaN(price) ? drumDefaults[drum.drum_size].price : price,
        gallons
      };
    });

    // Upsert vendor-specific drum stock (create row if it doesn't exist yet) 
    await pool.query(
      `INSERT INTO vendor_drum_pricing (vendor_id, drum_size, price, stock, gallons)
       VALUES (?, 'small', ?, ?, ?)
       ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
      [vendor_id, drumDefaults.small.price, small, drumDefaults.small.gallons]
    );
    
    await pool.query(
      `INSERT INTO vendor_drum_pricing (vendor_id, drum_size, price, stock, gallons)
       VALUES (?, 'medium', ?, ?, ?)
       ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
      [vendor_id, drumDefaults.medium.price, medium, drumDefaults.medium.gallons]
    );
    
    await pool.query(
      `INSERT INTO vendor_drum_pricing (vendor_id, drum_size, price, stock, gallons)
       VALUES (?, 'large', ?, ?, ?)
       ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
      [vendor_id, drumDefaults.large.price, large, drumDefaults.large.gallons]
    );

    res.json({
      success: true,
      message: 'Drum stock updated successfully',
      stock: { small, medium, large }
    });

  } catch (error) {
    console.error('Error updating drum stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update drum stock'
    });
  }
};

// Update drum capacity for a specific vendor
const updateDrumCapacity = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { small, medium, large } = req.body;

    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    if (small === undefined || medium === undefined || large === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All drum capacity values are required'
      });
    }

    if (small <= 0 || medium <= 0 || large <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Drum capacity must be greater than 0'
      });
    }

    // Update vendor-specific drum capacity
    await pool.query(
      'UPDATE vendor_drum_pricing SET gallons = ? WHERE vendor_id = ? AND drum_size = ?',
      [small, vendor_id, 'small']
    );
    
    await pool.query(
      'UPDATE vendor_drum_pricing SET gallons = ? WHERE vendor_id = ? AND drum_size = ?',
      [medium, vendor_id, 'medium']
    );
    
    await pool.query(
      'UPDATE vendor_drum_pricing SET gallons = ? WHERE vendor_id = ? AND drum_size = ?',
      [large, vendor_id, 'large']
    );

    res.json({
      success: true,
      message: 'Drum capacity updated successfully',
      capacity: { small, medium, large }
    });

  } catch (error) {
    console.error('Error updating drum capacity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update drum capacity'
    });
  }
};

module.exports = {
  getDrumPricing,
  updateDrumPrices,
  updateDrumStock,
  updateDrumCapacity
};
