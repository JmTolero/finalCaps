const mysql = require('mysql2/promise');
require('dotenv').config();

async function addExactCoordinateColumns() {
    let connection;
    try {
        console.log('🔧 Adding exact coordinate columns to addresses table...');
        
        // Create database connection using same config as backend
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Read and execute the SQL file
        const fs = require('fs');
        const sqlContent = fs.readFileSync('./add_exact_columns.sql', 'utf8');
        
        console.log('📄 Executing SQL...');
        await connection.execute(sqlContent);
        
        console.log('✅ Exact coordinate columns added successfully!');
        
        // Verify the columns exist
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM addresses 
            WHERE Field IN ('exact_latitude', 'exact_longitude', 'coordinate_accuracy', 'coordinate_source', 'coordinate_updated_at')
        `);
        
        console.log('📊 Added columns:');
        columns.forEach(col => {
            console.log(`   ✓ ${col.Field} (${col.Type})`);
        });

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('✅ Columns already exist, skipping...');
        } else {
            console.error('❌ Error adding columns:', error.message);
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

addExactCoordinateColumns().catch(console.error);
