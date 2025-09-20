# 🏠 Primary Address System Tutorial

## Complete Flow: Database → Backend → Frontend

This tutorial shows you exactly where and how the primary address system is implemented in your codebase.

---

## 🗄️ **1. Database Layer**

### **Tables Structure:**
```sql
-- Users can have a primary address
users (
    user_id INT PRIMARY KEY,
    email VARCHAR(100),
    primary_address_id INT,  -- Points to main address
    FOREIGN KEY (primary_address_id) REFERENCES addresses(address_id)
)

-- Vendors can have a primary business address  
vendors (
    vendor_id INT PRIMARY KEY,
    user_id INT,
    store_name VARCHAR(50),
    primary_address_id INT,  -- Points to business location
    FOREIGN KEY (primary_address_id) REFERENCES addresses(address_id)
)

-- Structured addresses
addresses (
    address_id INT PRIMARY KEY,
    unit_number VARCHAR(50),
    street_name VARCHAR(100),
    barangay VARCHAR(100),
    cityVillage VARCHAR(100),
    province VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(10),
    landmark VARCHAR(200)
)

-- Users can have multiple addresses with labels
user_addresses (
    user_id INT,
    address_id INT,
    address_label VARCHAR(50),  -- 'Home', 'Work', etc.
    is_default TINYINT(1)       -- Default for UI selection
)
```

---

## 🔧 **2. Backend Implementation**

### **A. Address Model** (`backend/src/model/shared/addressModel.js`)

```javascript
// Set primary address for user or vendor
setPrimaryAddress: async (userId, addressId, tableName = 'users') => {
    const idColumn = tableName === 'users' ? 'user_id' : 'vendor_id';
    const query = `UPDATE ${tableName} SET primary_address_id = ? WHERE ${idColumn} = ?`;
    const [result] = await pool.query(query, [addressId, userId]);
    return result.affectedRows > 0;
}

// Get primary address for user or vendor
getPrimaryAddress: async (userId, tableName = 'users') => {
    const idColumn = tableName === 'users' ? 'user_id' : 'vendor_id';
    const query = `
        SELECT a.* 
        FROM addresses a
        INNER JOIN ${tableName} t ON a.address_id = t.primary_address_id
        WHERE t.${idColumn} = ? AND a.is_active = 1
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0] || null;
}
```

### **B. API Routes** (`backend/src/routes/shared/addressRoutes.js`)

```javascript
// Set primary address endpoint
router.put('/user/:userId/primary-address/:addressId', async (req, res) => {
    const { userId, addressId } = req.params;
    
    // Update user's primary_address_id
    const [result] = await pool.query(
        'UPDATE users SET primary_address_id = ? WHERE user_id = ?',
        [addressId, userId]
    );
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
        success: true, 
        message: 'Primary address updated successfully' 
    });
});

// Get all addresses for a user (includes primary info)
router.get('/user/:userId/addresses', async (req, res) => {
    const [addresses] = await pool.query(`
        SELECT a.*, ua.address_label, ua.is_default
        FROM addresses a
        INNER JOIN user_addresses ua ON a.address_id = ua.address_id
        WHERE ua.user_id = ? AND a.is_active = 1
        ORDER BY ua.is_default DESC, ua.created_at DESC
    `, [userId]);
    
    res.json(addresses);
});
```

---

## 🏪 **3. Vendor Implementation**

### **A. Vendor Registration** (`backend/src/controller/vendor/vendorController.js`)

```javascript
const registerVendor = async (req, res) => {
    // ... user registration code ...
    
    // No address during registration - will be set during vendor setup
    let primaryAddressId = null;
    
    // Insert vendor without primary address initially
    const [vendorResult] = await pool.query(
        'INSERT INTO vendors (store_name, business_permit_url, valid_id_url, proof_image_url, status, user_id, primary_address_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [null, businessPermitUrl, validIdUrl, proofImageUrl, 'pending', userId, primaryAddressId]
    );
}
```

### **B. Vendor Setup** (`frontend/src/pages/vendor/VendorSetup.jsx`)

```javascript
// Step 1: Shop Information
const [shopForm, setShopForm] = useState({
    store_name: '',
    contact_no: '',
    email: ''
});

// Step 2: Address Information  
const [addressData, setAddressData] = useState({
    unit_number: '',
    street_name: '',
    barangay: '',
    cityVillage: '',
    province: '',
    region: '',
    postal_code: '',
    landmark: '',
    address_type: 'business'
});

