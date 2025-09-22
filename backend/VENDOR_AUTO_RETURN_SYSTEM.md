# Vendor Auto-Return System

## Overview
This system automatically notifies vendors when they are rejected by admin and automatically returns them to pending status after 1 week, allowing them to reapply.

## Features

### 1. Vendor Rejection Notifications
- When an admin rejects a vendor application, the system:
  - Updates the vendor status to 'rejected'
  - Records the rejection with an auto-return date (1 week from rejection)
  - Sends a notification to the vendor explaining the rejection and when they can reapply

### 2. Automatic Return After 1 Week
- The system automatically:
  - Changes rejected vendor status back to 'pending' after 1 week
  - Sends a notification informing the vendor they can reapply
  - Tracks the return process for admin monitoring

### 3. Admin Management Tools
- Admin endpoints to monitor and manage the auto-return process
- Statistics on vendor rejections and returns
- Manual trigger capability for testing

## Database Changes

### New Notification Types
- `vendor_approved` - Sent when vendor application is approved
- `vendor_rejected` - Sent when vendor application is rejected
- `vendor_return_available` - Sent when vendor becomes eligible to reapply

### New Table: `vendor_rejections`
```sql
CREATE TABLE vendor_rejections (
    rejection_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    user_id INT NOT NULL,
    rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_return_at TIMESTAMP NOT NULL,
    is_returned BOOLEAN DEFAULT FALSE,
    returned_at TIMESTAMP NULL,
    -- Foreign keys and indexes...
);
```

## API Endpoints

### Admin Auto-Return Management
- `POST /api/admin/auto-return/trigger` - Manually trigger auto-return process
- `GET /api/admin/auto-return/rejection-period` - Get vendors in rejection period
- `GET /api/admin/auto-return/stats` - Get rejection statistics

## Setup Instructions

### 1. Run Migration
```bash
cd backend
node run_vendor_notification_migration.js
```

### 2. Set Up Scheduled Job (Cron)
Add to your crontab to run daily:
```bash
# Run vendor auto-return process daily at 2 AM
0 2 * * * cd /path/to/your/project/backend && node src/scheduledJobs.js
```

### 3. Manual Testing
```bash
# Test the auto-return process manually
cd backend
node src/scheduledJobs.js
```

## Workflow

### When Admin Rejects Vendor:
1. Admin rejects vendor in admin panel
2. System updates vendor status to 'rejected'
3. System records rejection with 1-week auto-return date
4. Vendor receives notification: "Application needs review. You can reapply after [date]"

### After 1 Week:
1. Scheduled job runs and finds eligible vendors
2. System updates vendor status back to 'pending'
3. System marks rejection as returned
4. Vendor receives notification: "Reapplication available! You can now reapply"

## Notification Messages

### Rejection Notification
```
Title: "Vendor Application Needs Review 📋"
Message: "Hello [Name], your vendor application requires some improvements. You can reapply after 1 week ([date]) to give you time to address any issues."
```

### Return Available Notification
```
Title: "Reapplication Available! 🔄"
Message: "Hello [Name]! You can now reapply for vendor status. Your previous application has been reset to pending status. Please review and improve your application if needed."
```

### Approval Notification
```
Title: "Vendor Application Approved! 🎉"
Message: "Congratulations [Name]! Your vendor application has been approved. You can now set up your store and start selling your delicious ice cream!"
```

## Monitoring

### Admin Dashboard Features
- View vendors currently in rejection period
- See rejection statistics
- Monitor auto-return process
- Manual trigger for testing

### Statistics Available
- Total rejections
- Vendors returned
- Eligible for return
- Currently in rejection period

## Files Modified/Created

### Backend Files
- `migrations/add_vendor_notification_types.sql` - Database migration
- `src/controller/admin/adminController.js` - Updated vendor status update
- `src/utils/vendorAutoReturn.js` - Auto-return logic
- `src/scheduledJobs.js` - Scheduled job runner
- `src/controller/admin/autoReturnController.js` - Admin endpoints
- `src/routes/admin/autoReturnRoutes.js` - Auto-return routes
- `src/app.js` - Added auto-return routes
- `run_vendor_notification_migration.js` - Migration runner

## Testing

### Manual Testing
1. Create a test vendor application
2. Admin rejects the vendor
3. Check notification is sent
4. Wait 1 week or manually adjust auto_return_at date
5. Run scheduled job manually
6. Verify vendor status returns to pending
7. Check return notification is sent

### API Testing
```bash
# Get rejection statistics
GET /api/admin/auto-return/stats

# Get vendors in rejection period
GET /api/admin/auto-return/rejection-period

# Manually trigger auto-return process
POST /api/admin/auto-return/trigger
```

## Benefits

1. **Improved User Experience**: Vendors get clear feedback and know when they can reapply
2. **Automatic Process**: No manual intervention needed for returning vendors
3. **Admin Control**: Admins can monitor and manage the process
4. **Transparency**: Clear communication about rejection reasons and timeline
5. **Efficiency**: Automated system reduces admin workload

## Future Enhancements

1. **Custom Rejection Reasons**: Allow admins to specify why vendor was rejected
2. **Variable Return Periods**: Different return periods based on rejection reason
3. **Email Notifications**: Send email notifications in addition to in-app notifications
4. **Rejection History**: Track multiple rejection/return cycles per vendor
5. **Admin Dashboard UI**: Frontend interface for managing auto-returns
