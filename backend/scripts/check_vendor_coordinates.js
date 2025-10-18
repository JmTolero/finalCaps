const mysql = require('mysql2/promise');
require('dotenv').config();

const checkVendorCoordinates = async () => {
    let connection;
    
    try {
        console.log('🔍 Checking vendor coordinates in database...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Check vendors with coordinates
        const [vendorsWithCoords] = await connection.execute(`
            SELECT 
                v.vendor_id,
                v.store_name,
                a.cityVillage,
                a.province,
                a.latitude,
                a.longitude
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved'
            AND a.latitude IS NOT NULL 
            AND a.longitude IS NOT NULL
        `);

        // Check vendors without coordinates
        const [vendorsWithoutCoords] = await connection.execute(`
            SELECT 
                v.vendor_id,
                v.store_name,
                a.cityVillage,
                a.province,
                a.latitude,
                a.longitude
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved'
            AND (a.latitude IS NULL OR a.longitude IS NULL)
        `);

        console.log(`\n📊 Vendor Coordinate Status:`);
        console.log(`✅ Vendors WITH coordinates: ${vendorsWithCoords.length}`);
        console.log(`❌ Vendors WITHOUT coordinates: ${vendorsWithoutCoords.length}`);
        console.log(`📈 Total approved vendors: ${vendorsWithCoords.length + vendorsWithoutCoords.length}`);

        if (vendorsWithCoords.length > 0) {
            console.log(`\n📍 Vendors WITH coordinates:`);
            vendorsWithCoords.forEach(vendor => {
                console.log(`   - ${vendor.store_name || 'Unnamed'} (${vendor.cityVillage}, ${vendor.province}): ${vendor.latitude}, ${vendor.longitude}`);
            });
        }

        if (vendorsWithoutCoords.length > 0) {
            console.log(`\n❌ Vendors WITHOUT coordinates:`);
            vendorsWithoutCoords.forEach(vendor => {
                console.log(`   - ${vendor.store_name || 'Unnamed'} (${vendor.cityVillage || 'No city'}, ${vendor.province || 'No province'}): ${vendor.latitude || 'NULL'}, ${vendor.longitude || 'NULL'}`);
            });
        }

        // Check if addresses table has coordinates
        const [addressStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_addresses,
                COUNT(latitude) as addresses_with_lat,
                COUNT(longitude) as addresses_with_lng,
                COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as addresses_with_coords
            FROM addresses
        `);

        console.log(`\n🗄️ Address Table Statistics:`);
        console.log(`   Total addresses: ${addressStats[0].total_addresses}`);
        console.log(`   Addresses with latitude: ${addressStats[0].addresses_with_lat}`);
        console.log(`   Addresses with longitude: ${addressStats[0].addresses_with_lng}`);
        console.log(`   Addresses with both coordinates: ${addressStats[0].addresses_with_coords}`);

    } catch (error) {
        console.error('❌ Error checking vendor coordinates:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

// Run the check
checkVendorCoordinates();
