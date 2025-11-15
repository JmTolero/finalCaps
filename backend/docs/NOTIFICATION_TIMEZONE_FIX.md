# Notification Timezone Fix

## Issue Found
The notification controller was **double-converting** timestamps by manually adding 8 hours, even though:
- MySQL database is already configured with timezone `+08:00` (Philippine timezone)
- MySQL2 returns dates that are already correctly timezone-aware
- The frontend handles timezone formatting using `toLocaleString` with `'Asia/Manila'`

## Problem
```javascript
// OLD CODE (WRONG - double conversion)
const date = new Date(notification.created_at);
const philippineDate = new Date(date.getTime() + (8 * 60 * 60 * 1000)); // Adding 8 hours
philippineTime = philippineDate.toISOString();
```

This caused notification timestamps to show **8 hours ahead** of the actual time.

## Solution
Removed the manual timezone conversion since:
1. Database is configured with `timezone: '+08:00'` in `backend/src/db/config.js`
2. MySQL returns timestamps already in Philippine timezone
3. Frontend properly formats using `toLocaleString('en-PH', { timeZone: 'Asia/Manila' })`

```javascript
// NEW CODE (CORRECT - no manual conversion)
created_at: notification.created_at, // Return as-is, already in correct timezone
```

## Files Changed
1. **backend/src/controller/shared/notificationController.js**
   - Removed manual 8-hour timezone conversion
   - Return timestamps as-is from database

2. **frontend/src/pages/customer/Notifications.jsx**
   - Enhanced `formatTimeAgo` function to show actual dates for older notifications
   - Uses Philippine timezone formatting for dates older than 7 days

## Testing
Run the test script to verify:
```bash
cd backend
node scripts/test_notification_time.js
```

## Verification
- ✅ Database timezone: `+08:00` (Philippine timezone)
- ✅ Backend no longer adds manual 8-hour conversion
- ✅ Frontend formats timestamps correctly using `Asia/Manila` timezone
- ✅ Notification timestamps now display correct time

## Date: 2025-11-13

