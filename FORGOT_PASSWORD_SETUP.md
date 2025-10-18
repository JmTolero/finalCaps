# Forgot Password Feature Setup Guide

This guide will help you set up the forgot password functionality for your Chill Ice Cream application.

## 🚀 What's Been Added

### Backend Components
- **Database Table**: `password_reset_tokens` for storing reset tokens
- **Email Service**: Nodemailer configuration with beautiful HTML templates
- **API Endpoints**: 
  - `POST /api/auth/forgot-password` - Request password reset
  - `POST /api/auth/reset-password` - Reset password with token
  - `GET /api/auth/verify-reset-token/:token` - Verify token validity
- **Security Features**: Token expiration, one-time use, secure token generation

### Frontend Components
- **Forgot Password Page**: `/forgot-password` - Enter email to request reset
- **Reset Password Page**: `/reset-password` - Set new password with token
- **Updated Login Page**: Added "Forgot Password?" link

## 📋 Setup Instructions

### 1. Database Migration

Run the database migration to create the password reset tokens table:

```bash
cd backend
node scripts/run_password_reset_migration.js
```

Or manually run the SQL:
```sql
-- Run the contents of backend/migrations/create_password_reset_tokens.sql
```

### 2. Environment Variables

Add these environment variables to your `.env` file in the backend directory:

```env
# Email Configuration (Required)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (Required for reset links)
FRONTEND_URL=http://localhost:3000

# For production, use your actual domain:
# FRONTEND_URL=https://your-domain.com
```

### 3. Email Setup (Gmail Example)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `EMAIL_PASSWORD`

### 4. Alternative Email Services

You can modify `backend/src/config/email.js` to use other email services:

#### SendGrid
```javascript
const transporter = nodemailer.createTransporter({
    service: 'SendGrid',
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
});
```

#### AWS SES
```javascript
const transporter = nodemailer.createTransporter({
    SES: new AWS.SES({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    })
});
```

## 🔧 How It Works

### 1. User Requests Password Reset
- User clicks "Forgot Password?" on login page
- Enters email address on `/forgot-password` page
- System checks if email exists (security: doesn't reveal if email exists)
- If email exists, generates secure token and sends reset email

### 2. User Receives Email
- Beautiful HTML email with reset link
- Link contains secure token: `/reset-password?token=abc123...`
- Token expires in 1 hour for security

### 3. User Resets Password
- Clicks link in email → goes to `/reset-password` page
- System verifies token is valid and not expired
- User enters new password (minimum 6 characters)
- Password is updated and token is marked as used

## 🛡️ Security Features

- **Token Expiration**: Reset tokens expire after 1 hour
- **One-Time Use**: Each token can only be used once
- **Secure Generation**: Cryptographically secure random tokens
- **Email Validation**: Basic email format validation
- **Password Strength**: Minimum 6 character requirement
- **No Information Disclosure**: Doesn't reveal if email exists in system

## 🎨 UI Features

- **Responsive Design**: Works on mobile and desktop
- **Beautiful Email Templates**: Professional HTML emails with your branding
- **Loading States**: Shows loading spinners during API calls
- **Error Handling**: Clear error messages for users
- **Success Feedback**: Confirmation messages and auto-redirect

## 🧪 Testing

### Test the Flow
1. Go to `/login` page
2. Click "Forgot Password?"
3. Enter a valid email address
4. Check your email for the reset link
5. Click the link and set a new password
6. Try logging in with the new password

### Test Edge Cases
- Invalid email format
- Non-existent email address
- Expired reset token
- Used reset token
- Weak password

## 🚨 Troubleshooting

### Email Not Sending
1. Check your email credentials in `.env`
2. Verify Gmail app password is correct
3. Check console logs for email errors
4. Ensure 2FA is enabled on Gmail account

### Database Errors
1. Run the migration script: `node scripts/run_password_reset_migration.js`
2. Check database connection settings
3. Verify the `password_reset_tokens` table exists

### Frontend Issues
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check network tab for failed requests

## 📱 Production Deployment

### Environment Variables for Production
```env
EMAIL_USER=your-production-email@yourdomain.com
EMAIL_PASSWORD=your-production-app-password
FRONTEND_URL=https://your-production-domain.com
```

### Email Service Recommendations
- **SendGrid**: Reliable, good free tier
- **AWS SES**: Cost-effective for high volume
- **Mailgun**: Developer-friendly
- **Postmark**: Great deliverability

## 🔄 Future Enhancements

Consider adding these features later:
- Password strength meter
- Account lockout after failed attempts
- Email verification for new accounts
- Two-factor authentication
- Password history (prevent reusing old passwords)

## 📞 Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Test the email configuration separately
4. Check database connectivity

The forgot password feature is now fully integrated into your application! 🎉
