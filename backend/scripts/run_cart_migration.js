const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chill_db',
    multipleStatements: true
};

async function runCartMigration() {
    let connection;
    
    try {
        console.log('🛒 Starting cart system migration...');
        
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_cart_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Running cart system migration...');
        
        // Execute migration
        await connection.execute(migrationSQL);
        console.log('✅ Cart system migration completed successfully');
        
        // Verify table creation
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'cart_items'"
        );
        
        if (tables.length > 0) {
            console.log('✅ cart_items table created successfully');
            
            // Show table structure
            const [structure] = await connection.execute('DESCRIBE cart_items');
            console.log('📋 cart_items table structure:');
            structure.forEach(column => {
                console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
            });
        } else {
            console.log('❌ cart_items table not found');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    runCartMigration()
        .then(() => {
            console.log('🎉 Cart system migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { runCartMigration };
