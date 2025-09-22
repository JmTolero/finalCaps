const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Update with your MySQL password
    database: 'chill_db', // Using the correct database name from memory
    multipleStatements: true
};

async function runMigration() {
    let connection;
    
    try {
        console.log('🔄 Starting vendor notification migration...');
        
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_vendor_notification_types.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration
        console.log('🔄 Executing migration...');
        await connection.execute(migrationSQL);
        
        console.log('✅ Migration completed successfully!');
        console.log('📋 New features added:');
        console.log('   - vendor_approved notification type');
        console.log('   - vendor_rejected notification type');
        console.log('   - vendor_return_available notification type');
        console.log('   - vendor_rejections table for auto-return tracking');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('🎉 Migration process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration process failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigration };
