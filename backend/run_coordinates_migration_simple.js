const mysql = require('mysql2/promise');
require('dotenv').config();

const runCoordinatesMigration = async () => {
    let connection;
    
    try {
        console.log('🚀 Starting coordinates migration...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Execute SQL statements directly
        const statements = [
            'ALTER TABLE addresses ADD COLUMN latitude DECIMAL(10, 8) NULL',
            'ALTER TABLE addresses ADD COLUMN longitude DECIMAL(11, 8) NULL',
            'CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude)',
            'ALTER TABLE addresses COMMENT = "Addresses table with coordinate support for map functionality"'
        ];

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
            console.log(`   SQL: ${statement}`);
            await connection.execute(statement);
        }

        console.log('✅ Coordinates migration completed successfully!');
        console.log('📍 Added latitude and longitude columns to addresses table');
        console.log('🗺️ Map functionality is now ready for real coordinates');

        // Verify the changes
        console.log('\n🔍 Verifying migration...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'addresses' 
            AND COLUMN_NAME IN ('latitude', 'longitude')
        `, [process.env.DB_NAME || 'chill_db']);

        if (columns.length === 2) {
            console.log('✅ Migration verification successful!');
            console.log('📊 New columns:');
            columns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
            });
        } else {
            console.log('⚠️ Migration verification failed - columns not found');
            console.log(`Found ${columns.length} columns instead of 2`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ Columns already exist - migration may have been run before');
        }
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

// Run the migration
runCoordinatesMigration();
