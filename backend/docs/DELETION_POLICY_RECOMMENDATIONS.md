# Data Deletion Policy Recommendations

## ⚠️ Current Issue

The current deletion implementation **deletes orders and financial records**, which is **NOT recommended** for the following reasons:

### Why NOT Delete Orders/Financial Records:

1. **Legal/Compliance Requirements**
   - Tax authorities require financial records to be kept (typically 7+ years)
   - Auditing purposes
   - Legal disputes may require historical data

2. **Customer Experience**
   - Customers who placed orders with deleted vendors should still see their order history
   - Deleting orders breaks customer order history
   - Customers may need to reference past orders for returns/refunds

3. **Business Analytics**
   - Historical sales data is valuable for business insights
   - Trend analysis requires historical data
   - Financial reporting needs complete records

4. **Data Integrity**
   - Deleting orders breaks referential integrity
   - Other customers' reviews become orphaned
   - Payment records become incomplete

## ✅ Recommended Approach: Soft Delete + Anonymization

### What Should Be Deleted (Hard Delete):
- ✅ User account credentials (email, password, username)
- ✅ Personal information (name, contact, birth date)
- ✅ Vendor profile data (store name, business permit, valid ID)
- ✅ Vendor products and flavors (no longer available)
- ✅ Cart items (temporary data)
- ✅ Notifications (personal to user)
- ✅ Vendor QR codes and payment setup

### What Should Be Kept (Soft Delete/Anonymize):
- ✅ **Orders** - Keep but anonymize vendor reference
- ✅ **Order Items** - Keep for order history
- ✅ **Payment Records** - Keep for financial/legal compliance
- ✅ **Reviews** - Keep reviews from other customers
- ✅ **Transaction History** - Keep for audit trail

## 🔧 Implementation Strategy

### Option 1: Soft Delete (Recommended)
```sql
-- Instead of DELETE, mark as deleted
UPDATE users SET 
    deleted_at = NOW(),
    email = CONCAT('deleted_', user_id, '@deleted.local'),
    fname = 'Deleted',
    lname = 'User',
    status = 'deleted'
WHERE user_id = ?;

UPDATE vendors SET 
    deleted_at = NOW(),
    store_name = CONCAT('Deleted Store #', vendor_id),
    status = 'deleted'
WHERE user_id = ?;
```

### Option 2: Anonymize + Keep Records
```sql
-- Anonymize personal data but keep orders
UPDATE users SET 
    email = CONCAT('deleted_', user_id, '@deleted.local'),
    fname = 'Deleted',
    lname = 'User',
    password = NULL,
    contact_no = NULL
WHERE user_id = ?;

-- Keep orders but set vendor_id to NULL (if foreign key allows)
UPDATE orders SET vendor_id = NULL WHERE vendor_id = ?;
-- Then delete vendor record
DELETE FROM vendors WHERE vendor_id = ?;
```

### Option 3: Archive Table
```sql
-- Move to archive table instead of deleting
INSERT INTO users_archive SELECT * FROM users WHERE user_id = ?;
INSERT INTO vendors_archive SELECT * FROM vendors WHERE user_id = ?;
-- Then anonymize active records
UPDATE users SET email = CONCAT('deleted_', user_id, '@deleted.local') WHERE user_id = ?;
```

## 📋 Recommended Changes

### Keep These Records:
1. **Orders** - Set `vendor_id` to NULL or keep reference
2. **Order Items** - Keep for order history
3. **Payment Transactions** - Never delete financial records
4. **Payment Intents** - Keep for payment reconciliation
5. **Reviews** - Keep reviews from other customers
6. **Subscription Payments** - Keep for financial records

### Delete/Anonymize These:
1. **User Account** - Anonymize personal data
2. **Vendor Profile** - Delete vendor record
3. **Products** - Delete (no longer available)
4. **Flavors** - Delete vendor-specific flavors
5. **Cart Items** - Delete (temporary)
6. **Notifications** - Delete (personal)

## 🎯 Best Practice Implementation

```javascript
// Recommended deletion flow:
1. Anonymize user personal data (email, name, contact)
2. Delete vendor record (cascade will handle some relations)
3. Delete products/flavors (no longer available)
4. Set orders.vendor_id = NULL (keep order history)
5. Keep payment records intact
6. Keep reviews intact (from other customers)
```

## ⚖️ Legal Considerations

- **GDPR**: Right to be forgotten vs. legal retention requirements
- **Tax Law**: Financial records must be kept (typically 7 years)
- **Business Records**: Keep for audit purposes
- **Customer Rights**: Customers should see their order history

## 🔒 Security Considerations

- Anonymize personal data immediately
- Remove access credentials
- Keep financial records for compliance
- Log all deletion activities

