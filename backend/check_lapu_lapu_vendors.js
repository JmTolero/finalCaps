const pool = require('./src/db/config');

async function checkLapuLapuVendors() {
    try {
        console.log('🔍 Checking for Lapu-Lapu vendors...\n');

        // Check all vendors
        const [allVendors] = await pool.query(`
            SELECT v.vendor_id, v.store_name, v.status, v.primary_address_id
            FROM vendors v
        `);
        console.log(`📊 Total vendors in database: ${allVendors.length}`);
        console.log('Vendors:', allVendors);
        console.log('\n');

        // Check approved vendors
        const [approvedVendors] = await pool.query(`
            SELECT v.vendor_id, v.store_name, v.status
            FROM vendors v
            WHERE v.status = 'approved'
        `);
        console.log(`✅ Approved vendors: ${approvedVendors.length}`);
        console.log('Approved:', approvedVendors);
        console.log('\n');

        // Check vendors with addresses
        const [vendorsWithAddresses] = await pool.query(`
            SELECT 
                v.vendor_id, 
                v.store_name, 
                v.status,
                a.cityVillage,
                a.province,
                a.latitude,
                a.longitude
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved'
        `);
        console.log(`🏠 Approved vendors with addresses: ${vendorsWithAddresses.length}`);
        console.log('With addresses:', vendorsWithAddresses);
        console.log('\n');

        // Check for Lapu-Lapu specifically (case-insensitive)
        const [lapuLapuVendors] = await pool.query(`
            SELECT 
                v.vendor_id, 
                v.store_name, 
                v.status,
                a.cityVillage,
                a.province
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE v.status = 'approved'
            AND a.cityVillage LIKE '%lapu%'
        `);
        console.log(`🏙️ Lapu-Lapu vendors: ${lapuLapuVendors.length}`);
        console.log('Lapu-Lapu vendors:', lapuLapuVendors);
        console.log('\n');

        // Check vendors with published flavors
        const [vendorsWithFlavors] = await pool.query(`
            SELECT 
                v.vendor_id, 
                v.store_name,
                a.cityVillage,
                COUNT(f.flavor_id) as flavor_count
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            LEFT JOIN flavors f ON v.vendor_id = f.vendor_id AND f.store_status = 'published'
            WHERE v.status = 'approved'
            GROUP BY v.vendor_id, v.store_name, a.cityVillage
        `);
        console.log(`🍦 Vendors with published flavors:`);
        console.log(vendorsWithFlavors);
        console.log('\n');

        // Check what city names exist in addresses
        const [cityNames] = await pool.query(`
            SELECT DISTINCT a.cityVillage, COUNT(*) as count
            FROM addresses a
            INNER JOIN vendors v ON a.address_id = v.primary_address_id
            WHERE a.cityVillage IS NOT NULL AND a.cityVillage != ''
            GROUP BY a.cityVillage
        `);
        console.log(`📍 Unique city names in vendor addresses:`);
        console.log(cityNames);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkLapuLapuVendors();
