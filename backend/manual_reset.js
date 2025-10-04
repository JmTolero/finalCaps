const mysql = require('mysql2/promise');

async function manualReset() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'chill_db'
    });
    
    console.log('🚀 MANUAL REVENDOR RESET...\n`);
    
    // Find a rejected vendor to reset
    const [rejectedVendor] = await connection.execute(
      'SELECT vendor_id, user_id, store_name FROM vendors WHERE status = "rejected" LIMIT 1'
    );
    
    if (rejectedVendor.length === 0) {
      console.log('❌ No rejected vendors found!');
      return;
    }
    
    const vendor = rejectedVendor[0];
    console.log(`🔍 Found vendor ${vendor.vendor_id}: "${vendor.store_name}"`);
    
    // Show before data
    console.log('\n📋 BEFORE RESET:');
    const [beforeData] = await connection.execute(
      'SELECT store_name, valid_id_url, business_permit_url, proof_image_url, status FROM vendors WHERE vendor_id = ?',
      [vendor.vendor_id]
    );
    console.log(beforeData[0]);
    
    // MANUAL RESET - wipe all data
    console.log('\n🧹 WIPING VENDOR DATA...');
    await connection.execute(
      `UPDATE vendors SET 
          status = 'pending',
          store_name = NULL,
          valid_id_url = NULL, 
          business_permit_url = NULL,
          proof_image_url = NULL,
          profile_image_url = NULL,
          primary_address_id = NULL,
          created_at = NOW()
       WHERE vendor_id = ?`,
      [vendor.vendor_id]
    );
    
    // Show after data
    console.log('\n✅ AFTER RESET:');
    const [afterData] = await connection.execute(
      'SELECT store_name, valid_id_url, business_permit_url, proof_image_url, status FROM vendors WHERE vendor_id = ?',
      [vendor.vendor_id]
    );
    console.log(afterData[0]);
    
    console.log('\n🎉 MANUAL RESET COMPLETE!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
  
  process.exit(0);
}

manualReset();
