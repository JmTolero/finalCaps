const mysql = require('mysql2/promise');

async function debugQuery() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'chill_db'
    });
    
    console.log('🔍 DEBUGGING AUTO-RESET QUERY CONDITIONS...\n');
    
    // Step 1: Check vendor_rejections table
    console.log('1️⃣ CHECKING vendor_rejections TABLE:');
    const [rejections] = await connection.execute('SELECT vendor_id, user_id, auto_return_at, is_returned FROM vendor_rejections ORDER BY rejected_at DESC');
    console.log(`   Found ${rejections.length} total rejection records:`);
    rejections.forEach(r => {
      const now = new Date();
      const returnTime = new Date(r.auto_return_at);
      const timeDiff = Math.floor((returnTime - now) / 1000);
      const ready = timeDiff <= 0 && !r.is_returned;
      console.log(`   - Vendor ${r.vendor_id}: auto_return=${r.auto_return_at}, is_returned=${r.is_returned}, ${ready ? '🟡 READY' : '⏰ NOT READY'} (${timeDiff}s away)`);
    });
    
    // Step 2: Check vendors table 
    console.log('\n2️⃣ CHECKING vendors TABLE:');
    const [vendors] = await connection.execute('SELECT vendor_id, user_id, status FROM vendors ORDER BY vendor_id DESC LIMIT 5');
    console.log(`   Found ${vendors.length} vendor records:`);
    vendors.forEach(v => {
      console.log(`   - Vendor ${v.vendor_id}: user_id=${v.user_id}, status=${v.status}`);
    });
    
    // Step 3: Check users table
    console.log('\n3️⃣ CHECKING users TABLE:');
    const [users] = await connection.execute('SELECT user_id, fname, lname, role FROM users ORDER BY user_id DESC LIMIT 5');
    console.log(`   Found ${users.length} user records:`);
    users.forEach(u => {
      console.log(`   - User ${u.user_id}: ${u.fname} ${u.lname}, role=${u.role}`);
    });
    
    // Step 4: Try the exact query from auto-reset
    console.log('\n4️⃣ TESTING AUTO-RESET QUERY:');
    const [testQuery] = await connection.execute(`
      SELECT 
          vr.vendor_id,
          vr.user_id,
          vr.rejection_id,
          vr.auto_return_at,
          COALESCE(v.store_name, \"No Store Name\") as store_name,
          v.valid_id_url,
          v.business_permit_url,
          v.proof_image_url,
          v.profile_image_url,
          u.fname,
          u.lname,
          u.email
      FROM vendor_rejections vr
      LEFT JOIN vendors v ON vr.vendor_id = v.vendor_id
      LEFT JOIN users u ON vr.user_id = u.user_id
      WHERE vr.is_returned = FALSE 
      AND vr.auto_return_at <= NOW()
    `);
    
    console.log(`   Query returned ${testQuery.length} eligible vendors:`);
    testQuery.forEach(v => {
      console.log(`   - Vendor ${v.vendor_id}: ${v.fname} ${v.lname}, store="${v.store_name}"`);
    });
    
    // Step 5: Check current server time vs auto_return_at
    console.log('\n5️⃣ TIME COMPARISON:');
    const [serverTime] = await connection.execute('SELECT NOW() as current_time');
    console.log(`   Server time: ${serverTime[0].current_time}`);
    
    // Step 6: Show timing for each rejection
    console.log('\n6️⃣ DETAILED TIMING ANALYSIS:');
    const [timingData] = await connection.execute(`
      SELECT 
        vr.vendor_id,
        vr.auto_return_at,
        vr.is_returned,
        NOW() as current_time,
        TIMESTAMPDIFF(SECOND, vr.auto_return_at, NOW()) as seconds_overdue
      FROM vendor_rejections vr
    `);
    
    timingData.forEach(t => {
      const overdue = t.seconds_overdue;
      const status = overdue >= 0 ? '🟡 PAST DUE' : '⏰ NOT READY';
      console.log(`   Vendor ${t.vendor_id}: auto_return=${t.auto_return_at}, current=${t.current_time}, overdue=${overdue}s, processed=${t.is_returned}, ${status}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
  
  process.exit(0);
}

debugQuery();
