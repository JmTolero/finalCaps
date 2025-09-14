const express = require('express');
const router = express.Router();
const addressModel = require('../../model/shared/addressModel');
const pool = require('../../db/config');

// Get current vendor user info based on logged-in user
router.get('/vendor/current', async (req, res) => {
  try {
    console.log('Fetching current vendor...');
    
    // Get user ID from request headers (sent by frontend)
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'User ID not provided. Please log in again.' 
      });
    }
    
    console.log('Fetching vendor data for user ID:', userId);
    
    // Get the specific vendor user from the database
    const [vendors] = await pool.query(`
      SELECT 
        u.user_id as user_id, 
        u.fname as fname, 
        u.lname as lname,
        u.email,
        u.contact_no,
        v.vendor_id as vendor_id,
        v.store_name as store_name,
        v.status as status,
        v.profile_image_url as profile_image_url,
        v.proof_image_url as proof_image_url
      FROM users u
      INNER JOIN vendors v ON u.user_id = v.user_id
      WHERE u.user_id = ? AND u.role = 'vendor'
    `, [userId]);
    
    console.log('Vendors found for user', userId, ':', vendors.length);
    
    if (vendors.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No vendor account found for this user. Please register as a vendor first.' 
      });
    }
    
    console.log('Returning vendor data:', vendors[0]);
    res.json({
      success: true,
      vendor: vendors[0]
    });
  } catch (error) {
    console.error('Error fetching current vendor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch vendor information',
      details: error.message 
    });
  }
});

// Debug endpoint to check available users
router.get('/debug/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT user_id, fname, email, role FROM users ORDER BY user_id LIMIT 10');
    res.json({
      success: true,
      users: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Middleware to verify user authentication (you'll need to implement this)
const authenticateUser = (req, res, next) => {
  // For now, we'll assume user info is passed in headers or session
  // In a real app, you'd verify JWT tokens here
  const userId = req.headers['x-user-id'] || req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId;
  next();
};

// Get all addresses for a user
router.get('/user/:userId/addresses', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [addresses] = await pool.query(
      `SELECT a.*, ua.address_label, ua.is_default, ua.created_at as link_created
       FROM addresses a
       INNER JOIN user_addresses ua ON a.address_id = ua.address_id
       WHERE ua.user_id = ? AND a.is_active = 1
       ORDER BY ua.is_default DESC, ua.created_at DESC`,
      [userId]
    );
    
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

    // Validate address data
    const errors = addressModel.validateAddress(addressData);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed: ' + errors.join(', ') });
    }

    // Create the address
    const addressId = await addressModel.createAddress(addressData);

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

// Update address
router.put('/address/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const { address_label, is_default, ...addressData } = req.body;

    // Validate address data
    const errors = addressModel.validateAddress(addressData);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed: ' + errors.join(', ') });
    }

    // Update the address
    const updated = await addressModel.updateAddress(addressId, addressData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Update user-address relationship if needed
    if (address_label || is_default !== undefined) {
      const userId = req.userId; // From auth middleware
      
      if (is_default) {
        // Unset other defaults first
        await pool.query(
          'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      await pool.query(
        'UPDATE user_addresses SET address_label = COALESCE(?, address_label), is_default = COALESCE(?, is_default) WHERE user_id = ? AND address_id = ?',
        [address_label, is_default ? 1 : 0, userId, addressId]
      );
    }

    res.json({
      success: true,
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete address
router.delete('/address/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.userId; // From auth middleware

    // Remove user-address relationship
    await pool.query(
      'DELETE FROM user_addresses WHERE user_id = ? AND address_id = ?',
      [userId, addressId]
    );

    // Soft delete the address
    const deleted = await addressModel.deleteAddress(addressId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// Set default address
router.put('/user/:userId/address/:addressId/default', async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    
    const success = await addressModel.setDefaultAddress(userId, addressId);
    
    if (!success) {
      return res.status(404).json({ error: 'Address relationship not found' });
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

// Set primary address for user or vendor
router.put('/user/:userId/primary-address/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const { table = 'users' } = req.query; // Allow specifying 'users' or 'vendors'
    
    const success = await addressModel.setPrimaryAddress(userId, addressId, table);
    
    if (!success) {
      return res.status(404).json({ error: 'User/Vendor or address not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Primary address updated successfully for ${table}` 
    });
  } catch (error) {
    console.error('Error setting primary address:', error);
    res.status(500).json({ error: 'Failed to set primary address' });
  }
});

// Get primary address for user or vendor
router.get('/user/:userId/primary-address', async (req, res) => {
  try {
    const { userId } = req.params;
    const { table = 'users' } = req.query;
    
    const address = await addressModel.getPrimaryAddress(userId, table);
    
    if (!address) {
      return res.status(404).json({ error: 'No primary address found' });
    }
    
    res.json({
      success: true,
      address: address
    });
  } catch (error) {
    console.error('Error getting primary address:', error);
    res.status(500).json({ error: 'Failed to get primary address' });
  }
});

// Get address by ID
router.get('/address/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = await addressModel.getAddressById(addressId);
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
});

// Vendor-specific routes
router.get('/vendor/:vendorId/addresses', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    // Get vendor's user_id first
    const [vendor] = await pool.query('SELECT user_id FROM vendors WHERE vendor_id = ?', [vendorId]);
    if (vendor.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const addresses = await addressModel.getUserAddresses(vendor[0].user_id);
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching vendor addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Create address for vendor
router.post('/vendor/:vendorId/address', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const addressData = { ...req.body, address_type: 'business' };

    // Get vendor's user_id
    const [vendor] = await pool.query('SELECT user_id FROM vendors WHERE vendor_id = ?', [vendorId]);
    if (vendor.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Validate address data
    const errors = addressModel.validateAddress(addressData);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed: ' + errors.join(', ') });
    }

    // Create the address
    const addressId = await addressModel.createAddress(addressData);

    // Update vendor's primary address if this is their first address
    const [existingAddresses] = await pool.query(
      'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?',
      [vendor[0].user_id]
    );

    const isFirstAddress = existingAddresses[0].count === 0;

    // Link address to user
    await addressModel.addUserAddress(vendor[0].user_id, addressId, 'Store', isFirstAddress);

    // Update vendor's primary_address_id if this is their first address
    if (isFirstAddress) {
      await pool.query(
        'UPDATE vendors SET primary_address_id = ? WHERE vendor_id = ?',
        [addressId, vendorId]
      );
      
      await pool.query(
        'UPDATE users SET primary_address_id = ? WHERE user_id = ?',
        [addressId, vendor[0].user_id]
      );
    }

    res.json({
      success: true,
      message: 'Store address added successfully',
      address_id: addressId
    });
  } catch (error) {
    console.error('Error creating vendor address:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

module.exports = router;
