# Primary Address System Explanation

## How Primary Address Works in Your System

### 🏗️ **Database Structure (Expected)**

The primary address system uses a **dual approach**:

#### 1. **Primary Address Reference**
```sql
-- Users table
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(100),
    primary_address_id INT(11),  -- Points to main address
    FOREIGN KEY (primary_address_id) REFERENCES addresses(address_id)
);

-- Vendors table  
CREATE TABLE vendors (
    vendor_id INT PRIMARY KEY,
    user_id INT,
    primary_address_id INT(11),  -- Points to main address
    FOREIGN KEY (primary_address_id) REFERENCES addresses(address_id)
);
```

#### 2. **Multiple Address Relationships**
```sql
-- User can have multiple addresses
CREATE TABLE user_addresses (
    user_id INT,
    address_id INT,
    address_label VARCHAR(50),  -- 'Home', 'Work', etc.
    is_default TINYINT(1),      -- Default address for selection
    PRIMARY KEY (user_id, address_id)
);

-- Structured addresses table
CREATE TABLE addresses (
    address_id INT PRIMARY KEY,
    unit_number VARCHAR(50),
    street_name VARCHAR(100),
    barangay VARCHAR(100),
    cityVillage VARCHAR(100),
    province VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(10),
    landmark VARCHAR(200),
    address_type ENUM('residential','commercial','business','warehouse'),
    is_active TINYINT(1)
);
```

### 🎯 **Primary Address vs Default Address**

| Type | Purpose | Location | Usage |
|------|---------|----------|-------|
| **Primary Address** | Main address for user/vendor | `users.primary_address_id` or `vendors.primary_address_id` | Used for orders, deliveries, official records |
| **Default Address** | User's preferred address in UI | `user_addresses.is_default = 1` | Used in address selection dropdowns |

### 🔧 **How It Works in Code**

#### Backend Functions:

1. **Set Primary Address:**
```javascript
// In addressModel.js
setPrimaryAddress: async (userId, addressId, tableName = 'users') => {
    const query = `UPDATE ${tableName} SET primary_address_id = ? WHERE ${tableName === 'users' ? 'user_id' : 'vendor_id'} = ?`;
    await pool.query(query, [addressId, userId]);
}
```

2. **Get Primary Address:**
```javascript
getPrimaryAddress: async (userId, tableName = 'users') => {
    const query = `
        SELECT a.* 
        FROM addresses a
        INNER JOIN ${tableName} t ON a.address_id = t.primary_address_id
        WHERE t.${tableName === 'users' ? 'user_id' : 'vendor_id'} = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0];
}
```

#### API Endpoints:
- `PUT /api/addresses/user/:userId/primary-address/:addressId` - Set primary address
- `GET /api/addresses/user/:userId/addresses` - Get all addresses (including primary)

#### Frontend Usage:
```javascript
// In checkout, customer pages, etc.
const response = await axios.get(`/api/addresses/user/${user.id}/addresses`);
const primaryAddress = response.data.find(addr => addr.is_primary) || 
                      response.data.find(addr => addr.is_default) || 
                      response.data[0];
```

### 🚨 **Current Problem**

Your **database schema doesn't match** what the code expects:

#### What You Have:
```sql
-- Current database structure
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(100)
    -- ❌ NO primary_address_id column
);

CREATE TABLE vendors (
    vendor_id INT PRIMARY KEY,
    address_id INT(11)  -- ❌ Wrong column name
);

CREATE TABLE addresses (
    address_id INT PRIMARY KEY,
    address_text TEXT   -- ❌ Simple text field only
);
```

#### What Code Expects:
```sql
-- Expected structure
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(100),
    primary_address_id INT(11)  -- ✅ Required
);

CREATE TABLE vendors (
    vendor_id INT PRIMARY KEY,
    primary_address_id INT(11)  -- ✅ Required (not address_id)
);

CREATE TABLE addresses (
    address_id INT PRIMARY KEY,
    unit_number VARCHAR(50),    -- ✅ Structured fields
    street_name VARCHAR(100),
    barangay VARCHAR(100),
    -- ... more structured fields
);

CREATE TABLE user_addresses (  -- ✅ Missing table
    user_id INT,
    address_id INT,
    is_default TINYINT(1)
);
```

### 🛠️ **To Fix This:**

You need to run the migration that adds the missing columns and tables:

1. **Run the migration:** `backend/migrations/implement_primary_address_system.sql`
2. **Or run the fix script:** `backend/fix_vendor_setup_database.sql`

### 📍 **Where Primary Address is Used:**

1. **Vendor Setup:** When vendors register their business location
2. **Order Delivery:** For calculating delivery costs and routes  
3. **Customer Checkout:** For default delivery address
4. **Admin Management:** For vendor location tracking
5. **Search/Filtering:** For location-based vendor discovery

The system allows users to have multiple addresses but designates one as "primary" for official business use.