// Handle address form changes
const handleAddressChange = (newAddressData) => {
    setAddressData(newAddressData);
};

// Submit vendor setup with address
const handleSubmit = async () => {
    try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        
        const formData = new FormData();
        
        // Add shop information
        formData.append('store_name', shopForm.store_name);
        formData.append('contact_no', shopForm.contact_no);
        formData.append('email', shopForm.email);
        
        // Add address information
        Object.keys(addressData).forEach(key => {
            formData.append(key, addressData[key] || '');
        });
        
        // Add profile image if selected
        if (profileImage) {
            formData.append('profile_image', profileImage);
        }
        
        const response = await axios.post(
            `${apiBase}/api/vendor/setup/${vendorId}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        if (response.data.success) {
            setStatus({ type: 'success', message: 'Vendor setup completed successfully!' });
            navigate('/vendor');
        }
    } catch (error) {
        console.error('Vendor setup failed:', error);
        setStatus({ type: 'error', message: 'Setup failed. Please try again.' });
    }
};
```

### **C. Vendor Setup Backend** (`backend/src/controller/vendor/vendorController.js`)

```javascript
const setupVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const addressData = {
            unit_number: req.body.unit_number || '',
            street_name: req.body.street_name,
            barangay: req.body.barangay,
            cityVillage: req.body.cityVillage,
            province: req.body.province,
            region: req.body.region,
            postal_code: req.body.postal_code || '',
            landmark: req.body.landmark || '',
            address_type: req.body.address_type || 'business'
        };
        
        // 1. Create the address
        const addressId = await addressModel.createAddress(addressData);
        
        // 2. Update vendor with store info and primary address
        await pool.query(
            'UPDATE vendors SET store_name = ?, primary_address_id = ? WHERE vendor_id = ?',
            [req.body.store_name, addressId, vendorId]
        );
        
        // 3. Link address to user in user_addresses table
        await addressModel.addUserAddress(vendor.user_id, addressId, 'Business', true);
        
        res.json({
            success: true,
            message: 'Vendor setup completed successfully',
            vendor_id: vendorId,
            address_id: addressId
        });
    } catch (error) {
        console.error('Vendor setup failed:', error);
        res.status(500).json({ error: 'Setup failed' });
    }
};
```

---

## 👤 **4. Customer Implementation**

### **A. Customer Address Management** (`frontend/src/pages/customer/customer.jsx`)

```javascript
// State for managing multiple addresses
const [addresses, setAddresses] = useState([]);
const [showAddressForm, setShowAddressForm] = useState(false);
const [editingAddress, setEditingAddress] = useState(null);

// Fetch all customer addresses
const fetchAddresses = async () => {
    try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const userRaw = sessionStorage.getItem('user');
        const user = JSON.parse(userRaw);
        
        const response = await axios.get(`${apiBase}/api/addresses/user/${user.id}/addresses`);
        setAddresses(response.data || []);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        setAddresses([]);
    }
};

// Set primary address for user
const setPrimaryAddress = async (addressId) => {
    try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const userRaw = sessionStorage.getItem('user');
        const user = JSON.parse(userRaw);
        
        await axios.put(`${apiBase}/api/addresses/user/${user.id}/primary-address/${addressId}`);
        setStatus({ type: 'success', message: 'Primary address updated!' });
        fetchAddresses(); // Refresh addresses
    } catch (error) {
        console.error('Error setting primary address:', error);
        setStatus({ type: 'error', message: 'Failed to set primary address.' });
    }
};

// Address management UI
const AddressManagementUI = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">My Addresses</h3>
            <button 
                onClick={() => setShowAddressForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
            >
                Add New Address
            </button>
        </div>
        
        {addresses.map(address => (
            <div key={address.address_id} className="border p-4 rounded">
                <div className="flex justify-between">
                    <div>
                        <p className="font-semibold">{address.address_label}</p>
                        <p>{formatAddress(address)}</p>
                        {address.is_default && <span className="text-blue-500">Default</span>}
                    </div>
                    <div className="space-x-2">
                        <button onClick={() => setPrimaryAddress(address.address_id)}>
                            Set as Primary
                        </button>
                        <button onClick={() => editAddress(address)}>
                            Edit
                        </button>
                        <button onClick={() => deleteAddress(address.address_id)}>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        ))}
    </div>
);
```

### **B. Checkout Process** (`frontend/src/pages/customer/Checkout.jsx`)

```javascript
// Get primary address for checkout
const fetchUserAddress = async () => {
    try {
        const userRaw = sessionStorage.getItem('user');
        const user = JSON.parse(userRaw);
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        
        // Get all addresses for the user
        const response = await axios.get(`${apiBase}/api/addresses/user/${user.id}/addresses`);
        
        if (response.data && response.data.length > 0) {
            // Priority: Primary → Default → First address
            const primaryAddress = response.data.find(addr => addr.is_primary) || 
                                  response.data.find(addr => addr.is_default) || 
                                  response.data[0];
            
            const addressString = [
                primaryAddress.unit_number,
                primaryAddress.street_name,
                primaryAddress.barangay,
                primaryAddress.cityVillage,
                primaryAddress.province,
                primaryAddress.region,
                primaryAddress.postal_code
            ].filter(Boolean).join(', ');
            
            setUserAddress(addressString);
            setDeliveryAddress(addressString);
            
            // Calculate delivery price based on location
            if (orderData?.vendorId && primaryAddress.cityVillage && primaryAddress.province) {
                fetchDeliveryPrice(orderData.vendorId, primaryAddress.cityVillage, primaryAddress.province);
            }
        } else {
            // No addresses - user needs to add one
            setUserAddress('');
            setDeliveryAddress('');
        }
    } catch (error) {
        console.error('Error fetching user address:', error);
    }
};
```

---

## 🔄 **5. Complete Flow Examples**

### **Vendor Registration → Setup → Address Flow:**

```
1. Vendor Register (vendorRegister.jsx)
   ↓ [User fills registration form]
   POST /api/vendor/register
   ↓ [Creates user + vendor with primary_address_id = null]
   
2. Vendor Setup (VendorSetup.jsx)
   ↓ [User fills shop info + address]
   POST /api/vendor/setup/:vendorId
   ↓ [Creates address + updates vendor.primary_address_id]
   
3. Vendor Dashboard (vendor.jsx)
   ↓ [Shows vendor with business location]
   GET /api/vendor/current
   ↓ [Returns vendor with primary address info]
```

### **Customer Address Management Flow:**

```
1. Customer Settings (customer.jsx)
   ↓ [User clicks "Add Address"]
   POST /api/addresses/user/:userId/address
   ↓ [Creates address + links to user]
   
2. Set Primary Address
   ↓ [User clicks "Set as Primary"]
   PUT /api/addresses/user/:userId/primary-address/:addressId
   ↓ [Updates user.primary_address_id]
   
3. Checkout (Checkout.jsx)
   ↓ [System gets primary address for delivery]
   GET /api/addresses/user/:userId/addresses
   ↓ [Finds primary/default address for order]
```

### **Address Priority Logic:**

```javascript
// How the system chooses which address to use:
const selectAddress = (addresses) => {
    // 1st Priority: Primary address (user.primary_address_id)
    const primaryAddress = addresses.find(addr => addr.is_primary);
    if (primaryAddress) return primaryAddress;
    
    // 2nd Priority: Default address (user_addresses.is_default = 1)
    const defaultAddress = addresses.find(addr => addr.is_default);
    if (defaultAddress) return defaultAddress;
    
    // 3rd Priority: First available address
    return addresses[0] || null;
};
```

---

## 🎯 **6. Key Files to Look At**

### **Backend Files:**
- `backend/src/model/shared/addressModel.js` - Address operations
- `backend/src/routes/shared/addressRoutes.js` - Address API endpoints
- `backend/src/controller/vendor/vendorController.js` - Vendor address handling
- `backend/src/controller/admin/locationController.js` - Admin location management

### **Frontend Files:**
- `frontend/src/pages/vendor/VendorSetup.jsx` - Vendor address setup
- `frontend/src/pages/vendor/vendor.jsx` - Vendor address display
- `frontend/src/pages/customer/customer.jsx` - Customer address management
- `frontend/src/pages/customer/Checkout.jsx` - Address selection for orders
- `frontend/src/components/shared/AddressForm.jsx` - Reusable address form

### **Database Views:**
- `user_formatted_addresses` - Formatted user addresses with labels
- `vendor_locations` - Vendor locations with full address details

---

## 💡 **Key Concepts**

1. **Primary Address** = Official address stored in `users.primary_address_id` or `vendors.primary_address_id`
2. **Default Address** = User's preferred address for UI (stored in `user_addresses.is_default`)
3. **Multiple Addresses** = Users can have many addresses with different labels
4. **Address Priority** = Primary → Default → First available
5. **Vendor Business Location** = Always stored as `vendors.primary_address_id`

This system allows flexible address management while ensuring there's always a "main" address for business operations!

