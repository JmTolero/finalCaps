import axios from 'axios';

const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";

/**
 * Get availability for all sizes on a specific date for a vendor
 * @param {number} vendorId - The vendor ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Availability data for all sizes
 */
export const getAvailabilityByDate = async (vendorId, date) => {
  try {
    const response = await axios.get(`${apiBase}/api/availability/${vendorId}/${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching availability by date:', error);
    throw error;
  }
};

/**
 * Get availability for a specific size on a specific date
 * @param {number} vendorId - The vendor ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} size - Drum size (small, medium, large)
 * @returns {Promise<Object>} Availability data for the specified size
 */
export const getAvailabilityByDateAndSize = async (vendorId, date, size) => {
  try {
    const response = await axios.get(`${apiBase}/api/availability/${vendorId}/${date}/${size}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching availability by date and size:', error);
    throw error;
  }
};

export default {
  getAvailabilityByDate,
  getAvailabilityByDateAndSize
};
