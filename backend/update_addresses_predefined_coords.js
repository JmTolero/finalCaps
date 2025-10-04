const mysql = require('mysql2/promise');
require('dotenv').config();

// Predefined coordinates for common Philippine cities
const cityCoordinates = {
    // Metro Manila
    'Manila': { lat: 14.5995, lng: 120.9842 },
    'Manila City': { lat: 14.5995, lng: 120.9842 },
    'Quezon City': { lat: 14.6760, lng: 121.0437 },
    'Makati': { lat: 14.5547, lng: 121.0244 },
    'Makati City': { lat: 14.5547, lng: 121.0244 },
    'Pasig': { lat: 14.5764, lng: 121.0851 },
    'Pasig City': { lat: 14.5764, lng: 121.0851 },
    'Taguig': { lat: 14.5176, lng: 121.0509 },
    'Taguig City': { lat: 14.5176, lng: 121.0509 },
    'Marikina': { lat: 14.6507, lng: 121.1029 },
    'Marikina City': { lat: 14.6507, lng: 121.1029 },
    'Las Piñas': { lat: 14.4506, lng: 120.9828 },
    'Las Piñas City': { lat: 14.4506, lng: 120.9828 },
    'Parañaque': { lat: 14.4793, lng: 121.0198 },
    'Parañaque City': { lat: 14.4793, lng: 121.0198 },
    'Muntinlupa': { lat: 14.4064, lng: 121.0341 },
    'Muntinlupa City': { lat: 14.4064, lng: 121.0341 },
    'Caloocan': { lat: 14.6548, lng: 120.9842 },
    'Caloocan City': { lat: 14.6548, lng: 120.9842 },
    'Malabon': { lat: 14.6603, lng: 120.9569 },
    'Malabon City': { lat: 14.6603, lng: 120.9569 },
    'Navotas': { lat: 14.6548, lng: 120.9449 },
    'Navotas City': { lat: 14.6548, lng: 120.9449 },
    'San Juan': { lat: 14.6019, lng: 121.0355 },
    'San Juan City': { lat: 14.6019, lng: 121.0355 },
    'Mandaluyong': { lat: 14.5794, lng: 121.0359 },
    'Mandaluyong City': { lat: 14.5794, lng: 121.0359 },
    'Pateros': { lat: 14.5407, lng: 121.0689 },
    'Valenzuela': { lat: 14.6969, lng: 120.9822 },
    'Valenzuela City': { lat: 14.6969, lng: 120.9822 },
    
    // Cebu
    'Cebu City': { lat: 10.3157, lng: 123.8854 },
    'Cebu': { lat: 10.3157, lng: 123.8854 },
    'Cordova': { lat: 10.2531, lng: 123.9494 },
    'Lapu-Lapu': { lat: 10.3103, lng: 123.9494 },
    'Lapu-Lapu City': { lat: 10.3103, lng: 123.9494 },
    'Lapulapu': { lat: 10.3103, lng: 123.9494 },
    'Lapulapu City': { lat: 10.3103, lng: 123.9494 },
    'Mandaue': { lat: 10.3333, lng: 123.9333 },
    'Mandaue City': { lat: 10.3333, lng: 123.9333 },
    'Talisay': { lat: 10.2447, lng: 123.8425 },
    'Talisay City': { lat: 10.2447, lng: 123.8425 },
    'Toledo': { lat: 10.3833, lng: 123.6500 },
    'Toledo City': { lat: 10.3833, lng: 123.6500 },
    
    // Davao
    'Davao City': { lat: 7.1907, lng: 125.4553 },
    'Davao': { lat: 7.1907, lng: 125.4553 },
    
    // Other Major Cities
    'Cagayan de Oro': { lat: 8.4542, lng: 124.6319 },
    'Cagayan de Oro City': { lat: 8.4542, lng: 124.6319 },
    'Iloilo City': { lat: 10.7202, lng: 122.5621 },
    'Iloilo': { lat: 10.7202, lng: 122.5621 },
    'Bacolod': { lat: 10.6407, lng: 122.9689 },
    'Bacolod City': { lat: 10.6407, lng: 122.9689 },
    'Zamboanga City': { lat: 6.9214, lng: 122.0790 },
    'Zamboanga': { lat: 6.9214, lng: 122.0790 },
    'Antipolo': { lat: 14.6255, lng: 121.1245 },
    'Antipolo City': { lat: 14.6255, lng: 121.1245 },
    'Cabanatuan': { lat: 15.4869, lng: 120.9675 },
    'Cabanatuan City': { lat: 15.4869, lng: 120.9675 },
    
    // Provinces (center coordinates)
    'Metro Manila': { lat: 14.5995, lng: 120.9842 },
    'Cebu': { lat: 10.3157, lng: 123.8854 },
    'Nueva Ecija': { lat: 15.4869, lng: 120.9675 },
    'Laguna': { lat: 14.2667, lng: 121.4167 },
    'Cavite': { lat: 14.4793, lng: 120.8969 },
    'Rizal': { lat: 14.6255, lng: 121.1245 },
    'Bulacan': { lat: 14.7944, lng: 120.8792 },
    'Pampanga': { lat: 15.0667, lng: 120.6667 },
    'Bataan': { lat: 14.6833, lng: 120.4500 },
    'Zambales': { lat: 15.1667, lng: 120.0000 },
    'Tarlac': { lat: 15.4869, lng: 120.5986 },
    'Pangasinan': { lat: 15.9167, lng: 120.3333 },
    'La Union': { lat: 16.5000, lng: 120.3333 },
    'Ilocos Sur': { lat: 17.3333, lng: 120.5000 },
    'Ilocos Norte': { lat: 18.1667, lng: 120.7500 },
    'Abra': { lat: 17.5833, lng: 120.7500 },
    'Benguet': { lat: 16.5000, lng: 120.7500 },
    'Ifugao': { lat: 16.8333, lng: 121.1667 },
    'Kalinga': { lat: 17.4167, lng: 121.4167 },
    'Mountain Province': { lat: 17.0833, lng: 121.0000 },
    'Apayao': { lat: 18.0000, lng: 121.1667 },
    'Isabela': { lat: 17.0000, lng: 121.7500 },
    'Nueva Vizcaya': { lat: 16.5000, lng: 121.2500 },
    'Quirino': { lat: 16.2500, lng: 121.5000 },
    'Aurora': { lat: 15.7500, lng: 121.5000 },
    'Batanes': { lat: 20.4167, lng: 121.9167 },
    'Cagayan': { lat: 18.0000, lng: 121.7500 },
    'Albay': { lat: 13.2500, lng: 123.7500 },
    'Camarines Norte': { lat: 14.0000, lng: 122.7500 },
    'Camarines Sur': { lat: 13.5000, lng: 123.2500 },
    'Catanduanes': { lat: 13.7500, lng: 124.2500 },
    'Masbate': { lat: 12.2500, lng: 123.5000 },
    'Sorsogon': { lat: 12.7500, lng: 123.9167 },
    'Marinduque': { lat: 13.4167, lng: 121.9167 },
    'Occidental Mindoro': { lat: 13.0000, lng: 120.7500 },
    'Oriental Mindoro': { lat: 13.0000, lng: 121.2500 },
    'Palawan': { lat: 9.8333, lng: 118.7500 },
    'Romblon': { lat: 12.5833, lng: 122.2500 },
    'Aklan': { lat: 11.6667, lng: 122.3333 },
    'Antique': { lat: 11.0000, lng: 122.0000 },
    'Capiz': { lat: 11.5833, lng: 122.7500 },
    'Guimaras': { lat: 10.5833, lng: 122.5833 },
    'Negros Occidental': { lat: 10.6407, lng: 122.9689 },
    'Negros Oriental': { lat: 9.7500, lng: 123.0000 },
    'Siquijor': { lat: 9.1667, lng: 123.5833 },
    'Bohol': { lat: 9.8333, lng: 124.1667 },
    'Camiguin': { lat: 9.1667, lng: 124.7500 },
    'Misamis Occidental': { lat: 8.2500, lng: 123.7500 },
    'Misamis Oriental': { lat: 8.7500, lng: 124.7500 },
    'Lanao del Norte': { lat: 8.0000, lng: 124.0000 },
    'Lanao del Sur': { lat: 7.8333, lng: 124.2500 },
    'Bukidnon': { lat: 7.9167, lng: 125.0833 },
    'Davao del Norte': { lat: 7.5000, lng: 125.7500 },
    'Davao del Sur': { lat: 6.7500, lng: 125.2500 },
    'Davao Oriental': { lat: 7.2500, lng: 126.2500 },
    'Compostela Valley': { lat: 7.5000, lng: 125.9167 },
    'Davao de Oro': { lat: 7.5000, lng: 125.9167 },
    'Cotabato': { lat: 7.2500, lng: 125.0000 },
    'North Cotabato': { lat: 7.2500, lng: 125.0000 },
    'South Cotabato': { lat: 6.2500, lng: 124.9167 },
    'Sultan Kudarat': { lat: 6.5000, lng: 124.7500 },
    'Sarangani': { lat: 5.9167, lng: 125.2500 },
    'Maguindanao': { lat: 7.0000, lng: 124.2500 },
    'Lanao del Sur': { lat: 7.8333, lng: 124.2500 },
    'Basilan': { lat: 6.5000, lng: 122.0000 },
    'Sulu': { lat: 6.0000, lng: 121.0000 },
    'Tawi-Tawi': { lat: 5.2500, lng: 120.0000 }
};

