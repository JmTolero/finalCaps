const mysql = require('mysql2/promise');
require('dotenv').config();

// Function to geocode an address to coordinates
const geocodeAddress = async (city, province, country = 'Philippines') => {
    try {
        // Use Google Geocoding API
        const address = `${city}, ${province}, ${country}`;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyArt8GMWuhdWsHKM73YdXwvKOsMLaaeQYM';
        
        console.log(` Geocoding address: ${address}`);
        
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            console.log(`Geocoded successfully: ${location.lat}, ${location.lng}`);
            return {
                latitude: location.lat,
                longitude: location.lng,
                formatted_address: data.results[0].formatted_address
            };
        } else {
            console.log(` Geocoding failed: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error(' Geocoding error:', error.message);
        return null;
    }
};

// Function to update existing addresses with coordinates
const updateAddressesWithCoordinates = async () => {
    let connection;
    
    try {
        console.log('🚀 Updating existing addresses with coordinates...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Get addresses without coordinates
        const [addresses] = await connection.execute(`
            SELECT address_id, cityVillage, province, latitude, longitude
            FROM addresses 
            WHERE (latitude IS NULL OR longitude IS NULL) 
            AND cityVillage IS NOT NULL 
            AND cityVillage != '' 
            AND province IS NOT NULL 
            AND province != ''
        `);

        console.log(`📊 Found ${addresses.length} addresses without coordinates`);

        for (const address of addresses) {
            console.log(`\n📍 Processing: ${address.cityVillage}, ${address.province}`);
            
            // Geocode the address
            const coordinates = await geocodeAddress(address.cityVillage, address.province);
            
            if (coordinates) {
                // Update the address with coordinates
                await connection.execute(`
                    UPDATE addresses 
                    SET latitude = ?, longitude = ?
                    WHERE address_id = ?
                `, [coordinates.latitude, coordinates.longitude, address.address_id]);
                
                console.log(`✅ Updated address ${address.address_id} with coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
                console.log(`   Formatted address: ${coordinates.formatted_address}`);
            } else {
                console.log(`❌ Failed to geocode address ${address.address_id}`);
            }
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Verify the updates
        const [updatedAddresses] = await connection.execute(`
            SELECT address_id, cityVillage, province, latitude, longitude
            FROM addresses 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        `);

        console.log(`\n✅ Successfully updated ${updatedAddresses.length} addresses with coordinates:`);
        updatedAddresses.forEach(addr => {
            console.log(`   - ${addr.cityVillage}, ${addr.province}: ${addr.latitude}, ${addr.longitude}`);
        });

    } catch (error) {
        console.error('❌ Error updating addresses:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

// Run the update
updateAddressesWithCoordinates();
