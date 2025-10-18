const mysql = require('mysql2/promise');
require('dotenv').config();

const checkVendorAddressLinks = async () => {
    let connection;
    
    try {
        console.log('🔍 Checking vendor-address relationships...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Check vendors and their address links
        const [vendors] = await connection.execute(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.primary_address_id,
                a.address_id,
                a.cityVillage,
                a.province,
                a.latitude,
                a.longitude
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved'
            ORDER BY v.vendor_id
        `);

        console.log(`\n📊 Vendor-Address Relationship Analysis:`);
        console.log(`Total approved vendors: ${vendors.length}`);

        let vendorsWithAddresses = 0;
        let vendorsWithCoordinates = 0;
        let vendorsWithoutAddresses = 0;

        vendors.forEach(vendor => {
            if (vendor.primary_address_id && vendor.address_id) {
                vendorsWithAddresses++;
                if (vendor.latitude && vendor.longitude) {
                    vendorsWithCoordinates++;
                    console.log(`✅ ${vendor.store_name || 'Unnamed'} (ID: ${vendor.vendor_id}) - ${vendor.cityVillage}, ${vendor.province} - ${vendor.latitude}, ${vendor.longitude}`);
                } else {
                    console.log(`⚠️ ${vendor.store_name || 'Unnamed'} (ID: ${vendor.vendor_id}) - ${vendor.cityVillage}, ${vendor.province} - NO COORDINATES`);
                }
            } else {
                vendorsWithoutAddresses++;
                console.log(`❌ ${vendor.store_name || 'Unnamed'} (ID: ${vendor.vendor_id}) - NO ADDRESS LINK`);
            }
        });

        console.log(`\n📈 Summary:`);
        console.log(`✅ Vendors with addresses: ${vendorsWithAddresses}`);
        console.log(`📍 Vendors with coordinates: ${vendorsWithCoordinates}`);
        console.log(`❌ Vendors without addresses: ${vendorsWithoutAddresses}`);

        // Check if we need to link vendors to addresses
        if (vendorsWithoutAddresses > 0) {
            console.log(`\n🔧 Fixing vendor-address links...`);
            
            // Get addresses with coordinates
            const [addressesWithCoords] = await connection.execute(`
                SELECT address_id, cityVillage, province, latitude, longitude
                FROM addresses 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY address_id
            `);

            console.log(`Found ${addressesWithCoords.length} addresses with coordinates`);

            // Link vendors without addresses to available addresses
            const vendorsToFix = vendors.filter(v => !v.primary_address_id);
            let fixedCount = 0;

            for (let i = 0; i < vendorsToFix.length && i < addressesWithCoords.length; i++) {
                const vendor = vendorsToFix[i];
                const address = addressesWithCoords[i % addressesWithCoords.length]; // Cycle through addresses

                await connection.execute(`
                    UPDATE vendors 
                    SET primary_address_id = ?
                    WHERE vendor_id = ?
                `, [address.address_id, vendor.vendor_id]);

                console.log(`🔗 Linked ${vendor.store_name || 'Unnamed'} to ${address.cityVillage}, ${address.province}`);
                fixedCount++;
            }

            console.log(`✅ Fixed ${fixedCount} vendor-address links`);
        }

    } catch (error) {
        console.error('❌ Error checking vendor-address relationships:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

// Run the check
checkVendorAddressLinks();
