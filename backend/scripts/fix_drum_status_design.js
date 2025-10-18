const mysql = require('mysql2/promise');

async function fixDrumStatusDesign() {
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

        // Step 1: Remove the drum_status column from orders table
        console.log('Removing drum_status column from orders table...');
        try {
            await connection.execute(`
                ALTER TABLE orders DROP COLUMN drum_status
            `);
            console.log('✅ Removed drum_status column from orders table');
        } catch (error) {
            if (error.message.includes("doesn't exist")) {
                console.log('ℹ️  drum_status column was not in orders table');
            } else {
                throw error;
            }
        }

        // Step 2: Remove the return_requested_at column from orders table
        console.log('Removing return_requested_at column from orders table...');
        try {
            await connection.execute(`
                ALTER TABLE orders DROP COLUMN return_requested_at
            `);
            console.log('✅ Removed return_requested_at column from orders table');
        } catch (error) {
            if (error.message.includes("doesn't exist")) {
                console.log('ℹ️  return_requested_at column was not in orders table');
            } else {
                throw error;
            }
        }

        // Step 3: Ensure drum_stats table has the correct values
        console.log('Setting up drum_stats table...');
        
        // Insert the standard drum status values
        await connection.execute(`
            INSERT IGNORE INTO drum_stats (drum_status_id, status_name) VALUES 
            (1, 'in use'),
            (2, 'not returned'), 
            (3, 'returned')
        `);
        console.log('✅ drum_stats table populated with standard values');

        // Step 4: Add return_requested_at to order_items table
        console.log('Adding return_requested_at column to order_items table...');
        try {
            await connection.execute(`
                ALTER TABLE order_items 
                ADD COLUMN IF NOT EXISTS return_requested_at DATETIME NULL
            `);
            console.log('✅ Added return_requested_at column to order_items table');
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) {
                throw error;
            }
            console.log('ℹ️  return_requested_at column already exists in order_items table');
        }

        // Step 5: Set default drum_status_id for existing order_items
        console.log('Setting default drum_status_id for existing order_items...');
        const [result] = await connection.execute(`
            UPDATE order_items 
            SET drum_status_id = 1 
            WHERE drum_status_id IS NULL
        `);
        console.log(`✅ Updated ${result.affectedRows} order_items with default drum status`);

        console.log('🎉 Drum status design fixed successfully!');
        console.log('');
        console.log('📋 Summary of changes:');
        console.log('   - Removed drum_status from orders table');
        console.log('   - Using drum_stats table as intended');
        console.log('   - order_items.drum_status_id references drum_stats');
        console.log('   - Added return_requested_at to order_items table');

    } catch (error) {
        console.error('❌ Fix failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the fix
fixDrumStatusDesign()
    .then(() => {
        console.log('Fix script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fix script failed:', error);
        process.exit(1);
    });
