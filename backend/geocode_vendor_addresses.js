const pool = require('./src/db/config');
const axios = require('axios');

// Delay function to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Geocode an address using OpenStreetMap Nominatim (free, no API key needed)
async function geocodeAddress(address) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'IceCreamVendorApp/1.0' // Required by Nominatim
            }
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

// Default coordinates for known cities
const defaultCoordinates = {
    'Lapu-lapu': { lat: 10.3103, lon: 123.9494 }, // Lapu-Lapu City center
    'Lapu-Lapu': { lat: 10.3103, lon: 123.9494 },
    'Lapu-Lapu City': { lat: 10.3103, lon: 123.9494 },
    'Cordova': { lat: 10.2531, lon: 123.9494 },
    'Cebu City': { lat: 10.3157, lon: 123.8854 },
    'Manila': { lat: 14.5995, lon: 120.9842 },
    'Makati': { lat: 14.5547, lon: 121.0244 },
    'Quezon City': { lat: 14.6760, lon: 121.0437 },
    'Pasig': { lat: 14.5764, lon: 121.0851 }
};

async function geocodeVendorAddresses() {
    try {
        console.log('🌍 Starting vendor address geocoding...\n');

        // Get all vendors with addresses but no coordinates
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                a.address_id,
                a.unit_number,
                a.street_name,
                a.barangay,
                a.cityVillage,
                a.province,
                a.region,
                a.latitude,
                a.longitude
            FROM vendors v
            INNER JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved'
            AND (a.latitude IS NULL OR a.longitude IS NULL)
        `);

        console.log(`📍 Found ${vendors.length} vendors without coordinates\n`);

        for (const vendor of vendors) {
            console.log(`\n🏪 Processing: ${vendor.store_name || 'Unnamed Store'} (ID: ${vendor.vendor_id})`);
            console.log(`   Location: ${vendor.cityVillage}, ${vendor.province}`);

            let coordinates = null;

            // First, try to use default coordinates if city is known
            if (vendor.cityVillage && defaultCoordinates[vendor.cityVillage]) {
                coordinates = defaultCoordinates[vendor.cityVillage];
                console.log(`   ✅ Using default coordinates for ${vendor.cityVillage}`);
            } else {
                // Build full address for geocoding
                const addressParts = [
                    vendor.street_name,
                    vendor.barangay,
                    vendor.cityVillage,
                    vendor.province,
                    vendor.region,
                    'Philippines'
                ].filter(part => part && part.trim() !== '');

                const fullAddress = addressParts.join(', ');
                console.log(`   🔍 Geocoding: ${fullAddress}`);

                // Try to geocode the full address
                const geocoded = await geocodeAddress(fullAddress);
                
                if (geocoded) {
                    coordinates = { lat: geocoded.latitude, lon: geocoded.longitude };
                    console.log(`   ✅ Geocoded successfully`);
                } else {
                    // If full address fails, try just city + province
                    const simpleAddress = `${vendor.cityVillage}, ${vendor.province}, Philippines`;
                    console.log(`   🔍 Trying simpler address: ${simpleAddress}`);
                    const geocoded2 = await geocodeAddress(simpleAddress);
                    
                    if (geocoded2) {
                        coordinates = { lat: geocoded2.latitude, lon: geocoded2.longitude };
                        console.log(`   ✅ Geocoded successfully`);
                    } else {
                        console.log(`   ❌ Could not geocode address`);
                    }
                }

                // Wait 1 second between requests to respect rate limits
                await delay(1000);
            }

            // Update the address with coordinates
            if (coordinates) {
                await pool.query(
                    'UPDATE addresses SET latitude = ?, longitude = ? WHERE address_id = ?',
                    [coordinates.lat, coordinates.lon, vendor.address_id]
                );
                console.log(`   💾 Saved: ${coordinates.lat}, ${coordinates.lon}`);
            }
        }

        console.log('\n\n✅ Geocoding complete!');
        console.log(`📊 Processed ${vendors.length} vendors`);

        // Show summary
        const [updated] = await pool.query(`
            SELECT COUNT(*) as count
            FROM vendors v
            INNER JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved'
            AND a.latitude IS NOT NULL 
            AND a.longitude IS NOT NULL
        `);

        console.log(`📍 Total vendors with coordinates: ${updated[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

geocodeVendorAddresses();
