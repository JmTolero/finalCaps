-- Manual SQL commands to clean up test notifications with hardcoded names
-- Run these commands in your database management tool (phpMyAdmin, MySQL Workbench, etc.)

-- 1. First, check what notifications exist with hardcoded names
SELECT 
    notification_id,
    user_id,
    user_type,
    title,
    message,
    notification_type,
    created_at
FROM notifications 
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
ORDER BY created_at DESC;

-- 2. Delete notifications with hardcoded names directly
-- This will delete all notifications containing test names
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
   OR message LIKE '%Demo%';

-- 3. Verify the cleanup worked
SELECT COUNT(*) as remaining_test_notifications
FROM notifications 
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
   OR message LIKE '%Demo%';

-- 4. Check all notifications to see what's left
SELECT 
    notification_id,
    user_id,
    user_type,
    title,
    message,
    notification_type,
    created_at
FROM notifications 
ORDER BY created_at DESC
LIMIT 10;
