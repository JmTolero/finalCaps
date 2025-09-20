const mysql = require('mysql2/promise');

async function runMigration() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Add password if needed
            database: 'chill_db'
        });

        console.log('Connected to database');

        // Add drum_status column to orders table
        console.log('Adding drum_status column...');
        await connection.execute(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS drum_status ENUM('in_use', 'return_requested', 'returned') DEFAULT 'in_use'
        `);

        // Add return_requested_at column to track when return was requested
        console.log('Adding return_requested_at column...');
        await connection.execute(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS return_requested_at DATETIME NULL
        `);

        // Add index for better query performance
        console.log('Adding index...');
        try {
            await connection.execute(`
                CREATE INDEX IF NOT EXISTS idx_orders_drum_status ON orders(drum_status)
            `);
        } catch (error) {
            if (!error.message.includes('Duplicate key name')) {
                throw error;
            }
            console.log('Index already exists');
        }

        // Update existing orders to have 'in_use' status for delivered orders
        console.log('Updating existing delivered orders...');
        const [result] = await connection.execute(`
            UPDATE orders 
            SET drum_status = 'in_use' 
            WHERE status = 'delivered' AND drum_status IS NULL
        `);
        
        console.log(`Updated ${result.affectedRows} existing orders`);

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('Migration script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
