# Integrated GCash Payment System - Complete Guide

## 🎉 Overview

The integrated GCash payment system provides a seamless, automated payment experience using Xendit's payment gateway. No more manual screenshot uploads!

### Key Features
- ✅ Automatic vendor payment routing via split payment
- ✅ Mobile-optimized: Opens GCash app directly on mobile devices
- ✅ Desktop-optimized: Shows QR code for scanning
- ✅ Automatic payment verification via webhooks
- ✅ Instant order confirmation
- ✅ Zero fraud risk
- ✅ Works for all vendors automatically

---

## 📋 How It Works

### For Vendors

1. **Setup (One-time)**
   - Go to vendor dashboard → GCash Setup
   - Enter GCash number (e.g., `09123456789`)
   - System validates and stores it
   - Done! No QR code upload needed

2. **Receiving Payments**
   - Customer pays → Money automatically sent to vendor's GCash
- Platform takes 3% commission
- Vendor receives 97% directly
   - Order confirmed automatically

### For Customers

**On Mobile:**
1. Click "Pay with GCash"
2. System automatically opens GCash app
3. Confirm payment
4. Done! Order confirmed instantly

**On Desktop:**
1. Click "Pay with GCash"
2. QR code appears
3. Scan with GCash app
4. Confirm payment
5. Order confirmed automatically

---

## 🔧 Technical Implementation

### Backend Components

#### 1. Payment Controller
**File:** `backend/src/controller/paymentController.js`

New endpoint: `/api/payment/create-integrated-gcash-payment`

**What it does:**
- Fetches vendor's GCash number from database
- Creates Xendit split payment invoice
- Routes payment to vendor's GCash
- Stores payment intent in database

**Example Request:**
```javascript
POST /api/payment/create-integrated-gcash-payment
{
  "order_id": 123,
  "amount": 1000,
  "customer_name": "Maria Santos",
  "customer_email": "maria@example.com",
  "customer_phone": "+639123456789",
  "items": [
    {
      "name": "Vanilla Ice Cream",
      "quantity": 2,
      "price": 500
    }
  ],
  "commission_rate": 5.0
}
```

**Example Response:**
```javascript
{
  "success": true,
  "invoice": {
    "id": "inv_abc123",
    "amount": 1000,
    "invoice_url": "https://checkout.xendit.co/web/abc123",
    "mobile_url": "https://checkout.xendit.co/mobile/abc123",
    "qr_code_url": "https://qr.xendit.co/abc123.png",
    "status": "PENDING",
    "payment_details": {
      "total_amount": 1000,
      "platform_commission": 50,
      "vendor_amount": 950,
      "commission_rate": 5
    }
  },
  "vendor": {
    "name": "Cool Treats",
    "gcash_masked": "+639****6789"
  }
}
```

#### 2. Webhook Handler
**File:** `backend/src/controller/paymentController.js`

**Endpoint:** `/api/payment/webhook`

**What it does:**
- Receives Xendit webhook when payment is made
- Verifies webhook signature
- Updates order status automatically
- Confirms payment to customer

**Webhook Events:**
- `PAID` → Order confirmed, payment status set to 'paid'
- `EXPIRED` → Payment failed, order remains pending
- `SETTLED` → Payment completed

#### 3. Xendit Service
**File:** `backend/src/services/xenditService.js`

**Method:** `createSplitPaymentInvoice()`

**What it does:**
- Creates invoice with Xendit
- Configures split payment:
  - Platform: 5% commission
  - Vendor: 95% to their GCash
- Returns invoice URLs and QR code

**Split Payment Configuration:**
```javascript
{
  split_payment: {
    enabled: true,
    recipients: [
      {
        type: 'VENDOR',
        amount: 950,  // 95% of 1000
        gcash_number: '+639171234567',
        description: 'Payment to Cool Treats'
      }
    ]
  },
  fees: [
    {
      type: 'ADMIN',
      value: 50  // 5% platform commission
    }
  ]
}
```

### Frontend Components

#### 1. Integrated Payment Component
**File:** `frontend/src/components/payment/IntegratedGCashPayment.jsx`

**Features:**
- Mobile/desktop detection
- Automatic GCash app opening on mobile
- QR code display on desktop
- Payment status polling
- Real-time updates

**Usage:**
```jsx
import IntegratedGCashPayment from './components/payment/IntegratedGCashPayment';

<IntegratedGCashPayment
  orderId={123}
  amount={1000}
  customerInfo={{
    name: 'Maria Santos',
    email: 'maria@example.com',
    phone: '+639123456789'
  }}
  items={[...]}
  onPaymentSuccess={(invoice) => {
    // Handle success
    navigate('/payment/success/' + orderId);
  }}
  onPaymentError={(error) => {
    // Handle error
    console.error(error);
  }}
  onCancel={() => {
    // Handle cancel
    navigate('/orders');
  }}
/>
```

