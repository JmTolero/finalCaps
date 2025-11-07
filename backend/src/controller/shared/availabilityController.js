const pool = require('../../db/config');

// Get availability for all sizes on a specific date for a vendor
const getAvailabilityByDate = async (req, res) => {
  try {
    const { vendor_id, date } = req.params;

    if (!vendor_id || !date) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID and date are required'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Get availability from daily_drum_availability, or vendor's total capacity
    // IMPORTANT: Include reserved_count to properly calculate available_count
    const [availabilityRecords] = await pool.query(`
      SELECT 
        drum_size,
        total_capacity,
        booked_count,
        reserved_count,
        available_count
      FROM daily_drum_availability
      WHERE vendor_id = ? AND delivery_date = ?
    `, [vendor_id, date]);

    // Get vendor's base capacity if no daily records exist
    let baseCapacity = { small: 0, medium: 0, large: 0 };
    
    const [vendorCapacity] = await pool.query(`
      SELECT drum_size, stock 
      FROM vendor_drum_pricing 
      WHERE vendor_id = ?
    `, [vendor_id]);

    vendorCapacity.forEach(row => {
      baseCapacity[row.drum_size] = row.stock || 0;
    });

    // Format response
    const availability = {
      small: {
        total_capacity: 0,
        booked_count: 0,
        reserved_count: 0,
        available_count: baseCapacity.small
      },
      medium: {
        total_capacity: 0,
        booked_count: 0,
        reserved_count: 0,
        available_count: baseCapacity.medium
      },
      large: {
        total_capacity: 0,
        booked_count: 0,
        reserved_count: 0,
        available_count: baseCapacity.large
      }
    };

    // Update with actual daily records if they exist
    // Recalculate available_count to ensure it accounts for reserved items
    availabilityRecords.forEach(record => {
      const totalCapacity = Number(record.total_capacity) || 0;
      const bookedCount = Number(record.booked_count) || 0;
      const reservedCount = Number(record.reserved_count) || 0;
      
      // Calculate available_count: total - booked - reserved
      // This ensures reserved items are properly deducted from availability
      const calculatedAvailable = Math.max(0, totalCapacity - bookedCount - reservedCount);
      
      availability[record.drum_size] = {
        total_capacity: totalCapacity,
        booked_count: bookedCount,
        reserved_count: reservedCount,
        available_count: calculatedAvailable
      };
    });

    res.json({
      success: true,
      vendor_id: parseInt(vendor_id),
      date: date,
      availability: availability
    });

  } catch (error) {
    console.error('Error fetching availability by date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get availability for a specific size on a specific date
const getAvailabilityByDateAndSize = async (req, res) => {
  try {
    const { vendor_id, date, size } = req.params;

    if (!vendor_id || !date || !size) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID, date, and size are required'
      });
    }

    // Validate size
    const validSizes = ['small', 'medium', 'large'];
    if (!validSizes.includes(size.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid size. Must be small, medium, or large'
      });
    }

    // Get availability from daily_drum_availability
    // IMPORTANT: Include reserved_count to properly calculate available_count
    const [availabilityRecord] = await pool.query(`
      SELECT 
        drum_size,
        total_capacity,
        booked_count,
        reserved_count,
        available_count
      FROM daily_drum_availability
      WHERE vendor_id = ? AND delivery_date = ? AND drum_size = ?
    `, [vendor_id, date, size.toLowerCase()]);

    // If no record exists, get vendor's base capacity
    if (availabilityRecord.length === 0) {
      const [vendorCapacity] = await pool.query(`
        SELECT stock 
        FROM vendor_drum_pricing 
        WHERE vendor_id = ? AND drum_size = ?
      `, [vendor_id, size.toLowerCase()]);

      const baseCapacity = vendorCapacity.length > 0 ? (vendorCapacity[0].stock || 0) : 0;

      return res.json({
        success: true,
        vendor_id: parseInt(vendor_id),
        date: date,
        size: size.toLowerCase(),
        total_capacity: 0,
        booked_count: 0,
        reserved_count: 0,
        available_count: baseCapacity
      });
    }

    const record = availabilityRecord[0];
    const totalCapacity = Number(record.total_capacity) || 0;
    const bookedCount = Number(record.booked_count) || 0;
    const reservedCount = Number(record.reserved_count) || 0;
    
    // Calculate available_count: total - booked - reserved
    // This ensures reserved items are properly deducted from availability
    const calculatedAvailable = Math.max(0, totalCapacity - bookedCount - reservedCount);
    
    res.json({
      success: true,
      vendor_id: parseInt(vendor_id),
      date: date,
      size: size.toLowerCase(),
      total_capacity: totalCapacity,
      booked_count: bookedCount,
      reserved_count: reservedCount,
      available_count: calculatedAvailable
    });

  } catch (error) {
    console.error('Error fetching availability by date and size:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAvailabilityByDate,
  getAvailabilityByDateAndSize
};
