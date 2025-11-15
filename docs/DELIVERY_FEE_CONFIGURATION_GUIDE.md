# 📍 Delivery Fee Configuration Guide

## Overview
This guide shows **vendors** how to configure delivery fees for different locations (cities/provinces) in your ChillNet account.

---

## 🎯 Why Configure Delivery Fees?

- ✅ **Charge customers** based on their delivery location
- ✅ **Cover your delivery costs** (gas, driver, distance)
- ✅ **Offer free delivery** to nearby areas
- ✅ **Set different prices** for different cities
- ✅ **Automatic calculation** at checkout

---

## 📊 How It Works

### Customer Experience:
```
1. Customer adds items to cart
2. Goes to checkout
3. Enters delivery address
4. System checks their city/province
5. Finds matching delivery zone
6. Adds delivery fee to total
7. Shows total amount including delivery
```

### Example:
- **Customer Address:** Manila, Metro Manila
- **Your Delivery Zones:**
  - Manila, Metro Manila: ₱50
  - Quezon City, Metro Manila: ₱80
  - Cebu City, Cebu: ₱150
- **Result:** Delivery fee = ₱50

---

## 🛠️ How to Configure Delivery Fees

### Step 1: Access Vendor Dashboard

1. **Log in** to your vendor account
2. Go to **Vendor Dashboard**
3. Look for **"Settings"** or **"Delivery Pricing"** section

### Step 2: Navigate to Delivery Zones

In your vendor dashboard, you should see a section for managing delivery zones, typically under:
- **"Delivery Zones"** tab
- **"Pricing & Delivery"** section
- **"Settings"** → **"Delivery Areas"**

### Step 3: Add Delivery Zones

Click **"Add Delivery Zone"** or **"+ Add Zone"** button

You'll see a form with these fields:

```
┌────────────────────────────────────┐
│ Add Delivery Zone                  │
├────────────────────────────────────┤
│ City:     [Enter city name]        │
│ Province: [Enter province name]    │
│ Price:    [₱ 0.00]                 │
│                                    │
│ [Cancel]  [Add Zone]               │
└────────────────────────────────────┘
```

**Fill in:**
- **City:** e.g., "Manila", "Quezon City", "Makati"
- **Province:** e.g., "Metro Manila", "Cebu", "Laguna"
- **Delivery Price:** e.g., "50", "80", "150"

### Step 4: Save Your Zones

After adding all your delivery zones, click **"Save"** or **"Update Delivery Pricing"**

---

## 📝 Configuration Examples

### Example 1: Metro Manila Vendor
```
City               | Province        | Delivery Fee
-------------------|-----------------|-------------
Manila             | Metro Manila    | ₱50
Quezon City        | Metro Manila    | ₱50
Makati             | Metro Manila    | ₱50
Pasig              | Metro Manila    | ₱60
Mandaluyong        | Metro Manila    | ₱60
Taguig             | Metro Manila    | ₱80
Las Piñas          | Metro Manila    | ₱100
```

### Example 2: Provincial Vendor (Cebu)
```
City               | Province        | Delivery Fee
-------------------|-----------------|-------------
Cebu City          | Cebu            | ₱50
Mandaue            | Cebu            | ₱60
Lapu-Lapu          | Cebu            | ₱80
Talisay            | Cebu            | ₱70
Minglanilla        | Cebu            | ₱100
```

### Example 3: Multi-Province Vendor
```
City               | Province        | Delivery Fee
-------------------|-----------------|-------------
Manila             | Metro Manila    | ₱50
Quezon City        | Metro Manila    | ₱50
San Pedro          | Laguna          | ₱150
Biñan              | Laguna          | ₱150
Bacoor             | Cavite          | ₱180
Imus               | Cavite          | ₱200
```

---

## 💡 Best Practices

### 1. **Group Nearby Areas**
Don't set individual prices for every barangay. Group nearby cities:
```
✅ Good:
- Manila, Metro Manila: ₱50
- Quezon City, Metro Manila: ₱50

❌ Too detailed:
- Manila - Ermita, Metro Manila: ₱45
- Manila - Malate, Metro Manila: ₱50
- Manila - Paco, Metro Manila: ₱48
```

### 2. **Consider Distance**
Price based on distance from your shop:
```
Near (0-5km):   ₱30-50
Medium (5-15km): ₱60-100
Far (15km+):    ₱150-300
```

### 3. **Offer Free Delivery**
Set ₱0 for nearby areas to attract more customers:
```
City               | Province        | Delivery Fee
-------------------|-----------------|-------------
Your City          | Your Province   | ₱0 (FREE!)
Nearby City        | Your Province   | ₱30
```

### 4. **Round Numbers**
Use round numbers for easier customer understanding:
```
✅ Good: ₱50, ₱100, ₱150
❌ Avoid: ₱47.50, ₱83.25, ₱126.80
```

### 5. **Consider Competition**
Check competitor delivery fees in your area:
```
If competitors charge ₱80-100:
- You can charge ₱70 (more competitive)
- Or ₱100 (standard rate)
- Or ₱50 (promotional rate)
```

---

## 🔍 What Happens at Checkout?

### Automatic Matching:
The system uses **smart address matching** to find the right delivery fee:

1. **Exact Match** (Best)
   - Customer: "Manila, Metro Manila"
   - Your Zone: "Manila, Metro Manila"
   - ✅ Perfect match → Uses your set price

