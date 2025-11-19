# Resend Email Setup Guide

## ⚠️ Important: Resend Email Restrictions

### The Problem

When using Resend's default `onboarding@resend.dev` email address, **emails can only be sent to**:

1. **The email address used to sign up for Resend** (in your case: `joemartolero987@gmail.com`)
2. **Verified email addresses** added in your Resend dashboard

This is why emails work for `joemartolero987@gmail.com` but fail for other email addresses.

---

## ✅ Solutions

### Option 1: Verify a Domain in Resend (Recommended for Production)

This allows you to send emails to **any email address** using your own domain.

#### Steps:

1. **Go to Resend Dashboard**
   - Visit [https://resend.com/domains](https://resend.com/domains)
   - Click "Add Domain"

2. **Add Your Domain**
   - Enter your domain (e.g., `chillnet.com`)
   - Resend will show you the required DNS records

3. **Add DNS Records in Hostinger**
   - Log in to your Hostinger account
   - **Navigate to DNS settings:**
     - In the **left sidebar**, click **"Domains"** → **"DNS / Nameservers"**
     - OR in the main content area, find the **"DNS/Nameservers"** section and click the **"Edit"** button
   - You should see your current nameservers (e.g., `ns1.dns-parking.com`, `ns2.dns-parking.com`)
   - Look for an **"Add Record"** or **"Add DNS Record"** button
   - Add the DNS records shown in Resend:
     
     **For Domain Verification (DKIM):**
     - **Type**: TXT
     - **Name**: `resend._domainkey` (or as shown in Resend)
     - **Value/Content**: The long string starting with `p=MIGfMAOGCSqGSIb3DQEB...` (copy from Resend)
     - **TTL**: Auto (or 3600)
     
     **For Email Sending (SPF & DMARC):**
     - **Type**: MX
     - **Name**: `send` (or `@` if Hostinger requires it)
     - **Value/Content**: The SMTP server (e.g., `feedback-smtp.ap-northeast-1.amazonses.com`)
     - **Priority**: 10
     - **TTL**: Auto (or 3600)
   
   - **Save** the DNS records in Hostinger
   
4. **Wait for DNS Propagation**
   - DNS changes can take a few minutes to several hours to propagate
   - Resend will automatically check for the records
   - The status will change from "Pending" to "Verified" once the records are detected

5. **Update Environment Variables**
   
   **Important:** You don't need to create an actual email account in Hostinger! Resend will handle sending emails. Just use any email address format with your domain.
   
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=noreply@chillneticecream.shop
   # Or use a friendly name:
   # EMAIL_FROM=ChillNet <noreply@chillneticecream.shop>
   ```
   
   **Common email addresses you can use:**
   - `noreply@chillneticecream.shop` (recommended - for automated emails)
   - `hello@chillneticecream.shop`
   - `support@chillneticecream.shop`
   - `info@chillneticecream.shop`
   
   **Note:** These don't need to exist as real email accounts. Resend will send emails FROM these addresses once your domain is verified.

6. **Restart Your Backend**
   ```bash
   npm run dev
   ```

**Optional: Create Email Accounts in Hostinger (Only if you want to RECEIVE emails)**

If you want to actually receive emails at addresses like `support@chillneticecream.shop` (not just send FROM them), you can create email accounts in Hostinger:

1. **In Hostinger Dashboard:**
   - Go to **"Emails"** in the left sidebar
   - Click **"Create Email Account"** or **"Add Email"**
   - Enter the email address (e.g., `support@chillneticecream.shop`)
   - Set a password
   - Create the account

2. **Access Your Email:**
   - Use Hostinger's webmail interface
   - Or configure it in an email client (Outlook, Gmail, etc.)

**Note:** This is completely optional! Resend can SEND emails FROM any address on your domain without creating actual email accounts. You only need to create accounts if you want to RECEIVE emails at those addresses.

---

### Option 2: Add Verified Recipients (For Testing)

If you only need to send to a few specific email addresses, you can add them as verified recipients.

#### Steps:

1. **Go to Resend Dashboard**
   - Visit [https://resend.com/emails](https://resend.com/emails)
   - Navigate to "Settings" → "Verified Recipients" (if available)

2. **Add Recipient Emails**
   - Add each email address you want to send to
   - Verify them through the email confirmation

3. **Continue Using onboarding@resend.dev**
   - No code changes needed
   - Just add recipients in the dashboard

**Note:** This method is limited and not ideal for production.

---

### Option 3: Use Gmail for Development (Quick Fix)

If you're in development and need to test with multiple email addresses immediately:

#### Steps:

1. **Set Up Gmail App Password**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification
   - Generate an App Password at [App Passwords](https://myaccount.google.com/apppasswords)

2. **Update Environment Variables**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=ChillNet Admin <your-email@gmail.com>
   ```

3. **Restart Your Backend**
   ```bash
   npm run dev
   ```

**Note:** Gmail has daily sending limits (500 emails/day for free accounts).

---

## 🔍 How to Check Your Current Configuration

The code now includes warnings when using `onboarding@resend.dev`. Check your backend logs:

```
⚠️  WARNING: Using Resend onboarding email (onboarding@resend.dev)
⚠️  This can only send to: 1) Your Resend signup email, 2) Verified recipients in Resend dashboard
⚠️  To send to any email address, verify a domain in Resend and set EMAIL_FROM to your verified domain email
```

---

## 📊 Resend Sending Limits

### Free Account Limits

**Daily Limit:** 100 emails per day  
**Monthly Limit:** 3,000 emails per month

**Important:** Each recipient in the To, CC, or BCC fields counts toward these limits.

### Paid Account Limits

- **Transactional Pro and Scale Plans:** No daily sending limits; monthly limits depend on your plan tier
- **Marketing Pro Plans:** No sending limits

### Domain Warm-up (Recommended for New Domains)

For new domains, Resend recommends gradually increasing email volume to build sender reputation:

- **Day 1:** Up to 150 emails
- **Day 2:** Up to 250 emails
- **Day 3:** Up to 400 emails
- **Day 4:** Up to 700 emails (max 50 per hour)
- **Day 5:** Up to 1,000 emails (max 75 per hour)
- **Day 6:** Up to 1,500 emails (max 100 per hour)
- **Day 7:** Up to 2,000 emails (max 150 per hour)

This helps improve deliverability and reduces spam filtering.

### Monitor Your Usage

- Check your usage at: [Resend Usage Page](https://resend.com/usage)
- View limits in your Resend dashboard

**Note:** If you exceed free tier limits, you'll need to upgrade to a paid plan or wait for the next billing cycle.

---

## 📝 Environment Variables Reference

### For Resend with Verified Domain:
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
ENABLE_EMAIL_NOTIFICATIONS=true
```

### For Resend with onboarding@resend.dev (Limited):
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev  # or leave unset
ENABLE_EMAIL_NOTIFICATIONS=true
```

### For Gmail:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=ChillNet Admin <your-email@gmail.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

---

## 🐛 Troubleshooting

### Error: "You can only send testing emails to your own email address"

**This error means:**
- Your domain is still "Pending" (not verified yet) in Resend
- You're trying to send to an email address that's not your Resend signup email
- Resend restricts `onboarding@resend.dev` to only send to your signup email until you verify a domain

**Solutions:**

**Option A: Wait for Domain Verification (Recommended)**
1. Make sure you've added the DNS records in Hostinger (see Step 3 above)
2. Wait for DNS propagation (can take minutes to hours)
3. Check Resend dashboard - domain status should change from "Pending" to "Verified"
4. Once verified, update your `.env` file:
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=noreply@chillneticecream.shop
   ENABLE_EMAIL_NOTIFICATIONS=true
   ```
5. Restart your backend: `npm run dev`

**Option B: Use Gmail Temporarily (For Testing Now)**
1. Set up Gmail App Password (see Option 3 below)
2. Update your `.env` file:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=joemartolero987@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=ChillNet Admin <joemartolero987@gmail.com>
   ENABLE_EMAIL_NOTIFICATIONS=true
   ```
3. Restart your backend: `npm run dev`
4. Switch back to Resend once your domain is verified

**Option C: Send Only to Your Email (Quick Test)**
- Temporarily test by sending emails only to `joemartolero987@gmail.com` until domain is verified

---

### Emails sending but not received by other Gmail accounts?

**Common causes and solutions:**

1. **Check Domain Verification Status**
   - Go to [Resend Domains](https://resend.com/domains)
   - Make sure your domain shows **"Verified"** (not "Pending")
   - If still "Pending", DNS records haven't propagated yet - wait longer

2. **Check Your EMAIL_FROM Configuration**
   - Open your `.env` file in the backend folder
   - Make sure `EMAIL_FROM` uses your verified domain:
     ```env
     EMAIL_FROM=noreply@chillneticecream.shop
     ```
   - **NOT** `onboarding@resend.dev` (this only works for your signup email)
   - Restart your backend after changing: `npm run dev`

3. **Check Resend Dashboard for Errors**
   - Go to [Resend Dashboard](https://resend.com/emails)
   - Click on "Emails" tab
   - Check if emails show as "Delivered" or "Bounced"
   - Look for any error messages

4. **Emails Might Be in Spam Folder**
   - Ask recipients to check their **Spam/Junk folder**
   - Gmail often filters new domain emails to spam initially
   - This is normal for new domains and improves over time

5. **Verify DNS Records Are Complete**
   - In Resend dashboard, check that **all** DNS records show as "Verified":
     - ✅ Domain Verification (DKIM) - TXT record
     - ✅ Enable Sending (SPF & DMARC) - MX record
   - If any show "Pending", wait for DNS propagation

6. **Check Backend Logs**
   - Look for warning messages like:
     ```
     ⚠️  WARNING: Using Resend onboarding email (onboarding@resend.dev)
     ```
   - If you see this, your `EMAIL_FROM` is wrong

7. **Test Email Delivery**
   - Try sending to your own Gmail first (`joemartolero987@gmail.com`)
   - If that works but others don't, it's likely a spam filtering issue
   - Wait 24-48 hours for domain reputation to improve

---

### Emails not sending to certain addresses?

1. **Check if using onboarding@resend.dev**
   - Look for warning messages in logs
   - Verify you're using a verified domain email in `EMAIL_FROM`

2. **Check Resend Dashboard**
   - Go to [Resend Dashboard](https://resend.com/emails)
   - Check the "Emails" tab for failed sends
   - Review error messages

3. **Verify Domain Status**
   - Go to [Resend Domains](https://resend.com/domains)
   - Ensure your domain shows as "Verified"
   - Check DNS records are correct

4. **Test with Different Email**
   - Try sending to your Resend signup email first
   - If that works, the issue is recipient verification

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)


   