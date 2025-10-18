const mysql = require('mysql2/promise');
require('dotenv').config();

const addSampleCoordinates = async () => {
    let connection;
    
    try {
        console.log('🚀 Adding sample coordinates to existing vendors...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Check existing vendors
        const [vendors] = await connection.execute(`
            SELECT v.vendor_id, v.store_name, a.address_id, a.cityVillage, a.province
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved'
        `);

        console.log(`📊 Found ${vendors.length} approved vendors`);

        if (vendors.length === 0) {
            console.log('ℹ️ No approved vendors found. Creating sample vendor with coordinates...');
            
            // Create a sample vendor with coordinates
            await connection.execute(`
                INSERT INTO addresses (
                    street_name, barangay, cityVillage, province, region, 
                    postal_code, latitude, longitude, address_type
                ) VALUES (
                    'Sample Street', 'Sample Barangay', 'Manila', 'Metro Manila', 'NCR',
                    '1000', 14.5995, 120.9842, 'business'
                )
            `);

            const [addressResult] = await connection.execute(`
                SELECT address_id FROM addresses 
                WHERE cityVillage = 'Manila' AND latitude = 14.5995
                ORDER BY address_id DESC LIMIT 1
            `);

            if (addressResult.length > 0) {
                const addressId = addressResult[0].address_id;
                
                // Create sample user
                await connection.execute(`
                    INSERT INTO users (fname, lname, username, password, email, role, status)
                    VALUES ('Sample', 'Vendor', 'samplevendor', 'password123', 'sample@vendor.com', 'vendor', 'active')
                `);

                const [userResult] = await connection.execute(`
                    SELECT user_id FROM users WHERE username = 'samplevendor'
                `);

                if (userResult.length > 0) {
                    const userId = userResult[0].user_id;
                    
                    // Create sample vendor
                    await connection.execute(`
                        INSERT INTO vendors (user_id, store_name, status, primary_address_id)
                        VALUES (?, 'Sample Ice Cream Shop', 'approved', ?)
                    `, [userId, addressId]);

                    console.log('✅ Sample vendor created with coordinates');
                }
            }
        } else {
            // Update existing vendors with sample coordinates
            const sampleCoordinates = [
                { city: 'Manila', lat: 14.5995, lng: 120.9842 },
                { city: 'Quezon City', lat: 14.6760, lng: 121.0437 },
                { city: 'Makati', lat: 14.5547, lng: 121.0244 },
                { city: 'Cebu City', lat: 10.3157, lng: 123.8854 },
                { city: 'Davao City', lat: 7.1907, lng: 125.4553 }
            ];

            for (let i = 0; i < vendors.length && i < sampleCoordinates.length; i++) {
                const vendor = vendors[i];
                const coords = sampleCoordinates[i];
                
                if (vendor.address_id) {
                    await connection.execute(`
                        UPDATE addresses 
                        SET latitude = ?, longitude = ?
                        WHERE address_id = ?
                    `, [coords.lat, coords.lng, vendor.address_id]);
                    
                    console.log(`📍 Updated ${vendor.store_name} with coordinates: ${coords.lat}, ${coords.lng}`);
                }
            }
        }

        // Verify the updates
        const [updatedVendors] = await connection.execute(`
            SELECT v.vendor_id, v.store_name, a.latitude, a.longitude, a.cityVillage
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved' AND a.latitude IS NOT NULL
        `);

        console.log(`\n✅ Updated ${updatedVendors.length} vendors with coordinates:`);
        updatedVendors.forEach(vendor => {
            console.log(`   - ${vendor.store_name}: ${vendor.latitude}, ${vendor.longitude} (${vendor.cityVillage})`);
        });

    } catch (error) {
        console.error('❌ Error adding sample coordinates:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

// Run the script
addSampleCoordinates();
