const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    let connection;
    
    try {
        // Create connection using the same config as your app
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Add your MySQL password here if needed
            database: 'chill_db'
        });

        console.log('Connected to MySQL database');

        // Read the migration file
        const migrationFile = process.argv[2] || 'add_user_status_field.sql';
        const migrationPath = path.join(__dirname, 'migrations', migrationFile);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 50) + '...');
                try {
                    await connection.execute(statement);
                    console.log('✓ Success');
                } catch (error) {
                    if (error.code === 'ER_DUP_FIELDNAME') {
                        console.log('✓ Column already exists, skipping...');
                    } else {
                        console.log('✗ Error:', error.message);
                        throw error;
                    }
                }
            }
        }

        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        
        // If the column already exists, that's okay
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Status column already exists, continuing...');
        } else {
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration().catch(console.error);
