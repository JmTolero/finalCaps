const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanTestNotifications() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chill_db'
    });

    console.log('🔗 Connected to database');
    console.log('🧹 Cleaning up test notifications with hardcoded names...\n');

    // Check if notifications table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
    `, [process.env.DB_NAME || 'chill_db']);

    if (tables.length === 0) {
      console.log('❌ Notifications table does not exist');
      return;
    }

    console.log('✅ Notifications table exists\n');

    // Find notifications with hardcoded names (common test names)
    const testNames = ['Janna', 'John', 'Jane', 'Test', 'Sample', 'Demo'];
    const testNotifications = [];

    for (const name of testNames) {
      const [notifications] = await connection.execute(`
        SELECT notification_id, title, message, created_at
        FROM notifications 
        WHERE title LIKE ? OR message LIKE ?
      `, [`%${name}%`, `%${name}%`]);

      testNotifications.push(...notifications);
    }

    if (testNotifications.length === 0) {
      console.log('✅ No test notifications with hardcoded names found');
      return;
    }

    console.log(`🚨 Found ${testNotifications.length} test notifications with hardcoded names:\n`);

    // Display found notifications
    testNotifications.forEach((notification, index) => {
      console.log(`${index + 1}. ID: ${notification.notification_id}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Created: ${notification.created_at}`);
      console.log('');
    });

    // Ask for confirmation before deletion
    console.log('⚠️  These notifications appear to contain hardcoded test names.');
    console.log('   They should be deleted to prevent confusion.\n');

    // Delete test notifications
    const notificationIds = testNotifications.map(n => n.notification_id);
    
    if (notificationIds.length > 0) {
      const placeholders = notificationIds.map(() => '?').join(',');
      const [result] = await connection.execute(`
        DELETE FROM notifications 
        WHERE notification_id IN (${placeholders})
      `, notificationIds);

      console.log(`✅ Deleted ${result.affectedRows} test notifications with hardcoded names`);
    }

    // Verify cleanup
    const [remainingTest] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM notifications 
      WHERE title LIKE '%Janna%' OR message LIKE '%Janna%'
         OR title LIKE '%John%' OR message LIKE '%John%'
         OR title LIKE '%Jane%' OR message LIKE '%Jane%'
         OR title LIKE '%Test%' OR message LIKE '%Test%'
         OR title LIKE '%Sample%' OR message LIKE '%Sample%'
         OR title LIKE '%Demo%' OR message LIKE '%Demo%'
    `);

    console.log(`\n📊 Remaining test notifications: ${remainingTest[0].count}`);

    if (remainingTest[0].count === 0) {
      console.log('🎉 All test notifications with hardcoded names have been cleaned up!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the cleanup
cleanTestNotifications().catch(console.error);
