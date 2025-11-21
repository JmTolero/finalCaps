const pool = require('../src/db/config');

(async () => {
  try {
    console.log('🔧 Fixing payment_intents status column...');
    
    // Check current ENUM values
    const [columns] = await pool.query("SHOW COLUMNS FROM payment_intents WHERE Field = 'status'");
    console.log('Current status column:', columns[0]);
    
    // Update ENUM to include Xendit values (no duplicates)
    await pool.query(`
      ALTER TABLE payment_intents 
      MODIFY COLUMN status ENUM(
        'awaiting_payment_method', 
        'awaiting_next_action', 
        'processing', 
        'succeeded', 
        'failed', 
        'cancelled',
        'PENDING',
        'PAID',
        'EXPIRED'
      ) DEFAULT 'awaiting_payment_method'
    `);
    
    console.log('✅ Status column updated successfully!');
    
    // Verify the change
    const [newColumns] = await pool.query("SHOW COLUMNS FROM payment_intents WHERE Field = 'status'");
    console.log('Updated status column:', newColumns[0]);
    
    console.log('🎉 Database migration completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
