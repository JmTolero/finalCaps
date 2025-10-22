const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkNotifications() {
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
    console.log('🔍 Checking notifications table...\n');

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

    // Get all notifications
    const [notifications] = await connection.execute(`
      SELECT 
        notification_id,
        user_id,
        user_type,
        title,
        message,
        notification_type,
        is_read,
        created_at
      FROM notifications 
      ORDER BY created_at DESC
    `);

    console.log(`📊 Found ${notifications.length} notifications:\n`);

    if (notifications.length === 0) {
      console.log('📭 No notifications found in the database');
      return;
    }

    // Display all notifications
    notifications.forEach((notification, index) => {
      console.log(`${index + 1}. ID: ${notification.notification_id}`);
      console.log(`   User: ${notification.user_type} ${notification.user_id}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Type: ${notification.notification_type}`);
      console.log(`   Read: ${notification.is_read ? 'Yes' : 'No'}`);
      console.log(`   Created: ${notification.created_at}`);
      console.log('');
    });

    // Check for any notifications containing "Janna"
    const jannaNotifications = notifications.filter(n => 
      n.title.toLowerCase().includes('janna') || 
      n.message.toLowerCase().includes('janna')
    );

    if (jannaNotifications.length > 0) {
      console.log('🚨 Found notifications with "Janna":\n');
      jannaNotifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.notification_id}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   Message: ${notification.message}`);
        console.log(`   Created: ${notification.created_at}`);
        console.log('');
      });
    } else {
      console.log('✅ No notifications found with "Janna" in the title or message');
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

// Run the check
checkNotifications().catch(console.error);
