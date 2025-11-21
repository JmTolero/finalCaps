# Xendit Webhook Setup for Render Deployment

## ✅ Yes, the webhook WILL work on Render (if configured correctly)

The webhook endpoint is already implemented and ready. You just need to configure it in Xendit dashboard.

---

## 🔧 Setup Steps

### 1. Deploy Backend to Render

**Important:** The webhook goes to your **BACKEND**, not the frontend!

- Backend URL: `https://your-backend.onrender.com` (or your Render backend domain)
- Frontend URL: `https://your-app.vercel.app` (or your frontend domain)

### 2. Set Environment Variables in Render

Add these to your Render backend service environment variables:

```env
XENDIT_SECRET_KEY=xnd_development_xxxxxxxxxxxxx
XENDIT_PUBLIC_KEY=xnd_public_development_xxxxxxxxxxxxx
XENDIT_WEBHOOK_SECRET=your_webhook_secret_from_xendit_dashboard
```

**Where to find XENDIT_WEBHOOK_SECRET:**
1. Go to Xendit Dashboard → Settings → Webhooks
2. Create or view your webhook
3. Copy the webhook secret

### 3. Configure Webhook in Xendit Dashboard

1. **Go to Xendit Dashboard**
   - Visit: https://dashboard.xendit.co
   - Login to your account

2. **Navigate to Webhooks**
   - Settings → Webhooks
   - Or: https://dashboard.xendit.co/settings/webhooks

3. **Add Webhook URL**
   - **Webhook URL:** `https://your-backend.onrender.com/api/payment/webhook`
   - **Events to listen for:**
     - ✅ `invoice.paid`
     - ✅ `invoice.expired`
     - ✅ `invoice.voided`

4. **Save and Copy Webhook Secret**
   - Xendit will generate a webhook secret
   - Copy it and add to Render environment variables as `XENDIT_WEBHOOK_SECRET`

### 4. Test the Webhook

After deployment, test with a real payment:

1. Make a test payment through your app
2. Check Render logs for webhook receipt
3. Check Xendit dashboard → Webhooks → Logs for delivery status

---

## 📍 Webhook Endpoint Details

**Endpoint:** `POST /api/payment/webhook`

**Full URL:** `https://your-backend.onrender.com/api/payment/webhook`

**What it does:**
- ✅ Receives payment confirmation from Xendit
- ✅ Verifies webhook signature for security
- ✅ Updates order payment status
- ✅ Creates notifications for vendor and customer
- ✅ Handles partial payments (50% downpayment)
- ✅ Handles remaining balance payments

---

## 🔐 Security

The webhook handler includes signature verification:

```javascript
// Automatically verifies Xendit signature
const signature = req.headers['x-xendit-signature'];
if (!xenditService.verifyWebhookSignature(payload, signature)) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

**This means:**
- ✅ Only Xendit can send valid webhooks
- ✅ Prevents fake payment confirmations
- ✅ Secure and production-ready

---

## 🧪 Testing Before Production

### Option 1: Use ngrok (Local Testing)

1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 3001`
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
4. In Xendit dashboard, set webhook to: `https://abc123.ngrok.io/api/payment/webhook`
5. Make a test payment
6. Check if webhook is received

### Option 2: Test on Render (Production-like)

1. Deploy backend to Render
2. Configure webhook in Xendit pointing to Render URL
3. Make a test payment
4. Check Render logs

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Backend deployed to Render
- [ ] Backend URL is publicly accessible
- [ ] `XENDIT_WEBHOOK_SECRET` set in Render environment variables
- [ ] Webhook URL configured in Xendit dashboard
- [ ] Webhook URL points to: `https://your-backend.onrender.com/api/payment/webhook`
- [ ] Test payment made and webhook received
- [ ] Order status updated correctly
- [ ] Vendor notification received
- [ ] Customer notification received

---

## 🐛 Troubleshooting

### Webhook not received?

1. **Check Render logs:**
   ```bash
   # In Render dashboard → Your Service → Logs
   # Look for: "🔄 Received Xendit webhook"
   ```

2. **Check Xendit webhook logs:**
   - Xendit Dashboard → Webhooks → Logs
   - See if webhook was sent
   - Check delivery status (200 = success)

3. **Verify webhook URL:**
   - Must be HTTPS (not HTTP)
   - Must be publicly accessible
   - Must match exactly: `/api/payment/webhook`

4. **Check webhook secret:**
   - Must match in both Xendit dashboard and Railway
   - Case-sensitive

### "Invalid signature" error?

- ✅ Check `XENDIT_WEBHOOK_SECRET` matches Xendit dashboard
- ✅ Verify webhook URL is correct
- ✅ Make sure Render has the latest code deployed

### Webhook received but order not updated?

- ✅ Check Render logs for errors
- ✅ Verify database connection
- ✅ Check if order_id exists in database
- ✅ Verify payment_intents table has the record

---

## 📊 Monitoring

### Check Webhook Status

**In Xendit Dashboard:**
- Webhooks → Logs
- See delivery status, response codes, retry attempts

**In Render Logs:**
- Look for: `✅ Payment succeeded for order XXX`
- Look for: `❌ Error` messages

### Set Up Alerts (Optional)

Consider setting up:
- Render error alerts
- Xendit webhook failure notifications
- Database monitoring

---

## 🚀 Production Deployment

Once everything is tested:

1. **Switch to Production Xendit Keys**
   - Update `XENDIT_SECRET_KEY` to production key
   - Update `XENDIT_PUBLIC_KEY` to production key
   - Update `XENDIT_WEBHOOK_SECRET` to production webhook secret

2. **Update Webhook URL**
   - Point to production backend URL
   - Test with a real payment

3. **Monitor First Few Payments**
   - Watch Render logs
   - Verify notifications are sent
   - Check order status updates

---

## 📝 Summary

**The webhook WILL work on Render deployment IF:**

1. ✅ Backend is deployed to Render
2. ✅ Webhook URL is configured in Xendit dashboard
3. ✅ `XENDIT_WEBHOOK_SECRET` is set in Render environment variables
4. ✅ Webhook URL points to backend, not frontend

**Remember:**
- Frontend = Your React app (Vercel or similar)
- Render = Backend (Node.js API)
- Webhook goes to **Render Backend URL**, not frontend!

**Render Backend URL Format:**
- `https://your-backend-name.onrender.com`
- Or your custom domain if configured

---

## 🔗 Related Files

- `backend/src/controller/paymentController.js` - Webhook handler
- `backend/src/services/xenditService.js` - Xendit service with signature verification
- `backend/src/routes/paymentRoutes.js` - Webhook route registration

---

**Need help?** Check the main guide: `INTEGRATED_GCASH_PAYMENT_GUIDE.md`

