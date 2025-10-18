# 🎯 Primary Address System - Real Examples

## Where You Can See It Working in Your App

---

## 🏪 **1. Vendor Side - Complete Flow**

### **A. Vendor Registration** (`/vendor-register`)
```javascript
// Location: frontend/src/pages/vendor/vendorRegister.jsx
// What happens: User registers but NO address is collected yet

const registerVendor = async () => {
    // Only basic info collected:
    - First Name, Last Name
    - Email, Username, Password  
    - Birth Date, Gender
    - Business Documents (ID, Permit, Proof)
    
    // NO ADDRESS collected during registration!
    // vendor.primary_address_id = null at this point
}
```

### **B. Vendor Setup** (`/vendor-setup`)
```javascript
// Location: frontend/src/pages/vendor/VendorSetup.jsx
// What happens: Multi-step setup including business address

// Step 1: Shop Information
<input name="store_name" placeholder="Enter your shop name" />
<input name="contact_no" placeholder="Contact number" />
<input name="email" placeholder="Business email" />

// Step 2: Business Address (THIS IS WHERE PRIMARY ADDRESS IS SET!)
<AddressForm 
    addressData={addressData}
    onAddressChange={handleAddressChange}
    addressType="business"
    required={true}
/>

// Step 3: Profile Picture Upload
<input type="file" accept="image/*" />

// When submitted:
const handleSubmit = async () => {
    // 1. Create structured address in addresses table
    // 2. Update vendor.primary_address_id with new address
    // 3. Link address to user in user_addresses table
    
    await axios.post(`/api/vendor/setup/${vendorId}`, {
        store_name: 'My Ice Cream Shop',
        street_name: '123 Main Street',
        barangay: 'Poblacion',
        cityVillage: 'Makati City',
        province: 'Metro Manila',
        region: 'NCR',
        // ... other address fields
    });
};
```

### **C. Vendor Dashboard** (`/vendor`)
```javascript
// Location: frontend/src/pages/vendor/vendor.jsx
// What happens: Shows vendor's business location

// Fetch vendor data including primary address
const fetchCurrentVendor = async () => {
    const response = await axios.get('/api/vendor/current');
    
    // Response includes:
    {
        vendor_id: 1,
        store_name: "My Ice Cream Shop",
        primary_address_id: 5,  // Points to business address
        user_id: 10,
        // ... other vendor data
    }
};

// Display business location in vendor dashboard
const BusinessLocationCard = () => (
    <div className="bg-white p-4 rounded shadow">
        <h3>Business Location</h3>
        <p>{vendor.full_address}</p>  {/* From vendor_locations view */}
        <button onClick={editBusinessLocation}>Edit Location</button>
    </div>
);
```

---

## 👤 **2. Customer Side - Complete Flow**

### **A. Customer Settings** (`/customer?view=settings`)
```javascript
// Location: frontend/src/pages/customer/customer.jsx
// What happens: Customer manages multiple addresses

// Address Management UI
const AddressSection = () => (
    <div className="space-y-4">
        <h3>My Addresses</h3>
        
        {addresses.map(address => (
            <div key={address.address_id} className="border p-4 rounded">
                <div className="flex justify-between">
                    <div>
                        <p className="font-bold">{address.address_label}</p>
                        <p>{address.street_name}, {address.barangay}</p>
                        <p>{address.cityVillage}, {address.province}</p>
                        
                        {/* Show if this is the default address */}
                        {address.is_default && 
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                Default
                            </span>
                        }
                    </div>
                    
                    <div className="space-x-2">
                        {/* Set as primary address button */}
                        <button 
                            onClick={() => setPrimaryAddress(address.address_id)}
                            className="bg-green-500 text-white px-3 py-1 rounded"
                        >
                            Set as Primary
                        </button>
                        
                        <button onClick={() => editAddress(address)}>Edit</button>
                        <button onClick={() => deleteAddress(address.address_id)}>Delete</button>
                    </div>
                </div>
            </div>
        ))}
        
        <button 
            onClick={() => setShowAddressForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
        >
            Add New Address
        </button>
    </div>
);

// Set primary address function
const setPrimaryAddress = async (addressId) => {
    try {
        // This updates users.primary_address_id
        await axios.put(`/api/addresses/user/${user.id}/primary-address/${addressId}`);
        
        setStatus({ type: 'success', message: 'Primary address updated!' });
        fetchAddresses(); // Refresh to show changes
    } catch (error) {
        setStatus({ type: 'error', message: 'Failed to set primary address.' });
    }
};
```

### **B. Customer Checkout** (`/checkout`)
```javascript
// Location: frontend/src/pages/customer/Checkout.jsx
// What happens: System automatically uses primary address for delivery

const fetchUserAddress = async () => {
    // Get all customer addresses
    const response = await axios.get(`/api/addresses/user/${user.id}/addresses`);
    
    if (response.data && response.data.length > 0) {
        // PRIORITY SYSTEM:
        // 1st: Primary address (user.primary_address_id)
        // 2nd: Default address (user_addresses.is_default = 1) 
        // 3rd: First available address
        
        const primaryAddress = response.data.find(addr => addr.is_primary) || 
                              response.data.find(addr => addr.is_default) || 
                              response.data[0];
        
        // Format address for display
        const addressString = [
            primaryAddress.unit_number,
            primaryAddress.street_name,
            primaryAddress.barangay,
            primaryAddress.cityVillage,
            primaryAddress.province,
            primaryAddress.region
        ].filter(Boolean).join(', ');
        
        // Set as delivery address
        setUserAddress(addressString);
        setDeliveryAddress(addressString);
        
        // Calculate delivery cost based on location
        if (primaryAddress.cityVillage && primaryAddress.province) {
            fetchDeliveryPrice(vendorId, primaryAddress.cityVillage, primaryAddress.province);
        }
    }
};

// Checkout UI shows selected address
const CheckoutAddressDisplay = () => (
    <div className="bg-gray-50 p-4 rounded">
        <h4>Delivery Address</h4>
        <p>{userAddress}</p>  {/* Primary address automatically selected */}
        <button onClick={changeAddress}>Change Address</button>
    </div>
);
```

