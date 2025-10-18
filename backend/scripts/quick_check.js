const mysql = require('mysql2/promise');

async function quickCheck() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'chill_db'
    });
    
    console.log('✅ Connected to database');
    
    // Check rejected vendors
    const [v] = await connection.execute('SELECT vendor_id, store_name, status FROM vendors WHERE status = "rejected"');
    console.log(`Found ${v.length} rejected vendors:`, v);
    
    // Check vendor_rejections
    const [r] = await connection.execute('SELECT vendor_id, auto_return_at, is_returned FROM vendor_rejections');
    console.log(`Found ${r.length} rejection records:`, r);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
  
  process.exit(0);
}

quickCheck();
