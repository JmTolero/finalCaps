# Customer Profile Picture Feature

## Overview
This feature allows customers to upload and display profile pictures in their account settings and navigation menu.

## Changes Made

### 1. Database Migration
**File:** `backend/migrations/023_add_customer_profile_image.sql`
- Added `profile_image_url` column to `users` table
- Stores Cloudinary URL for profile images
- Indexed for faster lookups

**To Run:**
```bash
cd backend
node run_customer_profile_migration.js
```

### 2. Backend Updates

#### Customer Controller (`backend/src/controller/customer/customerController.js`)
- Added Cloudinary storage configuration for customer profile images
- Images stored in `customer-profiles` folder
- Maximum file size: 5MB
- Allowed formats: JPG, JPEG, PNG
- Updated `updateCustomerProfile` function to handle image uploads using FormData

#### Customer Routes (`backend/src/routes/customer/customerRoutes.js`)
- Updated profile update route to use multer middleware
- Route: `PUT /api/customer/profile/:user_id`
- Accepts multipart/form-data with optional `profile_image` field

### 3. Frontend Updates

#### Customer Dashboard (`frontend/src/pages/customer/customer.jsx`)
**New State Variables:**
- `profileImage`: Stores the selected file
- `profileImagePreview`: Stores preview URL for display
- Added `profile_image_url` to customerData state

**New Functions:**
- `handleProfileImageChange()`: Validates and handles image selection
  - File type validation (JPG, JPEG, PNG)
  - File size validation (5MB max)
  - Creates preview using FileReader

**Updated Functions:**
- `fetchCustomerData()`: Loads profile image URL from session storage
- `saveProfile()`: Sends FormData with profile image to backend
- Updates sessionStorage with new profile_image_url

**New UI Components:**
- Profile picture upload section in Profile tab
- Circular profile image preview (128x128px)
- Camera icon button for upload
- Default avatar icon when no image
- Upload instructions and file requirements

#### Profile Dropdown (`frontend/src/components/shared/ProfileDropdown.jsx`)
**Updated Display:**
- Shows profile picture if available
- Falls back to icon if no image
- Image displays in circular format with object-cover
- Maintains role-specific styling:
  - **Customer:** White background with blue border (if no image)
  - **Admin:** Blue background
  - **Vendor:** Green background

## Features

### Image Upload
- ✅ Click camera icon to upload
- ✅ Real-time preview before saving
- ✅ File validation (type and size)
- ✅ Error messages for invalid files
- ✅ Stored securely in Cloudinary

### Display
- ✅ Shows in navigation menu (10x10 rounded circle)
- ✅ Shows in profile settings (32x32 rounded circle)
- ✅ Fallback to default icon if no image
- ✅ Updates immediately after save

### Security
- ✅ File type validation (images only)
- ✅ File size limit (5MB)
- ✅ Secure Cloudinary storage
- ✅ User-specific image naming

## Usage

### For Customers:
1. Log in to your account
2. Navigate to Account Settings (click profile icon → Account Settings)
3. Click the Profile tab
4. Click the camera icon on the profile picture circle
5. Select an image (JPG, JPEG, or PNG, max 5MB)
6. Preview your image
7. Click "Save Profile" to upload

### For Developers:
1. Run the database migration first
2. Ensure Cloudinary credentials are configured in `.env`
3. Backend automatically handles image uploads
4. Frontend automatically displays images when available

## File Structure

```
backend/
├── migrations/
│   └── 023_add_customer_profile_image.sql
├── src/
│   ├── controller/
│   │   └── customer/
│   │       └── customerController.js (updated)
│   └── routes/
│       └── customer/
│           └── customerRoutes.js (updated)
└── run_customer_profile_migration.js (new)

frontend/
├── src/
│   ├── pages/
│   │   └── customer/
│   │       └── customer.jsx (updated)
│   └── components/
│       └── shared/
│           └── ProfileDropdown.jsx (updated)
```

## Color Scheme
- Profile border: Blue (`border-blue-500`)
- Upload button: Blue (`bg-blue-600 hover:bg-blue-700`)
- Default background: Blue gradient (`from-blue-100 to-blue-200`)
- Matches overall customer interface blue theme 💙

## Technical Notes
- Uses Cloudinary for image storage (not local filesystem)
- Images automatically optimized by Cloudinary
- Unique filenames prevent conflicts: `customer-{user_id}-{timestamp}`
- FormData used for file upload (multipart/form-data)
- Session storage updated with new profile_image_url after save

## Testing Checklist
- [ ] Run database migration
- [ ] Upload profile picture
- [ ] Verify image appears in profile settings
- [ ] Verify image appears in navigation menu
- [ ] Test file type validation
- [ ] Test file size validation
- [ ] Test without uploading image (should show default icon)
- [ ] Log out and log back in (image should persist)

## Future Enhancements (Optional)
- Image cropping tool
- Multiple profile pictures/gallery
- Profile picture for vendors and admins
- Image compression before upload
- Drag and drop upload

---

**Created:** 2025-01-10
**Status:** ✅ Complete and Ready to Use

