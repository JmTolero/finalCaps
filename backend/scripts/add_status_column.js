const mysql = require('mysql2/promise');

async function addStatusColumn() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Add your MySQL password here if needed
            database: 'chill_db'
        });

        console.log('Connected to MySQL database');

        // Check if status column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'chill_db' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'status'
        `);

        if (columns.length > 0) {
            console.log('✓ Status column already exists');
        } else {
            console.log('Adding status column to users table...');
            
            // Add the status column
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN status ENUM('active', 'inactive', 'suspended') 
                DEFAULT 'active' 
                AFTER role
            `);
            console.log('✓ Status column added successfully');

            // Add index
            await connection.execute(`
                CREATE INDEX idx_users_status ON users(status)
            `);
            console.log('✓ Index created successfully');

            // Update existing users
            await connection.execute(`
                UPDATE users SET status = 'active' WHERE status IS NULL
            `);
            console.log('✓ Existing users updated to active status');
        }

        // Verify the column exists
        const [verifyColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'chill_db' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'status'
        `);

        if (verifyColumns.length > 0) {
            console.log('✓ Verification successful - status column exists:', verifyColumns[0]);
        } else {
            console.log('✗ Verification failed - status column not found');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Status column already exists, which is fine.');
        } else {
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addStatusColumn().catch(console.error);
