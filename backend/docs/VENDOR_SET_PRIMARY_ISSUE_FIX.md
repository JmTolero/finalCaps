# 🐛 Vendor "Set Primary" Button Issue - Fix Guide

## 🔍 **Problem Analysis**

The "Set Primary" button in vendor profile is not updating the database due to **incorrect API endpoints**.

---

## ❌ **Current Issues Found**

### **Issue 1: Wrong API Endpoint in `vendor.jsx`**
```javascript
// WRONG - Line 1357 in vendor.jsx
await axios.put(
    `${apiBase}/api/addresses/user/${currentVendor.user_id}/primary-address/${addressId}?table=users`
);
```
**Problem:** Includes unnecessary `?table=users` parameter that the backend doesn't handle.

### **Issue 2: Different Endpoint in `vendor_temp.jsx`**
```javascript
// DIFFERENT - Line 662 in vendor_temp.jsx  
await axios.put(
    `${apiBase}/api/user/${currentVendor.user_id}/primary-address/${addressId}?table=users`
);
```
**Problem:** Uses `/api/user/` instead of `/api/addresses/user/` and also has the unnecessary parameter.

### **Issue 3: Backend Route Expectation**
```javascript
// CORRECT Backend Route - addressRoutes.js line 128
router.put('/user/:userId/primary-address/:addressId', async (req, res) => {
    // Expects: /api/addresses/user/:userId/primary-address/:addressId
    // NO query parameters needed!
}
```

---

## ✅ **The Fix**

### **Step 1: Fix vendor.jsx**
Replace the incorrect API call:

```javascript
// BEFORE (Line ~1357):
await axios.put(
    `${apiBase}/api/addresses/user/${currentVendor.user_id}/primary-address/${addressId}?table=users`
);

// AFTER (Fixed):
await axios.put(
    `${apiBase}/api/addresses/user/${currentVendor.user_id}/primary-address/${addressId}`
);
```

### **Step 2: Fix vendor_temp.jsx (if used)**
Replace the incorrect API call:

```javascript
// BEFORE (Line ~662):
await axios.put(
    `${apiBase}/api/user/${currentVendor.user_id}/primary-address/${addressId}?table=users`
);

// AFTER (Fixed):
await axios.put(
    `${apiBase}/api/addresses/user/${currentVendor.user_id}/primary-address/${addressId}`
);
```

---

## 🔧 **Why This Happens**

1. **Wrong URL Path:** The frontend was calling `/api/user/` but the backend route is at `/api/addresses/user/`
2. **Unnecessary Parameters:** The `?table=users` parameter isn't handled by the backend
3. **Copy-Paste Error:** Looks like code was copied between files with slight variations

---

## 🧪 **How to Test the Fix**

### **Before Fix:**
1. Go to vendor profile → Store Addresses
2. Click "Set Primary" on any address
3. Check browser Network tab → See 404 error
4. Check database → `users.primary_address_id` unchanged

### **After Fix:**
1. Go to vendor profile → Store Addresses  
2. Click "Set Primary" on any address
3. See success message: "Primary address set successfully!"
4. Check database → `users.primary_address_id` updated correctly

### **Database Verification Query:**
```sql
-- Check if primary address was set correctly
SELECT 
    u.user_id,
    u.fname,
    u.primary_address_id,
    a.street_name,
    a.cityVillage,
    a.province
FROM users u
LEFT JOIN addresses a ON u.primary_address_id = a.address_id
WHERE u.user_id = YOUR_VENDOR_USER_ID;
```

---

## 🎯 **Root Cause**

The issue is in the **frontend API calls**, not the backend. The backend route works correctly, but the frontend was calling the wrong endpoints.

**Correct Backend Route:** `/api/addresses/user/:userId/primary-address/:addressId`  
**Frontend Was Calling:** 
- `vendor.jsx`: `/api/addresses/user/:userId/primary-address/:addressId?table=users` ❌
- `vendor_temp.jsx`: `/api/user/:userId/primary-address/:addressId?table=users` ❌

---

## 📝 **Additional Notes**

### **Why Set Primary Address for Vendors?**
- Vendors can have multiple addresses (home, business, warehouse)
- The primary address is used for:
  - Order delivery calculations
  - Business location display
  - Admin location management
  - Customer vendor search by location

### **What Should Happen:**
1. Vendor clicks "Set Primary" on an address
2. Frontend calls correct API endpoint
3. Backend updates `users.primary_address_id` (not `vendors.primary_address_id`)
4. This address becomes the vendor's main address for all operations

### **Important:** 
The primary address is stored in the **users table**, not the vendors table, because it's tied to the user account that can have multiple roles.