#### 2. Payment Page
**File:** `frontend/src/pages/customer/IntegratedGCashPayment.jsx`

**Route:** `/customer/integrated-gcash-payment/:orderId`

**Features:**
- Order summary display
- Mobile/desktop optimized layout
- Payment component integration
- Success/error handling

---

## 🧪 Testing Guide

### Prerequisites

1. **Xendit Account Setup**
   - Sign up at https://xendit.co
   - Get API keys (test mode)
   - Add to `.env`:
     ```
     XENDIT_PUBLIC_KEY=xnd_public_development_...
     XENDIT_SECRET_KEY=xnd_development_...
     XENDIT_WEBHOOK_SECRET=your_webhook_secret
     ```

2. **Vendor Setup**
   - Create vendor account
   - Go to `/vendor/gcash-account`
   - Enter GCash number: `09123456789`
   - Save (system formats to `+639123456789`)

3. **Database Check**
   ```sql
   -- Verify vendor GCash number is saved
   SELECT * FROM vendor_gcash_qr WHERE vendor_id = 1;
   
   -- Should show:
   -- gcash_number: +639123456789
   -- business_name: Store Name
   -- is_active: 1
   ```

### Test Scenario 1: Desktop Payment Flow

1. **Place Order** (as customer)
   - Browse vendor store
   - Add items to cart
   - Proceed to checkout
   - Complete order

2. **Initiate Payment**
   - Navigate to: `/customer/integrated-gcash-payment/{orderId}`
   - Or create button in checkout:
     ```jsx
     <button onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}`)}>
       Pay with GCash (Integrated)
     </button>
     ```

3. **Expected Behavior:**
   - Loading indicator appears
   - QR code displays
   - Amount shows ₱X,XXX.XX
   - Instructions displayed

4. **Complete Payment:**
   - Open GCash app on phone
   - Tap "Scan QR"
   - Scan QR code
   - Confirm payment
   - Page automatically updates to success

5. **Verify:**
   - Order status: `confirmed`
   - Payment status: `paid`
   - Payment method: `gcash_integrated`
   - Check database:
     ```sql
     SELECT * FROM orders WHERE order_id = X;
     SELECT * FROM payment_intents WHERE order_id = X;
     ```

### Test Scenario 2: Mobile Payment Flow

1. **Place Order** (from mobile device)
   - Use phone to browse vendor store
   - Add items to cart
   - Proceed to checkout

2. **Initiate Payment**
   - Click "Pay with GCash"
   - System detects mobile device

3. **Expected Behavior:**
   - "Open GCash App" button appears
   - Click button
   - **GCash app opens automatically**
   - Payment details pre-filled
   - Amount: ₱X,XXX.XX

4. **Complete Payment:**
   - Confirm payment in GCash app
   - Automatically redirected back to website
   - Success page displays

5. **Alternative:**
   - If auto-open fails, tap "Show QR Code Instead"
   - QR code displays
   - Proceed as desktop flow

### Test Scenario 3: Split Payment Verification

1. **Check Xendit Dashboard**
   - Login to https://dashboard.xendit.co
   - Go to Invoices
   - Find your payment
   - Verify split payment details:
     - Total: ₱1,000
     - Platform fee: ₱50 (5%)
     - Vendor receives: ₱950

2. **Check Database**
   ```sql
   SELECT 
     order_id,
     amount,
     metadata
   FROM payment_intents
   WHERE order_id = X;
   ```

   Metadata should show:
   ```json
   {
     "vendor_gcash": "+639123456789",
     "commission_rate": 5,
     "platform_commission": 50,
     "vendor_amount": 950
   }
   ```

### Test Scenario 4: Webhook Testing

1. **Setup Webhook Endpoint**
   - Expose local server (use ngrok):
     ```bash
     ngrok http 3001
     ```
   - Copy HTTPS URL: `https://abc123.ngrok.io`

2. **Configure Xendit Webhook**
   - Go to Xendit Dashboard → Settings → Webhooks
   - Add webhook: `https://abc123.ngrok.io/api/payment/webhook`
   - Select events: `invoice.paid`, `invoice.expired`

3. **Test Payment**
   - Make payment as customer
   - Monitor backend logs:
     ```bash
     npm run dev
     ```
   - Should see:
     ```
     🔐 Webhook signature verification: VALID
     ✅ Payment succeeded for order 123
     ```

4. **Verify Database Update**
   ```sql
   SELECT 
     order_id,
     status,
     payment_status,
     updated_at
   FROM orders
   WHERE order_id = X;
   ```

   Should show:
   - status: `confirmed`
   - payment_status: `paid`
   - updated_at: recent timestamp

### Test Scenario 5: Error Handling

