-- Add payment_reminder notification type
ALTER TABLE notifications
MODIFY COLUMN notification_type ENUM(
    'order_placed',
    'order_accepted',
    'order_rejected',
    'order_preparing',
    'order_ready',
    'order_delivered',
    'order_cancelled',
    'payment_confirmed',
    'payment_failed',
    'drum_return_requested',
    'drum_picked_up',
    'system_announcement',
    'review_received',
    'payment_reminder'
) NOT NULL;

