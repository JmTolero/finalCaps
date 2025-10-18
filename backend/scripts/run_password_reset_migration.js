const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runPasswordResetMigration() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'chill_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database successfully');

        // Read the migration file
        const migrationPath = path.join(__dirname, '../migrations/create_password_reset_tokens.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Reading migration file...');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`🔄 Executing ${statements.length} SQL statements...`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                console.log(`   ${i + 1}. Executing statement...`);
                await connection.execute(statement);
            }
        }

        console.log('✅ Password reset tokens table created successfully!');
        console.log('🎉 Migration completed successfully!');

        // Verify the table was created
        const [tables] = await connection.execute("SHOW TABLES LIKE 'password_reset_tokens'");
        if (tables.length > 0) {
            console.log('✅ Verification: password_reset_tokens table exists');
            
            // Show table structure
            const [columns] = await connection.execute("DESCRIBE password_reset_tokens");
            console.log('📋 Table structure:');
            columns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
            });
        } else {
            console.log('❌ Verification failed: password_reset_tokens table not found');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
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
runPasswordResetMigration();
