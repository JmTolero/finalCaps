const pool = require('../../db/config');

// Get notifications for a user (customer or vendor)
const getNotifications = async (req, res) => {
  try {
    const { user_id, user_type } = req.params;
    const { page = 1, limit = 20, unread_only = false } = req.query;

    // Validate user_type
    if (!['customer', 'vendor'].includes(user_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user type. Must be customer or vendor'
      });
    }

    console.log(`📬 Fetching notifications for ${user_type} ID: ${user_id}`);

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query - handle vendor notifications correctly
    let query = `
      SELECT 
        n.notification_id,
        n.title,
        n.message,
        n.notification_type,
        n.related_order_id,
        n.related_vendor_id,
        n.related_customer_id,
        n.is_read,
        n.created_at,
        o.status as order_status,
        o.total_amount,
        v.store_name as vendor_name,
        u.fname as customer_first_name,
        u.lname as customer_last_name
      FROM notifications n
      LEFT JOIN orders o ON n.related_order_id = o.order_id
      LEFT JOIN vendors v ON n.related_vendor_id = v.vendor_id
      LEFT JOIN users u ON n.related_customer_id = u.user_id
      WHERE n.user_id = ? AND n.user_type = ?
    `;

    let params = [user_id, user_type];

    // Add unread filter if requested
    if (unread_only === 'true') {
      query += ' AND n.is_read = FALSE';
    }

    // Add ordering and pagination
    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [notifications] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE n.user_id = ? AND n.user_type = ?
    `;
    let countParams = [user_id, user_type];

    if (unread_only === 'true') {
      countQuery += ' AND n.is_read = FALSE';
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Format notifications with timezone conversion
    const formattedNotifications = notifications.map(notification => {
      // Convert timestamp to Philippine time
      let philippineTime = notification.created_at;
      if (notification.created_at) {
        const date = new Date(notification.created_at);
        // Add 8 hours to convert from UTC to Philippine time (UTC+8)
        const philippineDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
        philippineTime = philippineDate.toISOString();
      }
      
      return {
        id: notification.notification_id,
        title: notification.title,
        message: notification.message,
        type: notification.notification_type,
        notification_type: notification.notification_type, // Add this for frontend compatibility
        is_read: notification.is_read,
        created_at: philippineTime,
        related_order_id: notification.related_order_id,
        related_vendor_id: notification.related_vendor_id,
        related_customer_id: notification.related_customer_id,
        order_status: notification.order_status,
        total_amount: notification.total_amount,
        vendor_name: notification.vendor_name,
        customer_name: notification.customer_first_name && notification.customer_last_name 
          ? `${notification.customer_first_name} ${notification.customer_last_name}` 
          : null
      };
    });

    res.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;

    console.log(`📖 Marking notification ${notification_id} as read`);

    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?',
      [notification_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const { user_id, user_type } = req.params;

    console.log(`📖 Marking all notifications as read for ${user_type} ID: ${user_id}`);

    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND user_type = ?',
      [user_id, user_type]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      affected_rows: result.affectedRows
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notification_id } = req.params;

    console.log(`🗑️ Deleting notification ${notification_id}`);

    const [result] = await pool.query(
      'DELETE FROM notifications WHERE notification_id = ?',
      [notification_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create notification (utility function for other controllers)
const createNotification = async (notificationData) => {
  try {
    const {
      user_id,
      user_type,
      title,
      message,
      notification_type,
      related_order_id = null,
      related_vendor_id = null,
      related_customer_id = null
    } = notificationData;

    console.log(`📤 Creating notification: ${notification_type} for ${user_type} ${user_id}`);

    const [result] = await pool.query(`
      INSERT INTO notifications (
        user_id, user_type, title, message, notification_type,
        related_order_id, related_vendor_id, related_customer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id, user_type, title, message, notification_type,
      related_order_id, related_vendor_id, related_customer_id
    ]);

    console.log(`✅ Notification created with ID: ${result.insertId}`);
    return result.insertId;

  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const { user_id, user_type } = req.params;

    const [result] = await pool.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND user_type = ? AND is_read = FALSE',
      [user_id, user_type]
    );

    res.json({
      success: true,
      unread_count: result[0].unread_count
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount
};
