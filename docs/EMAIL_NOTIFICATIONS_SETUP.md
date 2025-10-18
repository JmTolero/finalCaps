# Email Notifications Setup Guide

## 📧 Email Configuration for Vendor Approval/Rejection

This guide shows how to set up email notifications for vendor account approval and rejection.

---

## 🔧 Environment Variables

Add these variables to your `.env` file in the backend folder:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=ChillNet Admin <noreply@chillnet.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

---

## 📧 Gmail Setup (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Enter "ChillNet Backend"
4. Copy the generated password (16 characters) amsu dnyw odis ckae
5. Use this password in `EMAIL_PASSWORD`

### Step 3: Update .env File
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # The 16-character app password
EMAIL_FROM=ChillNet Admin <your-gmail@gmail.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

---

## 🚀 Alternative Email Services

### Option 1: SendGrid (Production Recommended)
```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=ChillNet Admin <noreply@chillnet.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Option 2: Mailtrap (Testing Only)
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
EMAIL_FROM=ChillNet Admin <test@chillnet.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

---

## 🧪 Testing Email Functionality

### Test with Mailtrap (Safe Testing)
1. Sign up at [Mailtrap.io](https://mailtrap.io)
2. Get your SMTP credentials
3. Use Mailtrap settings in `.env`
4. All emails will be caught safely (not sent to real users)

### Test with Gmail (Real Emails)
1. Set up Gmail with app password
2. Set `ENABLE_EMAIL_NOTIFICATIONS=true`
3. Approve/reject a vendor in admin panel
4. Check vendor's email inbox

---

## 📬 What Emails Are Sent

### Vendor Approval Email
- **Subject:** 🎉 Your ChillNet Vendor Account Has Been Approved!
- **Content:** Congratulations message with next steps
- **Action:** Login button to vendor dashboard

### Vendor Rejection Email
- **Subject:** Update on Your ChillNet Vendor Application
- **Content:** Rejection reason and reapplication instructions
- **Action:** Reapply button

---

## 🔧 How It Works

### When Admin Approves Vendor:
1. ✅ Update vendor status in database
2. ✅ Create in-app notification
3. ✅ Send approval email to vendor
4. ✅ Log email result

### When Admin Rejects Vendor:
1. ✅ Update vendor status in database
2. ✅ Create in-app notification
3. ✅ Send rejection email to vendor
4. ✅ Log email result

---

## ⚠️ Important Notes

### Email Failure Handling
- If email fails, vendor approval/rejection still works
- Email errors are logged but don't break the process
- In-app notifications always work regardless of email status

### Security
- Never use your regular Gmail password
- Always use App Passwords for Gmail
- Keep email credentials secure

### Production vs Development
```env
# Development (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-dev-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Production (SendGrid recommended)
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

---

## 🚨 Troubleshooting

### "Invalid login" Error
- ✅ Check if 2FA is enabled on Gmail
- ✅ Use App Password, not regular password
- ✅ Remove spaces from App Password

### "Email configuration missing" Error
- ✅ Check all required environment variables are set
- ✅ Restart backend after changing `.env`

### Emails Not Sending
- ✅ Check `ENABLE_EMAIL_NOTIFICATIONS=true`
- ✅ Check backend logs for email errors
- ✅ Verify email service credentials

### Testing Issues
- ✅ Use Mailtrap for safe testing
- ✅ Check Mailtrap inbox for caught emails
- ✅ Verify SMTP settings match Mailtrap

---

## 📋 Quick Setup Checklist

- [ ] Install nodemailer: `npm install nodemailer`
- [ ] Add email variables to `.env`
- [ ] Set up Gmail App Password (or other service)
- [ ] Set `ENABLE_EMAIL_NOTIFICATIONS=true`
- [ ] Restart backend server
- [ ] Test by approving/rejecting a vendor
- [ ] Check email delivery

---

## 🎯 Next Steps

After email notifications are working:

1. **Test thoroughly** with different email providers
2. **Monitor email delivery** in production
3. **Consider email templates** customization
4. **Add unsubscribe links** (optional)
5. **Set up email analytics** (optional)

---

## 📞 Support

If you encounter issues:
1. Check backend logs for email errors
2. Verify environment variables
3. Test with Mailtrap first
4. Check email service documentation

**Remember:** Email notifications enhance user experience but don't replace in-app notifications!
