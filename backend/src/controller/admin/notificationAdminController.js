const pool = require('../../db/config');

// Admin function to view all notifications
const getAllNotifications = async (req, res) => {
  try {
    console.log('🔍 Admin: Fetching all notifications...');

    const [notifications] = await pool.query(`
      SELECT 
        n.notification_id,
        n.user_id,
        n.user_type,
        n.title,
        n.message,
        n.notification_type,
        n.is_read,
        n.created_at,
        u.fname,
        u.lname,
        v.store_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.user_id
      LEFT JOIN vendors v ON n.user_id = v.user_id AND n.user_type = 'vendor'
      ORDER BY n.created_at DESC
      LIMIT 100
    `);

    console.log(`📊 Found ${notifications.length} notifications`);

    res.json({
      success: true,
      notifications: notifications,
      total: notifications.length
    });

  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

// Admin function to delete specific notification
const deleteNotification = async (req, res) => {
  try {
    const { notification_id } = req.params;

    console.log(`🗑️ Admin: Deleting notification ID: ${notification_id}`);

    const [result] = await pool.query(`
      DELETE FROM notifications 
      WHERE notification_id = ?
    `, [notification_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    console.log(`✅ Deleted notification ID: ${notification_id}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};

// Admin function to clean up test notifications
const cleanupTestNotifications = async (req, res) => {
  try {
    console.log('🧹 Admin: Cleaning up test notifications...');

    // Find and delete notifications with hardcoded test names
    const [result] = await pool.query(`
      DELETE FROM notifications 
      WHERE title LIKE '%Janna%' 
         OR message LIKE '%Janna%'
         OR title LIKE '%John%' 
         OR message LIKE '%John%'
         OR title LIKE '%Jane%' 
         OR message LIKE '%Jane%'
         OR title LIKE '%Test%' 
         OR message LIKE '%Test%'
         OR title LIKE '%Sample%' 
         OR message LIKE '%Sample%'
         OR title LIKE '%Demo%' 
         OR message LIKE '%Demo%'
    `);

    console.log(`✅ Cleaned up ${result.affectedRows} test notifications`);

    res.json({
      success: true,
      message: `Cleaned up ${result.affectedRows} test notifications`,
      deleted_count: result.affectedRows
    });

  } catch (error) {
    console.error('Error cleaning up test notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up test notifications'
    });
  }
};

module.exports = {
  getAllNotifications,
  deleteNotification,
  cleanupTestNotifications
};
