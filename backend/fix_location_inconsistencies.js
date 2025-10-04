const mysql = require('mysql2/promise');
require('dotenv').config();

const fixLocationInconsistencies = async () => {
    let connection;
    
    try {
        console.log('🔧 Fixing location inconsistencies...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Find vendors with coordinate/location mismatches
        const [inconsistentVendors] = await connection.execute(`
            SELECT 
                v.vendor_id,
                v.store_name,
                a.address_id,
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

        console.log(`\n📊 Found ${inconsistentVendors.length} vendors with coordinates`);

        // Define coordinate-to-location mapping
        const coordinateMapping = {
            '14.59950000,120.98420000': { city: 'Manila', province: 'Metro Manila' },
            '14.55470000,121.02440000': { city: 'Makati', province: 'Metro Manila' },
            '14.67600000,121.04370000': { city: 'Quezon City', province: 'Metro Manila' },
            '14.57640000,121.08510000': { city: 'Pasig', province: 'Metro Manila' },
            '10.25310000,123.94940000': { city: 'Cordova', province: 'Cebu' },
            '15.48690000,120.96750000': { city: 'Cabanatuan', province: 'Nueva Ecija' }
        };

        let fixedCount = 0;

        for (const vendor of inconsistentVendors) {
            const coordKey = `${vendor.latitude},${vendor.longitude}`;
            const correctLocation = coordinateMapping[coordKey];
            
            if (correctLocation) {
                const currentLocation = `${vendor.cityVillage}, ${vendor.province}`;
                const correctLocationText = `${correctLocation.city}, ${correctLocation.province}`;
                
                // Check if location text matches coordinates
                if (currentLocation !== correctLocationText) {
                    console.log(`\n🔧 Fixing ${vendor.store_name || 'Unnamed'} (ID: ${vendor.vendor_id})`);
                    console.log(`   Current: ${currentLocation}`);
                    console.log(`   Correct: ${correctLocationText}`);
                    console.log(`   Coordinates: ${vendor.latitude}, ${vendor.longitude}`);
                    
                    // Update the address with correct city/province
                    await connection.execute(`
                        UPDATE addresses 
                        SET cityVillage = ?, province = ?
                        WHERE address_id = ?
                    `, [correctLocation.city, correctLocation.province, vendor.address_id]);
                    
                    console.log(`   ✅ Fixed!`);
                    fixedCount++;
                } else {
                    console.log(`✅ ${vendor.store_name || 'Unnamed'} (ID: ${vendor.vendor_id}) - Location matches coordinates`);
                }
            } else {
                console.log(`⚠️ Unknown coordinates for ${vendor.store_name || 'Unnamed'}: ${vendor.latitude}, ${vendor.longitude}`);
            }
        }

        console.log(`\n🎉 Fixed ${fixedCount} location inconsistencies!`);

        // Verify the fixes
        const [verifiedVendors] = await connection.execute(`
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
            ORDER BY a.cityVillage, a.province
        `);

        console.log(`\n📍 Verified vendor locations:`);
        verifiedVendors.forEach(vendor => {
            console.log(`   - ${vendor.store_name || 'Unnamed'}: ${vendor.cityVillage}, ${vendor.province} (${vendor.latitude}, ${vendor.longitude})`);
        });

    } catch (error) {
        console.error('❌ Error fixing location inconsistencies:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

// Run the fix
fixLocationInconsistencies();
