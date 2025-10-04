console.log('🚀 Starting diagnostic check...');

const mysql = require('mysql2/promise');

async function checkStatus() {
  console.log('📡 Connecting to database...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'chill_db'
  });
  
  try {
    console.log('✅ Database connected');
    
    // Check vendor_rejections table
    const [rejections] = await connection.execute('SELECT COUNT(*) as count FROM vendor_rejections');
    console.log(`📊 Total rejection records: ${rejections[0].count}`);
    
    if (rejections[0].count > 0) {
      const [recent] = await connection.execute('SELECT vendor_id, auto_return_at, is_returned FROM vendor_rejections ORDER BY rejected_at DESC LIMIT 1');
      const record = recent[0];
      console.log(`🔍 Latest rejection: vendor ${record.vendor_id}, return at ${record.auto_return_at}, processed: ${record.is_returned}`);
      
      // Check if time has passed
      const [timeCheck] = await connection.execute('SELECT NOW() as now, ? as return_time, TIMESTAMPDIFF(SECOND, ?, NOW()) as diff', [record.auto_return_at, record.auto_return_at]);
      const diff = timeCheck[0].diff;
      console.log(`⏰ Time check: ${timeCheck[0].now} vs ${timeCheck[0].return_time} = ${diff}s difference`);
      console.log(`${diff >= 0 ? '🟡 READY for auto-reset' : '⏰ NOT READY'} (${Math.abs(diff)}s ${diff >= 0 ? 'overdue' : 'remaining'})`);
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    console.log('🔌 Connection closed');
  }
  
  console.log('\n✅ Diagnostic finished');
  process.exit();
}

checkStatus();
