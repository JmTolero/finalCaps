const pool = require('../src/db/config');

/**
 * Test notification timestamp handling
 * This script creates a test notification and checks how timestamps are handled
 */
async function testNotificationTime() {
    try {
        console.log('🧪 Testing Notification Timestamp Handling...\n');
        
        // Get current time from database
        const [dbTimeResult] = await pool.query('SELECT NOW() as db_time');
        const dbTime = dbTimeResult[0].db_time;
        console.log('📅 Database Time (NOW()):', dbTime);
        console.log('   As Date Object:', new Date(dbTime).toString());
        console.log('   As UTC:', new Date(dbTime).toUTCString());
        console.log('   As ISO:', new Date(dbTime).toISOString());
        
        // Check what MySQL returns for a timestamp column
        const [testResult] = await pool.query(`
            SELECT 
                created_at,
                NOW() as db_current_time,
                @@session.time_zone as timezone
            FROM notifications 
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        
        if (testResult.length > 0) {
            const notification = testResult[0];
            console.log('\n📬 Latest Notification Timestamp:');
            console.log('   Raw from DB:', notification.created_at);
            console.log('   Type:', typeof notification.created_at);
            console.log('   As Date Object:', new Date(notification.created_at).toString());
            console.log('   As UTC:', new Date(notification.created_at).toUTCString());
            console.log('   As ISO:', new Date(notification.created_at).toISOString());
            
            // Simulate what the backend does (adding 8 hours)
            const backendProcessed = new Date(new Date(notification.created_at).getTime() + (8 * 60 * 60 * 1000));
            console.log('\n⚠️  After Backend Processing (adding 8 hours):');
            console.log('   As Date Object:', backendProcessed.toString());
            console.log('   As ISO:', backendProcessed.toISOString());
            
            // What it should be (no manual conversion)
            const correctTime = new Date(notification.created_at);
            console.log('\n✅ Correct Time (no manual conversion):');
            console.log('   As Date Object:', correctTime.toString());
            console.log('   As ISO:', correctTime.toISOString());
            console.log('   Philippine Time:', correctTime.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));
            
            // Compare
            const diff = backendProcessed.getTime() - correctTime.getTime();
            const diffHours = diff / (1000 * 60 * 60);
            console.log('\n⚖️  Difference:');
            console.log('   Hours difference:', diffHours, 'hours');
            if (Math.abs(diffHours - 8) < 0.1) {
                console.log('   ❌ Backend is DOUBLE-CONVERTING (adding 8 hours when it shouldn\'t)');
            } else {
                console.log('   ✅ Times match correctly');
            }
        } else {
            console.log('\n⚠️  No notifications found in database');
        }
        
        // Test what happens when we create a new notification
        console.log('\n📝 Testing New Notification Creation:');
        const testUserId = 1; // Change if needed
        const testUserType = 'customer';
        
        // Check if user exists
        const [userCheck] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [testUserId]);
        if (userCheck.length === 0) {
            console.log('   ⚠️  User ID 1 not found, skipping notification creation test');
        } else {
            const [insertResult] = await pool.query(`
                INSERT INTO notifications (user_id, user_type, title, message, notification_type)
                VALUES (?, ?, ?, ?, ?)
            `, [testUserId, testUserType, 'Test Notification', 'Testing timestamp', 'system_announcement']);
            
            const [newNotification] = await pool.query(`
                SELECT created_at FROM notifications WHERE notification_id = ?
            `, [insertResult.insertId]);
            
            console.log('   Created notification ID:', insertResult.insertId);
            console.log('   Created at (from DB):', newNotification[0].created_at);
            console.log('   As Date Object:', new Date(newNotification[0].created_at).toString());
            console.log('   Philippine Time:', new Date(newNotification[0].created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));
            
            // Clean up test notification
            await pool.query('DELETE FROM notifications WHERE notification_id = ?', [insertResult.insertId]);
            console.log('   ✅ Test notification cleaned up');
        }
        
    } catch (error) {
        console.error('❌ Error testing notification time:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

testNotificationTime();

