const axios = require('axios');

// Delay function to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Default coordinates for known cities in the Philippines
const defaultCoordinates = {
  // Cebu
  'Lapu-lapu': { lat: 10.3103, lon: 123.9494 },
  'Lapu-Lapu': { lat: 10.3103, lon: 123.9494 },
  'Lapu-Lapu City': { lat: 10.3103, lon: 123.9494 },
  'Cordova': { lat: 10.2531, lon: 123.9494 },
  'Cebu City': { lat: 10.3157, lon: 123.8854 },
  'Mandaue': { lat: 10.3237, lon: 123.9227 },
  'Talisay': { lat: 10.2449, lon: 123.8492 },
  
  // Metro Manila
  'Manila': { lat: 14.5995, lon: 120.9842 },
  'Makati': { lat: 14.5547, lon: 121.0244 },
  'Quezon City': { lat: 14.6760, lon: 121.0437 },
  'Pasig': { lat: 14.5764, lon: 121.0851 },
  'Taguig': { lat: 14.5176, lon: 121.0509 },
  'Mandaluyong': { lat: 14.5794, lon: 121.0359 },
  'San Juan': { lat: 14.6019, lon: 121.0355 },
  'Pasay': { lat: 14.5378, lon: 121.0014 },
  'Parañaque': { lat: 14.4793, lon: 121.0198 },
  'Las Piñas': { lat: 14.4453, lon: 120.9842 },
  'Muntinlupa': { lat: 14.4083, lon: 121.0399 },
  'Caloocan': { lat: 14.6488, lon: 120.9830 },
  'Malabon': { lat: 14.6625, lon: 120.9570 },
  'Navotas': { lat: 14.6618, lon: 120.9402 },
  'Valenzuela': { lat: 14.7006, lon: 120.9830 },
  'Marikina': { lat: 14.6507, lon: 121.1029 },
  
  // Other major cities
  'Davao City': { lat: 7.1907, lon: 125.4553 },
  'Cagayan de Oro': { lat: 8.4542, lon: 124.6319 },
  'Iloilo City': { lat: 10.7202, lon: 122.5621 },
  'Bacolod': { lat: 10.6770, lon: 122.9506 },
  'Baguio': { lat: 16.4023, lon: 120.5960 },
  'Cabanatuan': { lat: 15.4869, lon: 120.9675 },
};

/**
 * Geocode an address using OpenStreetMap Nominatim (free, no API key needed)
 * @param {string} address - Full address to geocode
 * @returns {Promise<{latitude: number, longitude: number, display_name: string}|null>}
 */
async function geocodeAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'IceCreamVendorApp/1.0' // Required by Nominatim
      },
      timeout: 5000 // 5 second timeout
    });

    if (response.data && response.data.length > 0) {
      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
        display_name: response.data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

/**
 * Get coordinates for an address
 * Tries default coordinates first, then geocoding API
 * @param {Object} addressData - Address object with cityVillage, province, etc.
 * @returns {Promise<{lat: number, lon: number}|null>}
 */
async function getCoordinatesForAddress(addressData) {
  const { cityVillage, province, street_name, barangay, region } = addressData;

  // First, try to use default coordinates if city is known
  if (cityVillage && defaultCoordinates[cityVillage]) {
    console.log(`✅ Using default coordinates for ${cityVillage}`);
    return defaultCoordinates[cityVillage];
  }

  // Build full address for geocoding
  const addressParts = [
    street_name,
    barangay,
    cityVillage,
    province,
    region,
    'Philippines'
  ].filter(part => part && part.trim() !== '');

  if (addressParts.length === 0) {
    console.log('❌ No address information provided');
    return null;
  }

  const fullAddress = addressParts.join(', ');
  console.log(`🔍 Geocoding: ${fullAddress}`);

  // Try to geocode the full address
  let geocoded = await geocodeAddress(fullAddress);
  
  if (geocoded) {
    console.log(`✅ Geocoded successfully: ${geocoded.latitude}, ${geocoded.longitude}`);
    return { lat: geocoded.latitude, lon: geocoded.longitude };
  }

  // If full address fails, try just city + province
  if (cityVillage && province) {
    const simpleAddress = `${cityVillage}, ${province}, Philippines`;
    console.log(`🔍 Trying simpler address: ${simpleAddress}`);
    
    // Wait 1 second between requests to respect rate limits
    await delay(1000);
    
    geocoded = await geocodeAddress(simpleAddress);
    
    if (geocoded) {
      console.log(`✅ Geocoded successfully: ${geocoded.latitude}, ${geocoded.longitude}`);
      return { lat: geocoded.latitude, lon: geocoded.longitude };
    }
  }

  console.log(`❌ Could not geocode address`);
  return null;
}

/**
 * Geocode and save coordinates for an address
 * @param {Object} pool - Database connection pool
 * @param {number} addressId - Address ID to update
 * @param {Object} addressData - Address data
 * @returns {Promise<boolean>} - True if coordinates were saved
 */
async function geocodeAndSaveAddress(pool, addressId, addressData) {
  try {
    const coordinates = await getCoordinatesForAddress(addressData);
    
    if (coordinates) {
      await pool.query(
        'UPDATE addresses SET latitude = ?, longitude = ? WHERE address_id = ?',
        [coordinates.lat, coordinates.lon, addressId]
      );
      console.log(`💾 Saved coordinates for address ${addressId}: ${coordinates.lat}, ${coordinates.lon}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error geocoding and saving address:', error);
    return false;
  }
}

module.exports = {
  geocodeAddress,
  getCoordinatesForAddress,
  geocodeAndSaveAddress,
  defaultCoordinates
};
