-- Create notifications table for real notification system
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('customer', 'vendor') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM(
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
        'review_received'
    ) NOT NULL,
    related_order_id INT NULL,
    related_vendor_id INT NULL,
    related_customer_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_notifications (user_id, user_type),
    INDEX idx_notification_type (notification_type),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
);
