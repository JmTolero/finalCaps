# COD Remaining Balance Payment Tracking Guide

## 📋 Overview

When a customer selects **Cash on Delivery (COD)** for their remaining balance payment, vendors need to confirm that they collected the cash payment upon delivery. This guide explains how the system tracks and confirms COD payments.

---

## 🔄 How It Works

### Customer Flow:
1. Customer pays 50% initial payment via GCash
2. Customer selects "Cash on Delivery" for remaining balance
3. Order is prepared and delivered
4. **Vendor collects cash on delivery**

### Vendor Flow:
1. **See pending COD payment** in order details
2. **Collect cash** from customer during delivery
3. **Confirm payment collection** in the system
4. Order marked as fully paid

---

## 👀 How Vendors Know COD Payment is Pending

### 1. **In Orders List View**

Orders with pending COD payments will show:
- **Remaining Balance** amount displayed
- **"Customer selected: Cash on Delivery"** message
- **"💰 Mark Remaining Balance as Paid (COD)"** button

### 2. **In Order Details Modal**

When viewing order details:
- **Orange warning box** showing: "⚠️ COD Payment Pending: ₱X.XX"
- **"Please confirm COD payment collection before marking as delivered"** message
- **"💰 Mark Remaining Balance as Paid (COD)"** button

### 3. **When Marking as Delivered**

The system **prevents** marking order as delivered if COD payment is not confirmed:
- **Error message:** "Cannot mark as delivered. COD payment of ₱X.XX is still pending. Please confirm COD payment collection first."
- **Delivery button is disabled** until COD is confirmed

---

## ✅ How to Confirm COD Payment Collection

### Step 1: Collect Cash from Customer
- Collect the exact remaining balance amount
- Example: If remaining balance is ₱1,082.00, collect exactly ₱1,082.00

### Step 2: Confirm in System

**Option A: From Order Details**
1. Open the order details modal
2. Find the "💰 Mark Remaining Balance as Paid (COD)" button
3. Click the button
4. A confirmation modal will appear

**Option B: From Orders List**
1. Find the order in your orders list
2. Look for the "💰 Mark Remaining Balance as Paid (COD)" button
3. Click it to open the confirmation modal

### Step 3: Confirm Amount
1. **COD Payment Confirmation Modal** appears
2. Shows the **expected amount** (remaining balance)
3. Enter the **amount collected** (should match expected amount)
4. Click **"Confirm Payment"** button

### Step 4: System Updates
After confirmation:
- ✅ Order `payment_status` changes to `'paid'`
- ✅ `remaining_balance` set to `0`
- ✅ `remaining_payment_confirmed_at` timestamp recorded
- ✅ Customer receives notification: "Remaining balance of ₱X.XX for order #XXX has been collected via Cash on Delivery"
- ✅ Order can now be marked as delivered

---

## 🔍 Where to Find Pending COD Payments

### In Vendor Dashboard:

1. **Orders Tab**
   - Filter by status: "Ready to Prepare" or "Out for Delivery"
   - Look for orders with:
     - `payment_status = 'partial'`
     - `remaining_balance > 0`
     - `remaining_payment_method = 'cod'`

2. **Order Details**
   - Click "View Details" on any order
   - Check the "Payment" section
   - Look for orange warning boxes

3. **Delivery Modal**
   - When trying to mark as delivered
   - System will show warning if COD is pending

---

## 📊 Database Tracking

The system tracks COD payments in the database:

### Orders Table:
- `payment_status`: `'partial'` → `'paid'` (after COD confirmation)
- `remaining_balance`: `₱X.XX` → `0` (after COD confirmation)
- `remaining_payment_method`: `'cod'` (indicates COD was selected)
- `remaining_payment_confirmed_at`: Timestamp when vendor confirmed
- `remaining_payment_confirmed_by`: `'vendor'`

### QR Payment Transactions Table:
- Creates a record with:
  - `payment_method`: `'cod'`
  - `payment_amount`: Amount collected
  - `payment_status`: `'completed'`
  - `vendor_notes`: "COD payment collected by vendor"

---

## ⚠️ Important Notes

### Amount Validation:
- System validates that collected amount matches expected amount
- Allows small rounding differences (0.01 PHP)
- If amount doesn't match, shows error: "Amount mismatch. Expected ₱X.XX, received ₱Y.YY"

### Cannot Skip Confirmation:
- **Cannot mark order as delivered** until COD is confirmed
- This ensures vendors don't forget to collect payment
- Protects against delivery without payment collection

### Notifications:
- **Customer** receives notification when COD is confirmed
- **Vendor** can see confirmation in order history

---

## 🐛 Troubleshooting

### "Cannot mark as delivered" Error

**Problem:** Delivery button is disabled

**Solution:**
1. Check if order has `remaining_balance > 0`
2. Check if `remaining_payment_method = 'cod'`
3. Click "💰 Mark Remaining Balance as Paid (COD)" button
4. Confirm the payment amount
5. Then you can mark as delivered

### "Amount mismatch" Error

**Problem:** Collected amount doesn't match expected amount

**Solution:**
1. Verify the exact remaining balance amount
2. Enter the exact amount collected
3. Check for any rounding issues
4. Contact support if amount is correct but still shows error

### Button Not Showing

**Problem:** "Mark Remaining Balance as Paid (COD)" button not visible

**Check:**
1. Is `remaining_balance > 0`?
2. Is `remaining_payment_method = 'cod'`?
3. Is `payment_status = 'partial'`?
4. Refresh the page
5. Check browser console for errors

---

## 📱 Example Scenario

**Order Details:**
- Total Amount: ₱2,100.00
- Initial Payment (50%): ₱1,050.00 (via GCash)
- Remaining Balance: ₱1,050.00
- Remaining Payment Method: COD

**Vendor Actions:**
1. Prepare order
2. Deliver to customer
3. Collect ₱1,050.00 cash from customer
4. Open order details
5. Click "💰 Mark Remaining Balance as Paid (COD)"
6. Enter amount: ₱1,050.00
7. Click "Confirm Payment"
8. ✅ Order now shows as fully paid
9. Can mark as delivered

---

## 🔗 Related Files

- **Backend:** `backend/src/controller/shared/orderController.js` - `confirmCODPayment` function
- **Backend Route:** `backend/src/routes/shared/orderRoutes.js` - `/api/orders/:order_id/confirm-cod-payment`
- **Frontend:** `frontend/src/pages/vendor/vendor.jsx` - COD confirmation UI and logic

---

## ✅ Summary

**To track COD remaining balance payments:**

1. ✅ System automatically shows pending COD payments
2. ✅ Vendors see warning indicators in order details
3. ✅ Vendors cannot mark as delivered until COD is confirmed
4. ✅ Vendors click "Mark Remaining Balance as Paid (COD)" button
5. ✅ Enter collected amount and confirm
6. ✅ System updates order to fully paid
7. ✅ Customer receives notification
8. ✅ Order can now be marked as delivered

**The system ensures vendors never forget to collect COD payments!** 💰

