// Function to automatically geocode addresses when created
const geocodeAddress = async (city, province, country = 'Philippines') => {
    try {
        const address = `${city}, ${province}, ${country}`;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyArt8GMWuhdWsHKM73YdXwvKOsMLaaeQYM';
        
        console.log(`🔍 Auto-geocoding address: ${address}`);
        
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            console.log(`✅ Auto-geocoded successfully: ${location.lat}, ${location.lng}`);
            return {
                latitude: location.lat,
                longitude: location.lng,
                formatted_address: data.results[0].formatted_address
            };
        } else {
            console.log(`❌ Auto-geocoding failed: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Auto-geocoding error:', error.message);
        return null;
    }
};

// Updated address creation with automatic geocoding
const createAddressWithGeocoding = async (pool, city, province, region = '', addressType = 'business') => {
    try {
        // First, try to geocode the address
        const coordinates = await geocodeAddress(city, province);
        
        // Create address with or without coordinates
        const [addressResult] = await pool.query(
            'INSERT INTO addresses (street_name, barangay, cityVillage, province, region, address_type, latitude, longitude, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
            [
                '', // street_name
                '', // barangay
                city, // cityVillage
                province, // province
                region, // region
                addressType, // address_type
                coordinates ? coordinates.latitude : null, // latitude
                coordinates ? coordinates.longitude : null, // longitude
            ]
        );
        
        console.log(`✅ Address created with ID: ${addressResult.insertId}`);
        if (coordinates) {
            console.log(`📍 Coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
        } else {
            console.log(`⚠️ No coordinates - will use fallback`);
        }
        
        return addressResult.insertId;
    } catch (error) {
        console.error('❌ Error creating address with geocoding:', error.message);
        throw error;
    }
};

module.exports = {
    geocodeAddress,
    createAddressWithGeocoding
};
