const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        console.log('🚀 Starting Exact GPS Coordinates Migration...\n');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Connected to database\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_exact_vendor_gps_coordinates.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        console.log('📄 Executing migration: add_exact_vendor_gps_coordinates.sql\n');

        // Execute the migration
        await connection.query(migrationSQL);

        console.log('✅ Migration executed successfully!\n');

        // Verify the changes
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM vendors 
            WHERE Field IN ('exact_latitude', 'exact_longitude', 'location_accuracy', 'location_set_at')
        `);

        console.log('📊 New columns added to vendors table:');
        columns.forEach(col => {
            console.log(`   ✓ ${col.Field} (${col.Type}) - ${col.Comment || 'No comment'}`);
        });

        // Check current vendor location status
        const [vendors] = await connection.query(`
            SELECT 
                COUNT(*) as total_vendors,
                SUM(CASE WHEN exact_latitude IS NOT NULL AND exact_longitude IS NOT NULL THEN 1 ELSE 0 END) as vendors_with_exact_location,
                SUM(CASE WHEN location_accuracy = 'approximate' THEN 1 ELSE 0 END) as vendors_with_approximate_location,
                SUM(CASE WHEN location_accuracy = 'none' THEN 1 ELSE 0 END) as vendors_with_no_location
            FROM vendors
            WHERE status = 'approved'
        `);

        console.log('\n📍 Vendor Location Status:');
        console.log(`   Total approved vendors: ${vendors[0].total_vendors}`);
        console.log(`   Vendors with exact GPS: ${vendors[0].vendors_with_exact_location}`);
        console.log(`   Vendors with approximate location: ${vendors[0].vendors_with_approximate_location}`);
        console.log(`   Vendors with no location: ${vendors[0].vendors_with_no_location}`);

        console.log('\n✅ Migration completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Deploy backend API endpoint for setting exact location');
        console.log('   2. Add frontend component for vendors to set their location');
        console.log('   3. Update map display to show exact locations\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Error code:', error.code);
        console.error('Error errno:', error.errno);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
runMigration();

