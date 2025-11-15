-- Query to check what notification types currently exist in the database
-- Run this first to see if there are any notification types not in our ENUM list

SELECT DISTINCT notification_type, COUNT(*) as count
FROM notifications
GROUP BY notification_type
ORDER BY notification_type;

-- Also check the current ENUM definition
SHOW COLUMNS FROM notifications LIKE 'notification_type';

