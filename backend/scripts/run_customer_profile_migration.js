const fs = require('fs');
const path = require('path');
const pool = require('./src/db/config');

async function runMigration() {
  try {
    console.log('🔄 Running customer profile image migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '023_add_customer_profile_image.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        await pool.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📸 Customers can now upload profile pictures');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

