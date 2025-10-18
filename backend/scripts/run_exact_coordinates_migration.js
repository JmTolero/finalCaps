const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runExactCoordinatesMigration() {
    let connection;
    
    try {
        // Create connection using the same config as your app
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db'
        });

        console.log('Connected to MySQL database');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_exact_coordinates.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 80) + '...');
                try {
                    await connection.execute(statement);
                    console.log('✓ Success');
                } catch (error) {
                    if (error.code === 'ER_DUP_FIELDNAME') {
                        console.log('✓ Column already exists, skipping...');
                    } else if (error.code === 'ER_DUP_KEYNAME') {
                        console.log('✓ Index already exists, skipping...');
                    } else {
                        console.log('✗ Error:', error.message);
                        throw error;
                    }
                }
            }
        }

        console.log('✅ Exact coordinates migration completed successfully!');
        
        // Verify the migration
        console.log('\n🔍 Verifying migration...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'addresses' 
            AND COLUMN_NAME IN ('exact_latitude', 'exact_longitude', 'coordinate_accuracy', 'coordinate_source')
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || 'chill_db']);
        
        console.log('📋 Added columns:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
        });
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runExactCoordinatesMigration().catch(console.error);
