const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function checkStoreImages() {
  let connection;
  
  const dbConfig = {
    host: process.env.DB_HOST || 'maglev.proxy.rlwy.net',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'VaaDzRgKSOcxWaFTtmOMFKhOpAjEzUMi',
    port: parseInt(process.env.DB_PORT || '55748', 10),
    database: 'chill_db2'
  };
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database: chill_db2\n');
    
    // Check table structure
    console.log('📋 STRUCTURE OF store_images TABLE:');
    console.log('='.repeat(60));
    const [columns] = await connection.execute('DESCRIBE store_images');
    columns.forEach(col => {
      console.log(`   ${col.Field.padEnd(30)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key}`);
    });
    
    // Check row count
    console.log('\n📊 ROW COUNT:');
    console.log('='.repeat(60));
    const [count] = await connection.execute('SELECT COUNT(*) as count FROM store_images');
    console.log(`   Total rows: ${count[0].count}`);
    
    // Show sample data if any exists
    if (count[0].count > 0) {
      console.log('\n📝 SAMPLE DATA (first 5 rows):');
      console.log('='.repeat(60));
      const [rows] = await connection.execute('SELECT * FROM store_images LIMIT 5');
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log('\n⚠️  Table is empty (no data)');
    }
    
    // Check for foreign keys or relationships
    console.log('\n🔗 FOREIGN KEYS / RELATIONSHIPS:');
    console.log('='.repeat(60));
    const [fks] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'chill_db2'
        AND TABLE_NAME = 'store_images'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (fks.length > 0) {
      fks.forEach(fk => {
        console.log(`   ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('   No foreign keys found');
    }
    
    await connection.end();
    console.log('\n✅ Check completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkStoreImages();


