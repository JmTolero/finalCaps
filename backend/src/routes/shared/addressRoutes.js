const express = require('express');
const router = express.Router();
const pool = require('../../db/config');

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Address routes are working!' });
});

// Test endpoint with addresses path
router.get('/addresses/test', (req, res) => {
  res.json({ message: 'Address routes with /addresses path are working!' });
});

// Get all addresses for a user
router.get('/user/:userId/addresses', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching addresses for user:', userId);
    
    const [addresses] = await pool.query(
      `SELECT a.*, ua.address_label, ua.is_default, ua.created_at as link_created
       FROM addresses a
       INNER JOIN user_addresses ua ON a.address_id = ua.address_id
       WHERE ua.user_id = ? AND a.is_active = 1
       ORDER BY ua.is_default DESC, ua.created_at DESC`,
      [userId]
    );
    
    console.log('Found addresses:', addresses.length);
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Create new address for user
router.post('/user/:userId/address', async (req, res) => {
  try {
    const { userId } = req.params;
    const { address_label = 'Home', is_default = false, ...addressData } = req.body;
    
    console.log('Creating address for user:', userId, 'with data:', addressData);
    
    // Validate required fields
    if (!addressData.street_name || !addressData.barangay || !addressData.cityVillage || !addressData.province || !addressData.region) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }
    
    // Auto-geocode the address to get coordinates
    const geocoder = require('../../utils/geocoder');
    const coordinates = await geocoder.getCoordinatesForAddress(addressData);
    
    // Create the address with coordinates
    const [addressResult] = await pool.query(
      `INSERT INTO addresses 
       (unit_number, street_name, barangay, cityVillage, province, region, postal_code, landmark, address_type, latitude, longitude, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        addressData.unit_number || '', 
        addressData.street_name, 
        addressData.barangay, 
        addressData.cityVillage, 
        addressData.province, 
        addressData.region, 
        addressData.postal_code || '', 
        addressData.landmark || '', 
        addressData.address_type || 'residential',
        coordinates ? coordinates.lat : null,
        coordinates ? coordinates.lon : null
      ]
    );
    
    const addressId = addressResult.insertId;
    
    if (coordinates) {
      console.log(`✅ Address ${addressId} created with coordinates: ${coordinates.lat}, ${coordinates.lon}`);
    } else {
      console.log(`⚠️ Address ${addressId} created without coordinates (geocoding failed)`);
    }
    
    // Check if this is the user's first address
    const [existingAddresses] = await pool.query(
      'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?',
      [userId]
    );
    const isFirstAddress = existingAddresses[0].count === 0;
    
    // Set as default if explicitly requested OR if it's the first address
    const shouldSetAsDefault = is_default || isFirstAddress;
    
    // If this is set as default, unset other defaults first
    if (shouldSetAsDefault) {
      await pool.query(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }
    
    // Link address to user in user_addresses table
    await pool.query(
      'INSERT INTO user_addresses (user_id, address_id, address_label, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [userId, addressId, address_label, shouldSetAsDefault ? 1 : 0]
    );
    
    res.json({
      success: true,
      message: 'Address added successfully',
      address_id: addressId
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

// Set default address
router.put('/user/:userId/address/:addressId/default', async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    
    // First, unset all defaults for this user
    await pool.query(
      'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
      [userId]
    );
    
    // Then set the new default
    const [result] = await pool.query(
      'UPDATE user_addresses SET is_default = 1 WHERE user_id = ? AND address_id = ?',
      [userId, addressId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Address not found for this user' });
    }
    
    res.json({ 
      success: true, 
      message: 'Default address updated successfully' 
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

// Set primary address
router.put('/user/:userId/primary-address/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    
    // Update user's primary_address_id
    const [result] = await pool.query(
      'UPDATE users SET primary_address_id = ? WHERE user_id = ?',
      [addressId, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Primary address updated successfully' 
    });
  } catch (error) {
    console.error('Error setting primary address:', error);
    res.status(500).json({ error: 'Failed to set primary address' });
  }
});

// Update an address
router.put('/address/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const addressData = req.body;
    
    console.log('Updating address:', addressId, 'with data:', addressData);
    
    // Validate required fields
    if (!addressData.street_name || !addressData.barangay || !addressData.cityVillage || !addressData.province || !addressData.region) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }
    
    // Update the address
    await pool.query(`
      UPDATE addresses 
      SET 
        unit_number = ?,
        street_name = ?,
        barangay = ?,
        cityVillage = ?,
        province = ?,
        region = ?,
        postal_code = ?,
        landmark = ?,
        address_type = ?,
        updated_at = NOW()
      WHERE address_id = ?
    `, [
      addressData.unit_number || null,
      addressData.street_name,
      addressData.barangay,
      addressData.cityVillage,
      addressData.province,
      addressData.region,
      addressData.postal_code || null,
      addressData.landmark || null,
      addressData.address_type || 'residential',
      addressId
    ]);
    
    res.json({ 
      success: true, 
      message: 'Address updated successfully' 
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete an address
router.delete('/address/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    
    console.log('Deleting address:', addressId);
    
    // Soft delete by setting is_active to 0
    await pool.query(`
      UPDATE addresses 
      SET is_active = 0, updated_at = NOW()
      WHERE address_id = ?
    `, [addressId]);
    
    // Also remove from user_addresses relationship
    await pool.query(`
      DELETE FROM user_addresses 
      WHERE address_id = ?
    `, [addressId]);
    
    res.json({ 
      success: true, 
      message: 'Address deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// Set exact location coordinates for an address
router.put('/:addressId/exact-location', async (req, res) => {
  try {
    const { addressId } = req.params;
    const { exact_latitude, exact_longitude, coordinate_accuracy, coordinate_source } = req.body;
    
    console.log('Setting exact location for address:', addressId, {
      exact_latitude,
      exact_longitude,
      coordinate_accuracy,
      coordinate_source
    });
    
    // Validate coordinates
    if (!exact_latitude || !exact_longitude) {
      return res.status(400).json({ 
        success: false,
        error: 'Exact latitude and longitude are required' 
      });
    }
    
    // Validate coordinate ranges
    const lat = parseFloat(exact_latitude);
    const lng = parseFloat(exact_longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid coordinate values' 
      });
    }
    
    if (lat < -90 || lat > 90) {
      return res.status(400).json({ 
        success: false,
        error: 'Latitude must be between -90 and 90' 
      });
    }
    
    if (lng < -180 || lng > 180) {
      return res.status(400).json({ 
        success: false,
        error: 'Longitude must be between -180 and 180' 
      });
    }
    
    // Check if exact coordinate columns exist, if not, add them
    try {
      console.log('Attempting to add exact coordinate columns...');
      
      // Add columns one by one to avoid syntax issues
      const columns = [
        "ADD COLUMN  exact_latitude DECIMAL(10, 8) NULL COMMENT 'Exact GPS latitude from vendor pin'",
        "ADD COLUMN  exact_longitude DECIMAL(11, 8) NULL COMMENT 'Exact GPS longitude from vendor pin'", 
        "ADD COLUMN coordinate_accuracy ENUM('exact', 'approximate', 'estimated') DEFAULT 'estimated' COMMENT 'Accuracy level of coordinates'",
        "ADD COLUMN  coordinate_source ENUM('gps', 'geocoding', 'manual', 'vendor_pin') DEFAULT 'geocoding' COMMENT 'Source of coordinate data'",
        "ADD COLUMN  coordinate_updated_at TIMESTAMP NULL COMMENT 'When coordinates were last updated'"
      ];
      
      for (const column of columns) {
        try {
          await pool.query(`ALTER TABLE addresses ${column}`);
        } catch (err) {
          if (err.code !== 'ER_DUP_FIELDNAME') {
            console.log(`Column might already exist: ${column}`);
          }
        }
      }
      
      console.log('✅ Exact coordinate columns added successfully');
    } catch (alterError) {
      console.log('Columns might already exist or error adding columns:', alterError.message);
    }
    
    // Update the address with exact coordinates
    const [result] = await pool.query(`
      UPDATE addresses 
      SET 
        exact_latitude = ?,
        exact_longitude = ?,
        coordinate_accuracy = ?,
        coordinate_source = ?,
        coordinate_updated_at = NOW(),
        updated_at = NOW()
      WHERE address_id = ? AND is_active = 1
    `, [
      lat,
      lng,
      coordinate_accuracy || 'exact',
      coordinate_source || 'vendor_pin',
      addressId
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Address not found or inactive' 
      });
    }
    
    console.log(`✅ Exact location set for address ${addressId}: ${lat}, ${lng}`);
    
    res.json({ 
      success: true, 
      message: 'Exact location saved successfully',
      coordinates: {
        exact_latitude: lat,
        exact_longitude: lng,
        coordinate_accuracy: coordinate_accuracy || 'exact',
        coordinate_source: coordinate_source || 'vendor_pin'
      }
    });
  } catch (error) {
    console.error('Error setting exact location:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save exact location' 
    });
  }
});

module.exports = router;