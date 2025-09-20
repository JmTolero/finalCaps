const pool = require('../../db/config');
const addressModel = require('../../model/shared/addressModel');

const locationController = {
  // Get all vendor locations for admin (simplified)
  getAllVendorLocations: async (req, res) => {
    try {
      const [locations] = await pool.query(`
        SELECT 
          v.vendor_id,
          v.store_name,
          v.status as vendor_status,
          u.fname as vendor_name,
          u.lname as vendor_lastname,
          u.email as vendor_email,
          u.contact_no,
          a.address_id,
          a.unit_number,
          a.street_name,
          a.barangay,
          a.cityVillage,
          a.province,
          a.region,
          a.postal_code,
          a.landmark,
          CONCAT_WS(', ', 
            NULLIF(a.unit_number, ''),
            a.street_name,
            a.barangay,
            a.cityVillage,
            a.province,
            a.region
          ) as full_address,
          a.created_at as address_created
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        LEFT JOIN addresses a ON v.primary_address_id = a.address_id
        WHERE u.role = 'vendor'
        ORDER BY v.store_name ASC
      `);

      res.json({
        success: true,
        vendors: locations
      });
    } catch (error) {
      console.error('Error fetching all vendor locations:', error);
      res.status(500).json({ error: 'Failed to fetch vendor locations' });
    }
  },

  // Get specific vendor's location
  getVendorLocation: async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      const [location] = await pool.query(`
        SELECT 
          v.vendor_id,
          v.store_name,
          v.status as vendor_status,
          u.fname as vendor_name,
          u.lname as vendor_lastname,
          u.email as vendor_email,
          u.contact_no,
          a.address_id,
          a.unit_number,
          a.street_name,
          a.barangay,
          a.cityVillage,
          a.province,
          a.region,
          a.postal_code,
          a.landmark,
          CONCAT_WS(', ', 
            NULLIF(a.unit_number, ''),
            a.street_name,
            a.barangay,
            a.cityVillage,
            a.province,
            a.region
          ) as full_address,
          a.created_at as address_created
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        LEFT JOIN addresses a ON v.primary_address_id = a.address_id
        WHERE v.vendor_id = ? AND u.role = 'vendor'
      `, [vendorId]);

      if (location.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json({
        success: true,
        vendor: location[0]
      });
    } catch (error) {
      console.error('Error fetching vendor location:', error);
      res.status(500).json({ error: 'Failed to fetch vendor location' });
    }
  },

  // Update vendor location
  updateVendorLocation: async (req, res) => {
    try {
      const { vendorId, addressId } = req.params;
      const addressData = req.body;

      // Validate address data
      const errors = addressModel.validateAddress(addressData);
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation failed: ' + errors.join(', ') });
      }

      // Verify address exists and belongs to this vendor
      const [ownership] = await pool.query(`
        SELECT a.address_id 
        FROM addresses a
        INNER JOIN vendors v ON a.address_id = v.primary_address_id
        WHERE v.vendor_id = ? AND a.address_id = ?
      `, [vendorId, addressId]);

      if (ownership.length === 0) {
        return res.status(403).json({ error: 'Address not found or access denied' });
      }

      // Update the address
      const updated = await addressModel.updateAddress(addressId, addressData);
      
      if (!updated) {
        return res.status(404).json({ error: 'Address not found' });
      }

      res.json({
        success: true,
        message: 'Vendor location updated successfully'
      });
    } catch (error) {
      console.error('Error updating vendor location:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  },

  // Search vendor locations (simplified)
  searchVendorLocations: async (req, res) => {
    try {
      const { query, province, city } = req.query;
      
      let sql = `
        SELECT 
          v.vendor_id,
          v.store_name,
          v.status as vendor_status,
          u.fname as vendor_name,
          u.lname as vendor_lastname,
          u.email as vendor_email,
          a.address_id,
          a.street_name,
          a.barangay,
          a.cityVillage,
          a.province,
          a.region,
          CONCAT_WS(', ', 
            NULLIF(a.unit_number, ''),
            a.street_name,
            a.barangay,
            a.cityVillage,
            a.province,
            a.region
          ) as full_address
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        LEFT JOIN addresses a ON v.primary_address_id = a.address_id
        WHERE u.role = 'vendor'
      `;
      
      const params = [];
      
      if (query) {
        sql += ` AND (v.store_name LIKE ? OR u.fname LIKE ? OR u.lname LIKE ? OR a.street_name LIKE ? OR a.barangay LIKE ? OR a.cityVillage LIKE ?)`;
        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (province) {
        sql += ` AND a.province = ?`;
        params.push(province);
      }
      
      if (city) {
        sql += ` AND a.cityVillage = ?`;
        params.push(city);
      }
      
      sql += ` ORDER BY v.store_name ASC LIMIT 100`;
      
      const [results] = await pool.query(sql, params);
      
      res.json({
        success: true,
        results: results,
        count: results.length
      });
    } catch (error) {
      console.error('Error searching vendor locations:', error);
      res.status(500).json({ error: 'Failed to search locations' });
    }
  },

  // Get basic vendor count (simple stats)
  getVendorCount: async (req, res) => {
    try {
      const [result] = await pool.query(`
        SELECT 
          COUNT(DISTINCT v.vendor_id) as total_vendors,
          COUNT(CASE WHEN a.address_id IS NOT NULL THEN 1 END) as vendors_with_locations,
          COUNT(CASE WHEN a.address_id IS NULL THEN 1 END) as vendors_without_locations
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        LEFT JOIN addresses a ON v.primary_address_id = a.address_id
        WHERE u.role = 'vendor'
      `);

      res.json({
        success: true,
        stats: result[0]
      });
    } catch (error) {
      console.error('Error fetching vendor count:', error);
      res.status(500).json({ error: 'Failed to fetch vendor count' });
    }
  }
};

module.exports = locationController;