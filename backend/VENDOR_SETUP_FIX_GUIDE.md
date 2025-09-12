# Vendor Setup Location Form Fix Guide

## Problem Summary
The vendor setup location form is failing because of database schema mismatches. The code expects a modern address system with `primary_address_id` columns, but the current database schema has an outdated structure.

## Root Causes Identified

### 1. Database Schema Issues
- **Missing `primary_address_id` column** in `vendors` and `users` tables
- **Outdated `addresses` table structure** (only has `address_text` field)
- **Missing `user_addresses` relationship table**
- **Missing `profile_image_url` column** in vendors table

### 2. API Endpoint Issues
- The vendor setup code calls endpoints that expect the new address system
- Database queries fail because columns don't exist

## Solution Steps

### Step 1: Apply Database Migration
Run the database migration script to fix the schema:

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run the migration script
source fix_vendor_setup_database.sql;
```

### Step 2: Verify Database Changes
After running the migration, verify the changes:

```sql
-- Check if primary_address_id columns exist
DESCRIBE users;
DESCRIBE vendors;

-- Check if new address tables exist
SHOW TABLES LIKE '%address%';

-- Check if profile_image_url column exists in vendors
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'vendors' AND COLUMN_NAME = 'profile_image_url';
```

### Step 3: Test the Vendor Setup Flow
1. **Register a new vendor** using the vendor registration form
2. **Complete the vendor setup** by filling in store details and address
3. **Verify the setup completes successfully**

## Expected Database Structure After Fix

### Users Table
```sql
CREATE TABLE users (
    user_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(45),
    lname VARCHAR(45),
    username VARCHAR(45),
    password VARCHAR(45),
    contact_no VARCHAR(45),
    email VARCHAR(100),
    primary_address_id INT(11),  -- NEW COLUMN
    role VARCHAR(50),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP,
    FOREIGN KEY (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL
);
```

### Vendors Table
```sql
CREATE TABLE vendors (
    vendor_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11),
    primary_address_id INT(11),  -- NEW COLUMN
    store_name VARCHAR(50),
    valid_id_url VARCHAR(100),
    business_permit_url VARCHAR(100),
    profile_image_url VARCHAR(255),  -- NEW COLUMN
    status VARCHAR(45),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (primary_address_id) REFERENCES addresses(address_id) ON DELETE SET NULL
);
```

### Addresses Table (New Structure)
```sql
CREATE TABLE addresses (
    address_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    unit_number VARCHAR(50),
    street_name VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    cityVillage VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    landmark VARCHAR(200),
    address_type ENUM('residential','commercial','business','warehouse') DEFAULT 'residential',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### User Addresses Table (New)
```sql
CREATE TABLE user_addresses (
    user_address_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    address_id INT(11) NOT NULL,
    address_label VARCHAR(50) DEFAULT 'Home',
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE CASCADE
);
```

## API Endpoints That Will Work After Fix

### Vendor Setup Endpoints
- `GET /api/vendor/setup/:vendor_id` - Get vendor data for setup
- `PUT /api/vendor/profile/:vendor_id` - Update vendor profile
- `POST /api/user/:user_id/address` - Create address for vendor
- `GET /api/address/vendor/:vendor_id/addresses` - Get vendor addresses

## Testing Checklist

After applying the fix, test these scenarios:

- [ ] **Vendor Registration**: New vendor can register successfully
- [ ] **Vendor Setup Step 1**: Shop information form works
- [ ] **Vendor Setup Step 2**: Address form works
- [ ] **Address Creation**: Address is saved to database correctly
- [ ] **Profile Image Upload**: Profile image uploads work
- [ ] **Database Relationships**: Foreign key relationships work
- [ ] **Admin Approval**: Admin can see and approve vendors

## Troubleshooting

### If Migration Fails
1. **Check MySQL version compatibility**
2. **Ensure proper permissions** for ALTER TABLE operations
3. **Backup existing data** before running migration
4. **Check for foreign key constraints** that might prevent changes

### If Vendor Setup Still Fails
1. **Check backend server logs** for specific error messages
2. **Verify database connection** is working
3. **Test API endpoints directly** using Postman or similar tools
4. **Check browser console** for frontend errors

### Common Error Messages and Solutions

#### "Column 'primary_address_id' doesn't exist"
- **Solution**: Run the database migration script

#### "Cannot add foreign key constraint"
- **Solution**: Ensure the addresses table exists before adding foreign keys

#### "Table 'user_addresses' doesn't exist"
- **Solution**: The migration script creates this table, ensure it ran successfully

## Database Name Note
Make sure your `.env` file uses the correct database name. Based on the memory, it should be `chill_db`:

```env
db_name=chill_db
```

## Next Steps After Fix
1. **Test the complete vendor flow**
2. **Update any existing vendor records** if needed
3. **Document the new address system** for future development
4. **Consider adding address validation** for better data quality