1. **Vendor Without GCash**
   - Create order for vendor without GCash setup
   - Try to pay
   - Expected: Error message
     > "Vendor has not set up GCash payment. Please contact the vendor."

2. **Invalid Amount**
   - Send request with amount = 0
   - Expected: Error
     > "Valid amount is required"

3. **Payment Expiry**
   - Create payment
   - Wait 1 hour (invoice expires)
   - Expected: Payment status → `expired`
   - Order remains pending

4. **Network Error**
   - Disconnect internet
   - Try to create payment
   - Expected: Error message displays
   - Retry button available

---

## 🚀 Deployment Checklist

### Backend

- [ ] Set Xendit API keys in production environment
- [ ] Configure webhook URL: `https://yourdomain.com/api/payment/webhook`
- [ ] Set webhook secret in Xendit dashboard
- [ ] Test webhook with Xendit test payment
- [ ] Verify split payment configuration
- [ ] Set up monitoring for webhook failures

### Frontend

- [ ] Update `REACT_APP_API_URL` for production
- [ ] Test mobile flow on real devices (iOS & Android)
- [ ] Test desktop flow on different browsers
- [ ] Verify QR code displays correctly
- [ ] Test payment success/error flows
- [ ] Add analytics tracking for payment events

### Database

- [ ] Verify `vendor_gcash_qr` table exists
- [ ] Ensure all vendors have GCash numbers
- [ ] Backup existing payment data
- [ ] Test split payment metadata storage

### Xendit

- [ ] Switch from test mode to live mode
- [ ] Update API keys to production keys
- [ ] Configure production webhook URL
- [ ] Test live payment with small amount
- [ ] Enable 2FA on Xendit account
- [ ] Set up email notifications for payments

---

## 🔍 Troubleshooting

### Issue: GCash app doesn't open on mobile

**Solution:**
- Check if `mobile_url` is returned from API
- Verify URL format: `https://checkout.xendit.co/mobile/...`
- Test on different browsers (Chrome, Safari)
- Fallback: Show QR code instead

### Issue: Webhook not receiving events

**Solutions:**
1. Check webhook URL is accessible publicly
2. Verify webhook secret matches in `.env`
3. Check Xendit dashboard for webhook logs
4. Test webhook with Xendit's test tool
5. Ensure endpoint returns 200 OK

### Issue: Payment confirmed but order not updated

**Solutions:**
1. Check webhook signature verification
2. Verify order ID in webhook payload
3. Check database connection
4. Review backend logs for errors
5. Manually trigger webhook from Xendit dashboard

### Issue: Wrong amount sent to vendor

**Solutions:**
1. Check commission_rate in request (should be 5.0)
2. Verify split payment calculation
3. Check Xendit dashboard for payment details
4. Review vendor_amount in payment_intents metadata

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Payment Success Rate**
   ```sql
   SELECT 
     COUNT(*) as total_payments,
     SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as successful,
     (SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
   FROM payment_intents
   WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
   ```

2. **Average Payment Time**
   ```sql
   SELECT 
     AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_minutes
   FROM payment_intents
   WHERE status = 'PAID';
   ```

3. **Mobile vs Desktop Usage**
   - Track via analytics
   - Monitor which flow is used more
   - Optimize accordingly

4. **Commission Revenue**
   ```sql
   SELECT 
     SUM(amount * 0.05) as total_commission
   FROM payment_intents
   WHERE status = 'PAID'
   AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
   ```

---

## 🎯 Best Practices

### For Vendors
1. **Keep GCash number updated**
2. **Test payment flow before going live**
3. **Monitor payment notifications**
4. **Respond to payment issues quickly**

### For Platform Admin
1. **Monitor webhook success rate**
2. **Set up alerts for payment failures**
3. **Review split payment calculations regularly**
4. **Keep Xendit API keys secure**
5. **Test payment flow after each deployment**

### For Customers
1. **Use mobile for fastest checkout**
2. **Ensure GCash app is updated**
3. **Check payment amount before confirming**
4. **Keep transaction receipts**

---

## 📞 Support

### For Payment Issues
- Check Xendit status: https://status.xendit.co
- Contact Xendit support: support@xendit.co
- Check webhook logs in Xendit dashboard

### For Technical Issues
- Review backend logs
- Check database connections
- Verify API keys are correct
- Test with Xendit's test tools

---

## 🎉 Success!

Your integrated GCash payment system is now ready to use!

**Next Steps:**
1. Test the complete flow
2. Train vendors on the new system
3. Announce to customers
4. Monitor payment metrics
5. Gather feedback and iterate

---

## 📚 Additional Resources

- [Xendit Documentation](https://docs.xendit.co)
- [Xendit Split Payment Guide](https://docs.xendit.co/split-payment)
- [GCash Business API](https://docs.mynt.xyz)
- [Webhook Security Best Practices](https://docs.xendit.co/webhooks/security)