// Function to get coordinates for a city/province
const getCityCoordinates = (city, province) => {
    // Try exact city match first
    if (cityCoordinates[city]) {
        return cityCoordinates[city];
    }
    
    // Try city with "City" suffix
    if (cityCoordinates[city + ' City']) {
        return cityCoordinates[city + ' City'];
    }
    
    // Try province as fallback
    if (cityCoordinates[province]) {
        return cityCoordinates[province];
    }
    
    // Default to Manila if no match
    console.log(`⚠️ No coordinates found for ${city}, ${province} - using Manila default`);
    return { lat: 14.5995, lng: 120.9842 };
};

// Function to update addresses with predefined coordinates
const updateAddressesWithPredefinedCoordinates = async () => {
    let connection;
    
    try {
        console.log('🚀 Updating addresses with predefined coordinates...');
        
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

        let updatedCount = 0;

        for (const address of addresses) {
            console.log(`\n📍 Processing: ${address.cityVillage}, ${address.province}`);
            
            // Get coordinates for the city/province
            const coordinates = getCityCoordinates(address.cityVillage, address.province);
            
            // Update the address with coordinates
            await connection.execute(`
                UPDATE addresses 
                SET latitude = ?, longitude = ?
                WHERE address_id = ?
            `, [coordinates.lat, coordinates.lng, address.address_id]);
            
            console.log(`✅ Updated address ${address.address_id} with coordinates: ${coordinates.lat}, ${coordinates.lng}`);
            updatedCount++;
        }

        // Verify the updates
        const [updatedAddresses] = await connection.execute(`
            SELECT address_id, cityVillage, province, latitude, longitude
            FROM addresses 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        `);

        console.log(`\n✅ Successfully updated ${updatedCount} addresses with coordinates`);
        console.log(`📊 Total addresses with coordinates: ${updatedAddresses.length}`);
        
        // Show some examples
        console.log('\n📍 Sample updated addresses:');
        updatedAddresses.slice(0, 10).forEach(addr => {
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
updateAddressesWithPredefinedCoordinates();
