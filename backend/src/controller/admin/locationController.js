const pool = require('../../db/config');
const addressModel = require('../../model/shared/addressModel');

const locationController = {
  // Get all vendor locations for admin
  getAllVendorLocations: async (req, res) => {
    try {
      const [locations] = await pool.query(`
        SELECT 
          v.vendor_id,
          v.store_name,
          u.fname as vendor_name,
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
          a.address_type,
          a.is_active,
          a.created_at as address_created,
          ua.address_label,
          ua.is_default
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        LEFT JOIN user_addresses ua ON u.user_id = ua.user_id
        LEFT JOIN addresses a ON ua.address_id = a.address_id
        WHERE u.role = 'vendor' AND (a.is_active = 1 OR a.address_id IS NULL)
        ORDER BY v.store_name ASC, a.created_at DESC
      `);

      // Group locations by vendor
      const vendorLocations = {};
      
      locations.forEach(location => {
        if (!vendorLocations[location.vendor_id]) {
          vendorLocations[location.vendor_id] = {
            vendor_id: location.vendor_id,
            store_name: location.store_name,
            vendor_name: location.vendor_name,
            vendor_email: location.vendor_email,
            contact_no: location.contact_no,
            addresses: []
          };
        }
        
        if (location.address_id) {
          vendorLocations[location.vendor_id].addresses.push({
            address_id: location.address_id,
            unit_number: location.unit_number,
            street_name: location.street_name,
            barangay: location.barangay,
            cityVillage: location.cityVillage,
            province: location.province,
            region: location.region,
            postal_code: location.postal_code,
            landmark: location.landmark,
            address_type: location.address_type,
            address_label: location.address_label,
            is_default: location.is_default,
            is_active: location.is_active,
            created_at: location.address_created
          });
        }
      });

      res.json({
        success: true,
        vendors: Object.values(vendorLocations)
      });
    } catch (error) {
      console.error('Error fetching all vendor locations:', error);
      res.status(500).json({ error: 'Failed to fetch vendor locations' });
    }
  },

  // Get specific vendor's locations
  getVendorLocations: async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      const [locations] = await pool.query(`
        SELECT 
          a.address_id,
          a.unit_number,
          a.street_name,
          a.barangay,
          a.cityVillage,
          a.province,
          a.region,
          a.postal_code,
          a.landmark,
          a.address_type,
          a.is_active,
          a.created_at,
          ua.address_label,
          ua.is_default
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        INNER JOIN user_addresses ua ON u.user_id = ua.user_id
        INNER JOIN addresses a ON ua.address_id = a.address_id
        WHERE v.vendor_id = ? AND a.is_active = 1
        ORDER BY ua.is_default DESC, a.created_at DESC
      `, [vendorId]);

      res.json({
        success: true,
        locations: locations
      });
    } catch (error) {
      console.error('Error fetching vendor locations:', error);
      res.status(500).json({ error: 'Failed to fetch vendor locations' });
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

      // Verify vendor owns this address
      const [ownership] = await pool.query(`
        SELECT a.address_id 
        FROM addresses a
        INNER JOIN user_addresses ua ON a.address_id = ua.address_id
        INNER JOIN users u ON ua.user_id = u.user_id
        INNER JOIN vendors v ON u.user_id = v.user_id
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
        message: 'Location updated successfully'
      });
    } catch (error) {
      console.error('Error updating vendor location:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  },

  // Bulk update vendor locations
  bulkUpdateVendorLocations: async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { locations } = req.body; // Array of location updates

      if (!Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ error: 'No locations provided for update' });
      }

      const results = [];
      const errors = [];

      // Process each location update
      for (const locationUpdate of locations) {
        try {
          const { address_id, ...addressData } = locationUpdate;

          if (!address_id) {
            errors.push({ location: locationUpdate, error: 'Address ID is required' });
            continue;
          }

          // Validate address data
          const validationErrors = addressModel.validateAddress(addressData);
          if (validationErrors.length > 0) {
            errors.push({ 
              address_id, 
              error: 'Validation failed: ' + validationErrors.join(', ') 
            });
            continue;
          }

          // Verify vendor owns this address
          const [ownership] = await pool.query(`
            SELECT a.address_id 
            FROM addresses a
            INNER JOIN user_addresses ua ON a.address_id = ua.address_id
            INNER JOIN users u ON ua.user_id = u.user_id
            INNER JOIN vendors v ON u.user_id = v.user_id
            WHERE v.vendor_id = ? AND a.address_id = ?
          `, [vendorId, address_id]);

          if (ownership.length === 0) {
            errors.push({ address_id, error: 'Address not found or access denied' });
            continue;
          }

          // Update the address
          const updated = await addressModel.updateAddress(address_id, addressData);
          
          if (updated) {
            results.push({ address_id, status: 'updated' });
          } else {
            errors.push({ address_id, error: 'Failed to update' });
          }
        } catch (error) {
          errors.push({ 
            address_id: locationUpdate.address_id || 'unknown', 
            error: error.message 
          });
        }
      }

      res.json({
        success: errors.length === 0,
        message: `Updated ${results.length} locations${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        results,
        errors
      });
    } catch (error) {
      console.error('Error bulk updating vendor locations:', error);
      res.status(500).json({ error: 'Failed to bulk update locations' });
    }
  },

  // Get vendor location statistics
  getVendorLocationStats: async (req, res) => {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(DISTINCT v.vendor_id) as total_vendors,
          COUNT(a.address_id) as total_locations,
          AVG(location_counts.location_count) as avg_locations_per_vendor,
          MAX(location_counts.location_count) as max_locations_per_vendor
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        LEFT JOIN user_addresses ua ON u.user_id = ua.user_id
        LEFT JOIN addresses a ON ua.address_id = a.address_id AND a.is_active = 1
        LEFT JOIN (
          SELECT v2.vendor_id, COUNT(a2.address_id) as location_count
          FROM vendors v2
          INNER JOIN users u2 ON v2.user_id = u2.user_id
          LEFT JOIN user_addresses ua2 ON u2.user_id = ua2.user_id
          LEFT JOIN addresses a2 ON ua2.address_id = a2.address_id AND a2.is_active = 1
          GROUP BY v2.vendor_id
        ) as location_counts ON v.vendor_id = location_counts.vendor_id
        WHERE u.role = 'vendor'
      `);

      const [provinceStats] = await pool.query(`
        SELECT 
          a.province,
          COUNT(DISTINCT v.vendor_id) as vendor_count,
          COUNT(a.address_id) as location_count
        FROM addresses a
        INNER JOIN user_addresses ua ON a.address_id = ua.address_id
        INNER JOIN users u ON ua.user_id = u.user_id
        INNER JOIN vendors v ON u.user_id = v.user_id
        WHERE a.is_active = 1 AND u.role = 'vendor'
        GROUP BY a.province
        ORDER BY location_count DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        overall_stats: stats[0],
        province_distribution: provinceStats
      });
    } catch (error) {
      console.error('Error fetching vendor location stats:', error);
      res.status(500).json({ error: 'Failed to fetch location statistics' });
    }
  },

  // Search vendor locations
  searchVendorLocations: async (req, res) => {
    try {
      const { query, province, city, address_type } = req.query;
      
      let sql = `
        SELECT 
          v.vendor_id,
          v.store_name,
          u.fname as vendor_name,
          u.email as vendor_email,
          a.address_id,
          a.unit_number,
          a.street_name,
          a.barangay,
          a.cityVillage,
          a.province,
          a.region,
          a.postal_code,
          a.landmark,
          a.address_type,
          ua.address_label
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        INNER JOIN user_addresses ua ON u.user_id = ua.user_id
        INNER JOIN addresses a ON ua.address_id = a.address_id
        WHERE u.role = 'vendor' AND a.is_active = 1
      `;
      
      const params = [];
      
      if (query) {
        sql += ` AND (v.store_name LIKE ? OR u.fname LIKE ? OR a.street_name LIKE ? OR a.barangay LIKE ?)`;
        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (province) {
        sql += ` AND a.province = ?`;
        params.push(province);
      }
      
      if (city) {
        sql += ` AND a.cityVillage = ?`;
        params.push(city);
      }
      
      if (address_type) {
        sql += ` AND a.address_type = ?`;
        params.push(address_type);
      }
      
      sql += ` ORDER BY v.store_name ASC, a.created_at DESC LIMIT 50`;
      
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
  }
};

module.exports = locationController;
