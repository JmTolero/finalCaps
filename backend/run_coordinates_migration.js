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

        // Read migration file
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(__dirname, 'migrations', 'add_coordinates_to_addresses.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => {
                // Filter out empty statements and comments
                const trimmed = stmt.trim();
                return trimmed.length > 0 && 
                       !trimmed.startsWith('--') && 
                       !trimmed.startsWith('/*') &&
                       trimmed !== '';
            });

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                await connection.execute(statement);
            }
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
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

// Run the migration
runCoordinatesMigration();
