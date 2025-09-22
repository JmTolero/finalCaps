const express = require('express');
const router = express.Router();
const notificationController = require('../../controller/shared/notificationController');

// Get notifications for a user (customer or vendor)
// GET /api/notifications/:user_type/:user_id
router.get('/:user_type/:user_id', notificationController.getNotifications);

// Get unread notification count
// GET /api/notifications/:user_type/:user_id/unread-count
router.get('/:user_type/:user_id/unread-count', notificationController.getUnreadCount);

// Mark notification as read
// PUT /api/notifications/:notification_id/read
router.put('/:notification_id/read', notificationController.markAsRead);

// Mark all notifications as read for a user
// PUT /api/notifications/:user_type/:user_id/mark-all-read
router.put('/:user_type/:user_id/mark-all-read', notificationController.markAllAsRead);

// Delete notification
// DELETE /api/notifications/:notification_id
router.delete('/:notification_id', notificationController.deleteNotification);

module.exports = router;
