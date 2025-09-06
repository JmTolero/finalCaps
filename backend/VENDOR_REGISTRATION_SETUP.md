# Vendor Registration Setup Guide

## Overview
The vendor registration functionality is already implemented and ready to use. This guide explains how to set it up and test it.

## Database Setup

### 1. Create Database and Tables
Run the SQL commands in `database_schema.sql` to create the necessary tables:

```sql
-- Run these commands in your MySQL database
source database_schema.sql;
```

### 2. Environment Configuration
Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
host=localhost
user=your_mysql_username
password=your_mysql_password
db_name=chillnet_db

# Server Configuration
PORT=3001

# Admin Credentials (for testing)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Environment
NODE_ENV=development
```

## API Endpoints

### Vendor Registration
- **Endpoint**: `POST /register-vendor`
- **Content-Type**: `multipart/form-data`
- **Required Fields**:
  - `fname` (string): Full name
  - `username` (string): Unique username
  - `password` (string): Password (min 6 characters)
  - `contact_no` (string): Contact number
  - `email` (string): Email address
  - `store_name` (string): Store name
  - `role` (string): Should be "vendor"
  - `valid_id` (file): Valid ID document
  - `business_permit` (file): Business permit document
  - `ice_cream_photo` (file): Ice cream product photo

### Response Format
```json
{
  "success": true,
  "message": "Vendor registration successful. Your account is pending approval.",
  "user": {
    "id": 123,
    "username": "vendor_username",
    "firstName": "John",
    "lastName": "Doe",
    "role": "vendor"
  }
}
```

## File Upload Configuration

The system is configured to:
- Accept images (JPEG, JPG, PNG) and PDF files
- Store files in `uploads/vendor-documents/` directory
- Limit file size to 5MB per file
- Generate unique filenames to prevent conflicts

## Database Schema

### Users Table
- `user_id` (Primary Key)
- `fname`, `lname` (Name fields)
- `username` (Unique)
- `password` (Plain text - should be hashed in production)
- `contact_no`, `email` (Contact information)
- `role` (customer/vendor/admin)

### Vendors Table
- `vendor_id` (Primary Key)
- `user_id` (Foreign Key to users)
- `store_name` (Store name)
- `valid_id_url` (Path to uploaded valid ID)
- `business_permit_url` (Path to uploaded business permit)
- `ice_cream_photo_url` (Path to uploaded ice cream photo)
- `status` (pending/approved/rejected)

## Testing

### 1. Start the Backend Server
```bash
cd backend
npm start
```

### 2. Test Database Connection
```bash
curl http://localhost:3001/db/health
```

### 3. Test Vendor Registration
Use the provided test script:
```bash
node test_vendor_registration.js
```

### 4. Test with Frontend
1. Start the frontend: `cd frontend && npm start`
2. Navigate to `/vendor-register`
3. Fill out the form and submit

## Security Considerations

⚠️ **Important**: The current implementation stores passwords in plain text. For production:

1. Install bcrypt: `npm install bcrypt`
2. Hash passwords before storing
3. Use environment variables for sensitive data
4. Implement proper input validation
5. Add rate limiting for registration attempts

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL service is running
   - Verify database credentials in .env
   - Ensure database exists

2. **File Upload Issues**
   - Check uploads directory permissions
   - Verify file size limits
   - Check file type restrictions

3. **Registration Fails**
   - Check for duplicate username/email
   - Verify all required fields are provided
   - Check file upload requirements

### Debug Mode
Set `NODE_ENV=development` in .env to see detailed error messages.

## Frontend Integration

The frontend form (`vendorRegister.jsx`) is already configured to:
- Send data to `/register-vendor` endpoint
- Handle file uploads with FormData
- Display success/error messages
- Redirect to login after successful registration

## Next Steps

1. Set up your MySQL database
2. Configure the .env file
3. Run the database schema
4. Start the backend server
5. Test the registration process
6. Implement password hashing for production