---

## 🎮 **3. Admin Side - Location Management**

### **A. Admin Vendor Management** (`/admin`)
```javascript
// Location: backend/src/controller/admin/locationController.js
// What happens: Admin can see all vendor locations

// Get all vendor locations using primary addresses
const getAllVendorLocations = async () => {
    const [locations] = await pool.query(`
        SELECT 
            v.vendor_id,
            v.store_name,
            u.fname as vendor_name,
            u.email as vendor_email,
            a.street_name,
            a.barangay,
            a.cityVillage,
            a.province,
            CONCAT_WS(', ', 
                NULLIF(a.unit_number, ''),
                a.street_name,
                a.barangay,
                a.cityVillage,
                a.province
            ) as full_address
        FROM vendors v
        INNER JOIN users u ON v.user_id = u.user_id
        LEFT JOIN addresses a ON v.primary_address_id = a.address_id  -- Using primary address!
        WHERE u.role = 'vendor'
        ORDER BY v.store_name ASC
    `);
    
    return locations;
};
```

### **B. Vendor Location Search**
```javascript
// Search vendors by location using primary addresses
const searchVendorsByLocation = async (searchTerm) => {
    const [results] = await pool.query(`
        SELECT v.vendor_id, v.store_name, a.cityVillage, a.province
        FROM vendors v
        LEFT JOIN addresses a ON v.primary_address_id = a.address_id
        WHERE a.cityVillage LIKE ? OR a.province LIKE ? OR v.store_name LIKE ?
        ORDER BY v.store_name
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    
    return results;
};
```

---

## 📱 **4. Real UI Examples You Can Test**

### **Test Vendor Primary Address:**
1. Go to `/vendor-register` and register a new vendor
2. Go to `/vendor-setup` and complete the setup with address
3. Go to `/vendor` dashboard and see your business location displayed
4. Check database: `vendors.primary_address_id` should point to your address

### **Test Customer Primary Address:**
1. Login as customer and go to `/customer?view=settings`
2. Click "Add New Address" and create multiple addresses
3. Click "Set as Primary" on one of them
4. Go to `/checkout` and see that primary address is auto-selected
5. Check database: `users.primary_address_id` should point to chosen address

### **Test Admin Location View:**
1. Login as admin
2. View vendor management panel
3. See all vendor locations displayed using their primary addresses

---

## 🔍 **5. Database Queries You Can Run**

### **See Vendor Primary Addresses:**
```sql
-- View all vendors with their primary business addresses
SELECT 
    v.vendor_id,
    v.store_name,
    a.street_name,
    a.barangay,
    a.cityVillage,
    a.province,
    CONCAT_WS(', ', a.street_name, a.barangay, a.cityVillage, a.province) as full_address
FROM vendors v
LEFT JOIN addresses a ON v.primary_address_id = a.address_id
WHERE v.store_name IS NOT NULL;
```

### **See Customer Primary Addresses:**
```sql
-- View all customers with their primary addresses
SELECT 
    u.user_id,
    CONCAT(u.fname, ' ', u.lname) as customer_name,
    u.email,
    a.street_name,
    a.cityVillage,
    a.province
FROM users u
LEFT JOIN addresses a ON u.primary_address_id = a.address_id
WHERE u.role = 'customer' AND u.primary_address_id IS NOT NULL;
```

### **See Address Priority in Action:**
```sql
-- Show how checkout would select address for a customer
SELECT 
    ua.user_id,
    a.address_id,
    a.street_name,
    a.cityVillage,
    ua.address_label,
    ua.is_default,
    CASE 
        WHEN u.primary_address_id = a.address_id THEN 'PRIMARY'
        WHEN ua.is_default = 1 THEN 'DEFAULT'
        ELSE 'REGULAR'
    END as address_priority
FROM user_addresses ua
JOIN addresses a ON ua.address_id = a.address_id
JOIN users u ON ua.user_id = u.user_id
WHERE ua.user_id = 1  -- Replace with actual user ID
ORDER BY 
    (u.primary_address_id = a.address_id) DESC,
    ua.is_default DESC,
    ua.created_at ASC;
```

---

## 🎯 **Key Takeaways**

1. **Vendors**: Primary address = Business location (set during vendor setup)
2. **Customers**: Primary address = Preferred delivery address (set in settings)
3. **Checkout**: Automatically uses primary address but allows changes
4. **Admin**: Can view all vendor locations using primary addresses
5. **Priority**: Primary → Default → First available address
6. **Flexibility**: Users can have multiple addresses with different labels

The system is designed to be **smart** (automatically selects best address) but **flexible** (users can override and manage multiple addresses)!

