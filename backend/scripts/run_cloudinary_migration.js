// Migration script to increase URL column sizes for Cloudinary
require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
  console.log('🔄 Starting Cloudinary URL column migration...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('✅ Connected to database');

    // Update vendors table
    console.log('📝 Updating vendors table columns...');
    await connection.query(`
      ALTER TABLE vendors 
      MODIFY COLUMN business_permit_url VARCHAR(500),
      MODIFY COLUMN valid_id_url VARCHAR(500),
      MODIFY COLUMN proof_image_url VARCHAR(500),
      MODIFY COLUMN profile_image_url VARCHAR(500)
    `);
    console.log('✅ Vendors table updated');

    // Update flavors table
    console.log('📝 Updating flavors table columns...');
    await connection.query(`
      ALTER TABLE flavors 
      MODIFY COLUMN image_urls TEXT
    `);
    console.log('✅ Flavors table updated');

    // Verify changes
    console.log('\n📊 Verifying column sizes:');
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM vendors LIKE '%_url'
    `);
    
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ Cloudinary URLs will now work properly');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();

