const fs = require('fs');
const path = require('path');
const pool = require('./src/db/config');

async function runFeedbackMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting feedback table migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '024_create_feedback_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Running migration: 024_create_feedback_table.sql');
    
    // Run migration
    await client.query(migrationSQL);
    
    console.log('✅ Feedback table migration completed successfully!\n');
    console.log('📊 The following has been created:');
    console.log('   - feedback table with all necessary columns');
    console.log('   - Indexes for performance optimization');
    console.log('   - Support for customer and vendor feedback');
    console.log('   - Admin response and tracking system\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runFeedbackMigration();

