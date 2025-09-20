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
    
    // Create the address
    const [addressResult] = await pool.query(
      `INSERT INTO addresses 
       (unit_number, street_name, barangay, cityVillage, province, region, postal_code, landmark, address_type, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [addressData.unit_number || '', addressData.street_name, addressData.barangay, addressData.cityVillage, addressData.province, addressData.region, addressData.postal_code || '', addressData.landmark || '', addressData.address_type || 'residential']
    );
    
    const addressId = addressResult.insertId;
    
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

module.exports = router;