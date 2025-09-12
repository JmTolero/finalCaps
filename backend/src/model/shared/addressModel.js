const pool = require('../../db/config');

const addressModel = {
  // Create a new address
  createAddress: async (addressData) => {
    try {
      const {
        unit_number = '',
        street_name,
        barangay,
        cityVillage,
        province,
        region,
        postal_code = '',
        landmark = '',
        address_type = 'residential'
      } = addressData;

      const [result] = await pool.query(
        `INSERT INTO addresses 
         (unit_number, street_name, barangay, cityVillage, province, region, postal_code, landmark, address_type, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [unit_number, street_name, barangay, cityVillage, province, region, postal_code, landmark, address_type]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  },

  // Get address by ID
  getAddressById: async (addressId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM addresses WHERE address_id = ? AND is_active = 1',
        [addressId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting address:', error);
      throw error;
    }
  },

  // Update an address
  updateAddress: async (addressId, addressData) => {
    try {
      const {
        unit_number,
        street_name,
        barangay,
        cityVillage,
        province,
        region,
        postal_code,
        landmark,
        address_type
      } = addressData;

      const [result] = await pool.query(
        `UPDATE addresses 
         SET unit_number = ?, street_name = ?, barangay = ?, cityVillage = ?, 
             province = ?, region = ?, postal_code = ?, landmark = ?, 
             address_type = ?, updated_at = NOW()
         WHERE address_id = ? AND is_active = 1`,
        [unit_number, street_name, barangay, cityVillage, province, region, postal_code, landmark, address_type, addressId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },

  // Soft delete an address
  deleteAddress: async (addressId) => {
    try {
      const [result] = await pool.query(
        'UPDATE addresses SET is_active = 0, updated_at = NOW() WHERE address_id = ?',
        [addressId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },

  // Get addresses by user
  getUserAddresses: async (userId) => {
    try {
      const [rows] = await pool.query(
        `SELECT a.*, ua.address_label, ua.is_default
         FROM addresses a
         INNER JOIN user_addresses ua ON a.address_id = ua.address_id
         WHERE ua.user_id = ? AND a.is_active = 1
         ORDER BY ua.is_default DESC, ua.created_at DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting user addresses:', error);
      throw error;
    }
  },

  // Add address to user
  addUserAddress: async (userId, addressId, label = 'Home', isDefault = false) => {
    try {
      // If this is set as default, unset other defaults first
      if (isDefault) {
        await pool.query(
          'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      const [result] = await pool.query(
        'INSERT INTO user_addresses (user_id, address_id, address_label, is_default) VALUES (?, ?, ?, ?)',
        [userId, addressId, label, isDefault ? 1 : 0]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error adding user address:', error);
      throw error;
    }
  },

  // Format address for display
  formatAddress: (addressData) => {
    const parts = [];
    
    if (addressData.unit_number) parts.push(addressData.unit_number);
    if (addressData.street_name) parts.push(addressData.street_name);
    if (addressData.barangay) parts.push(addressData.barangay);
    if (addressData.cityVillage) parts.push(addressData.cityVillage);
    if (addressData.province) parts.push(addressData.province);
    if (addressData.postal_code) parts.push(addressData.postal_code);
    
    return parts.join(', ');
  },

  // Set primary address for user or vendor
  setPrimaryAddress: async (userId, addressId, tableName = 'users') => {
    try {
      const idColumn = tableName === 'users' ? 'user_id' : 'vendor_id';
      const query = `UPDATE ${tableName} SET primary_address_id = ? WHERE ${idColumn} = ?`;
      const [result] = await pool.query(query, [addressId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error setting primary address:', error);
      throw error;
    }
  },

  // Get primary address for user or vendor
  getPrimaryAddress: async (userId, tableName = 'users') => {
    try {
      const idColumn = tableName === 'users' ? 'user_id' : 'vendor_id';
      const query = `
        SELECT a.* 
        FROM addresses a
        INNER JOIN ${tableName} t ON a.address_id = t.primary_address_id
        WHERE t.${idColumn} = ? AND a.is_active = 1
      `;
      const [rows] = await pool.query(query, [userId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting primary address:', error);
      throw error;
    }
  },

  // Set default address in user_addresses table
  setDefaultAddress: async (userId, addressId) => {
    try {
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

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  },

  // Remove user address relationship (not the address itself)
  removeUserAddress: async (userId, addressId) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM user_addresses WHERE user_id = ? AND address_id = ?',
        [userId, addressId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing user address:', error);
      throw error;
    }
  },

  // Validate address data
  validateAddress: (addressData) => {
    const errors = [];
    
    if (!addressData.street_name || addressData.street_name.trim() === '') {
      errors.push('Street name is required');
    }
    
    if (!addressData.barangay || addressData.barangay.trim() === '') {
      errors.push('Barangay is required');
    }
    
    if (!addressData.cityVillage || addressData.cityVillage.trim() === '') {
      errors.push('City/Municipality is required');
    }
    
    if (!addressData.province || addressData.province.trim() === '') {
      errors.push('Province is required');
    }
    
    if (!addressData.region || addressData.region.trim() === '') {
      errors.push('Region is required');
    }
    
    return errors;
  }
};

module.exports = addressModel;