2. **Fuzzy Match** (Good)
   - Customer: "manla, metro manila" (typo)
   - Your Zone: "Manila, Metro Manila"
   - ✅ System fixes typo → Uses your set price

3. **Province Match** (Fallback)
   - Customer: "Parañaque, Metro Manila" (not in your list)
   - Your Zone: "Metro Manila" (any city)
   - ✅ Uses province default

4. **No Match** (Default)
   - Customer: "Cebu City, Cebu"
   - Your Zones: Only Metro Manila areas
   - ❌ No match → **₱0** (Free delivery as fallback)

**💡 Pro Tip:** Always add common cities where you want to deliver!

---

## 🚨 Common Issues & Solutions

### Issue 1: Delivery Fee Shows ₱0
**Cause:** Customer's city/province not in your delivery zones

**Solution:**
1. Ask customer for their exact address
2. Check if their city is in your list
3. If not, add their city with appropriate fee
4. Ask them to refresh checkout page

### Issue 2: Wrong Delivery Fee Applied
**Cause:** Similar city names or spelling differences

**Solution:**
1. Make sure city and province names are exact
2. Use proper capitalization: "Manila" not "manila"
3. Check for typos in your configured zones

### Issue 3: Can't See Delivery Zones Section
**Cause:** May not have access or feature not enabled

**Solution:**
1. Make sure you're logged in as **Vendor** (not Customer/Admin)
2. Check your **subscription plan** (some features may be limited)
3. Look in **Settings** or **Dashboard** tabs
4. Contact support if still not visible

---

## 📍 Database Structure (Technical)

Your delivery zones are stored in: `vendor_delivery_pricing` table

```sql
Columns:
- delivery_pricing_id (Auto)
- vendor_id (Your vendor ID)
- city (City name)
- province (Province name)
- delivery_price (Fee amount)
- is_active (1 = active, 0 = inactive)
- created_at (When added)
- updated_at (Last modified)
```

---

## 🔧 API Endpoints (Technical)

### Get Your Delivery Zones:
```
GET /api/vendor/delivery/{vendor_id}/pricing
```

### Update Delivery Zones:
```
PUT /api/vendor/delivery/{vendor_id}/pricing
Body: {
  "delivery_zones": [
    {"city": "Manila", "province": "Metro Manila", "delivery_price": 50},
    {"city": "Quezon City", "province": "Metro Manila", "delivery_price": 50}
  ]
}
```

### Add Single Zone:
```
POST /api/vendor/delivery/{vendor_id}/zone
Body: {
  "city": "Makati",
  "province": "Metro Manila",
  "delivery_price": 60
}
```

---

## 📋 Checklist for Setting Up

- [ ] Identify all cities/areas you want to deliver to
- [ ] Calculate delivery costs for each area (gas, time, distance)
- [ ] Add profit margin to cover expenses
- [ ] Log in to vendor dashboard
- [ ] Navigate to delivery zones section
- [ ] Add each city with appropriate delivery fee
- [ ] Save your delivery zones
- [ ] Test with a sample order from each area
- [ ] Monitor and adjust fees based on actual costs

---

## 💰 Pricing Strategy Tips

### Factor in These Costs:
1. **Gas/Fuel:** ₱50-100 per trip
2. **Driver Time:** ₱100-200 per hour
3. **Vehicle Wear:** ₱20-50 per trip
4. **Packaging:** ₱10-30 per order
5. **Profit Margin:** 20-30% markup

### Example Calculation:
```
City: Quezon City (10km away)
- Gas cost: ₱70
- Driver time (30 min): ₱50
- Vehicle wear: ₱30
- Packaging: ₱20
- Subtotal: ₱170
- Add 20% margin: ₱34
----------------------------
Total Delivery Fee: ₱200

You might charge: ₱180-220
```

---

## 🎯 Quick Start Template

### For Metro Manila Vendors:
```
Copy and paste these zones to get started:

Manila, Metro Manila - ₱50
Quezon City, Metro Manila - ₱60
Makati, Metro Manila - ₱70
Pasig, Metro Manila - ₱70
Mandaluyong, Metro Manila - ₱60
Taguig, Metro Manila - ₱80
Muntinlupa, Metro Manila - ₱100
Parañaque, Metro Manila - ₱90
Las Piñas, Metro Manila - ₱100
Caloocan, Metro Manila - ₱80
Malabon, Metro Manila - ₱80
Navotas, Metro Manila - ₱90
Valenzuela, Metro Manila - ₱90
San Juan, Metro Manila - ₱60
Marikina, Metro Manila - ₱70
Pasay, Metro Manila - ₱80
```

Adjust prices based on YOUR distance from each city!

---

## 📞 Need Help?

If you need assistance setting up delivery fees:

1. **Check this guide** - Most questions are answered here
2. **Contact Admin** - Through your vendor dashboard
3. **Watch Tutorial** - Video guides (if available)
4. **Test First** - Always test with a sample order

---

## ✅ Success Indicators

You've configured delivery fees correctly when:
- ✅ Customers see delivery fee at checkout
- ✅ Fee amount matches your configured price
- ✅ Different cities show different fees
- ✅ Total amount = Subtotal + Delivery Fee
- ✅ Orders complete successfully

---

**Last Updated:** November 2024  
**For:** ChillNet Vendors  
**Support:** Contact your ChillNet administrator

---

**Remember:** 
- Start with fewer zones and expand gradually
- Monitor customer feedback on delivery fees
- Adjust prices seasonally (gas prices, traffic)
- Offer promotions (free delivery over ₱500, etc.)

