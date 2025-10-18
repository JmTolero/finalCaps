const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting vendor reviews migration...\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'icecreamdb',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_vendor_reviews_system.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Running migration file: add_vendor_reviews_system.sql\n');

    // Execute migration
    await connection.query(migrationSQL);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 What was created/modified:');
    console.log('  • vendor_reviews table (with order_id, vendor_id, customer_id, rating, comment)');
    console.log('  • vendors.average_rating column (DECIMAL(3,2))');
    console.log('  • vendors.total_reviews column (INT)');
    console.log('\n🎉 Vendor review system is ready to use!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

runMigration();
