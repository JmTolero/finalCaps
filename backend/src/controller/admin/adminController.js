const pool = require('../../db/config');
const { createNotification } = require('../shared/notificationController');
const { User } = require('../../model/shared/userModel');
const { sendVendorApprovalEmail, sendVendorRejectionEmail } = require('../../utils/emailService');

const cleanupVendorDataByUserId = async (userId, providedConnection = null) => {
    const connection = providedConnection || await pool.getConnection();
    const shouldReleaseConnection = !providedConnection;
    
    try {
        if (!providedConnection) {
            await connection.beginTransaction();
        }
        
        const [vendorInfo] = await connection.query(
            'SELECT vendor_id FROM vendors WHERE user_id = ?',
            [userId]
        );

        if (vendorInfo.length === 0) {
            if (!providedConnection) {
                await connection.commit();
            }
            return;
        }

        const vendorId = vendorInfo[0].vendor_id;
        console.log(`Cleaning up vendor data for vendor ID: ${vendorId}`);

        // NOTE: We DO NOT delete payment_history (financial records must be kept)
        // Only delete subscription records, but keep payment history for compliance
        try {
            await connection.query('DELETE FROM subscription_usage WHERE vendor_id = ?', [vendorId]);
            // Keep payment_history - it's a financial record
            // await connection.query('DELETE FROM payment_history WHERE subscription_id IN (SELECT subscription_id FROM vendor_subscriptions WHERE vendor_id = ?)', [vendorId]);
            await connection.query('DELETE FROM vendor_subscriptions WHERE vendor_id = ?', [vendorId]);
            console.log(`✅ Deleted subscription records (payment history preserved for compliance)`);
        } catch (err) {
            console.log('Note: Subscription tables may not exist, skipping:', err.message);
        }

        // Delete daily drum availability
        try {
            await connection.query('DELETE FROM daily_drum_availability WHERE vendor_id = ?', [vendorId]);
        } catch (err) {
            console.log('Note: daily_drum_availability table may not exist, skipping:', err.message);
        }

        // Delete vendor QR codes (both vendor_qr_codes and vendor_gcash_qr)
        try {
            await connection.query('DELETE FROM vendor_qr_codes WHERE vendor_id = ?', [vendorId]);
        } catch (err) {
            console.log('Note: vendor_qr_codes table may not exist, skipping:', err.message);
        }
        try {
            await connection.query('DELETE FROM vendor_gcash_qr WHERE vendor_id = ?', [vendorId]);
        } catch (err) {
            console.log('Note: vendor_gcash_qr table may not exist, skipping:', err.message);
        }

        // NOTE: We DO NOT delete order_items or orders
        // These are kept for:
        // 1. Legal/compliance (tax records, audit trail)
        // 2. Customer order history
        // 3. Financial records
        // Instead, we'll set vendor_id to NULL in orders (if foreign key allows)
        // This preserves order history while removing vendor association
        
        // Set vendor_id to NULL in orders (preserves order history for customers)
        try {
            await connection.query(
                'UPDATE orders SET vendor_id = NULL WHERE vendor_id = ?',
                [vendorId]
            );
            console.log(`✅ Anonymized vendor reference in orders (orders preserved for customer history)`);
        } catch (err) {
            // If foreign key constraint prevents NULL, log but continue
            console.log('Note: Could not set vendor_id to NULL in orders (may have foreign key constraint):', err.message);
        }

        // Delete cart_items that reference this vendor's flavors
        await connection.query(`
            DELETE ci FROM cart_items ci 
            INNER JOIN flavors f ON ci.flavor_id = f.flavor_id 
            WHERE f.vendor_id = ?
        `, [vendorId]);

        // Delete products that reference this vendor's flavors
        await connection.query(`
            DELETE p FROM products p 
            INNER JOIN flavors f ON p.flavor_id = f.flavor_id 
            WHERE f.vendor_id = ?
        `, [vendorId]);

        // Delete products directly linked to this vendor
        await connection.query(
            'DELETE FROM products WHERE vendor_id = ?',
            [vendorId]
        );

        // Delete flavors belonging to this vendor
        await connection.query(
            'DELETE FROM flavors WHERE vendor_id = ?',
            [vendorId]
        );

        // NOTE: We DO NOT delete reviews
        // Reviews from other customers should remain for:
        // 1. Historical accuracy
        // 2. Other customers' feedback
        // 3. Business transparency
        // Instead, we'll anonymize the vendor reference or mark reviews as "vendor deleted"
        
        // Anonymize vendor in reviews (keep reviews but mark vendor as deleted)
        try {
            await connection.query(`
                UPDATE vendor_reviews 
                SET vendor_id = NULL, 
                    review_text = CONCAT(review_text, ' [Vendor account deleted]')
                WHERE vendor_id = ?
            `, [vendorId]);
            console.log(`✅ Anonymized vendor in reviews (reviews preserved)`);
        } catch (err) {
            console.log('Note: Could not update vendor_reviews:', err.message);
        }
        
        try {
            await connection.query(`
                UPDATE reviews 
                SET vendor_id = NULL,
                    review_text = CONCAT(review_text, ' [Vendor account deleted]')
                WHERE vendor_id = ?
            `, [vendorId]);
            console.log(`✅ Anonymized vendor in reviews table`);
        } catch (err) {
            console.log('Note: Could not update reviews table:', err.message);
        }

        // Delete vendor rejection history
        try {
            await connection.query('DELETE FROM vendor_rejections WHERE vendor_id = ?', [vendorId]);
        } catch (err) {
            console.log('Note: vendor_rejections table may not exist, skipping:', err.message);
        }

        // Delete vendor record (this should cascade delete related data due to foreign keys)
        await connection.query(
            'DELETE FROM vendors WHERE vendor_id = ?',
            [vendorId]
        );

        if (!providedConnection) {
            await connection.commit();
        }
        console.log(`✅ Vendor ${vendorId} and all related data deleted successfully`);
        
    } catch (err) {
        if (!providedConnection) {
            await connection.rollback();
        }
        console.error(`❌ Error cleaning up vendor data for user ${userId}:`, err);
        throw err; // Re-throw to let caller handle
    } finally {
        if (shouldReleaseConnection) {
            connection.release();
        }
    }
};

const countTotal = async (req, res) => {
    try{
        const rows = await User.getAll();
        res.json(rows[0]);
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: "Total Users error"});
    }
}

const getAllVendors = async (req, res) => {
    try {
        console.log('Fetching all vendors...');
        
        // Query to get all vendors with their user information
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.primary_address_id as location,
                v.business_permit_url,
                v.valid_id_url,
                v.proof_image_url,
                COALESCE(v.status, 'pending') as status,
                v.user_id,
                v.created_at,
                u.fname,
                u.lname,
                u.email,
                u.contact_no
            FROM vendors v
            LEFT JOIN users u ON v.user_id = u.user_id
            ORDER BY v.created_at DESC
        `);
        
        console.log('Vendors fetched successfully:', vendors.length);
        
        res.json({
            success: true,
            vendors: vendors
        });
        
    } catch (err) {
        console.error('Failed to fetch vendors:', err);
        res.status(500).json({
            error: 'Failed to fetch vendors',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const getVendorById = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        
        console.log('Fetching vendor details for ID:', vendor_id);
        
        // Query to get specific vendor with user information
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.primary_address_id as location,
                v.business_permit_url,
                v.valid_id_url,
                v.proof_image_url,
                v.profile_image_url,
                COALESCE(v.status, 'pending') as status,
                v.user_id,
                v.created_at,
                u.fname,
                u.lname,
                u.username,
                u.email,
                u.contact_no,
                u.birth_date,
                u.gender
            FROM vendors v
            LEFT JOIN users u ON v.user_id = u.user_id
            WHERE v.vendor_id = ?
        `, [vendor_id]);
        
        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }
        
        // If vendor is suspended and this request is from customer (not admin), return 404
        // Check if request is from customer by looking at the referer or user role
        // For now, we'll return the vendor data but customers should handle suspended status in frontend
        
        console.log('Vendor details fetched successfully');
        
        res.json({
            success: true,
            vendor: vendors[0]
        });
        
    } catch (err) {
        console.error('Failed to fetch vendor details:', err);
        res.status(500).json({
            error: 'Failed to fetch vendor details',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const updateVendorStatus = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        const { status } = req.body;
        
        console.log('Updating vendor status:', vendor_id, status);
        
        // Validate status
        if (!['pending', 'approved', 'rejected', 'suspended'].includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status. Must be pending, approved, rejected, or suspended' });
        }
        
        // Get vendor information before updating
        const [vendorInfo] = await pool.query(
            'SELECT v.*, u.fname, u.lname, u.email FROM vendors v LEFT JOIN users u ON v.user_id = u.user_id WHERE v.vendor_id = ?',
            [vendor_id]
        );
        
        if (vendorInfo.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        
        const vendor = vendorInfo[0];
        
        // Update vendor status
        const [result] = await pool.query(
            'UPDATE vendors SET status = ? WHERE vendor_id = ?',
            [status, vendor_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        
        // Create notification based on status change
        if (status.toLowerCase() === 'approved') {
            await createNotification({
                user_id: vendor.user_id,
                user_type: 'vendor',
                title: 'Vendor Application Approved! 🎉',
                message: `Congratulations ${vendor.fname}! Your vendor application has been approved. You can now set up your store and start selling your delicious ice cream! 

Important: To start receiving payments, please complete your GCash QR code setup in Settings → QR Code Setup. This is required before you can manage products and receive customer payments.`,
                notification_type: 'system_announcement',
                related_vendor_id: vendor_id
            });

            // Send approval email
            try {
                const emailResult = await sendVendorApprovalEmail({
                    fname: vendor.fname,
                    email: vendor.email,
                    store_name: vendor.store_name || 'Your Store'
                });
                
                if (emailResult.success) {
                    console.log(`📧 Approval email sent successfully to ${vendor.email}`);
                } else {
                    console.error(`❌ Failed to send approval email to ${vendor.email}:`, emailResult.error);
                }
            } catch (emailError) {
                console.error(`❌ Error sending approval email to ${vendor.email}:`, emailError.message);
                // Don't fail the approval if email fails
            }
        } else if (status.toLowerCase() === 'rejected') {
            // Calculate auto-return date
            // FOR PRODUCTION: Use INTERVAL 7 DAY
            const autoReturnDate = new Date();
            autoReturnDate.setDate(autoReturnDate.getDate() + 7); // 7 days for production
                
            // Record the rejection for auto-return tracking
            // FOR TESTING: Change INTERVAL 7 DAY to INTERVAL 1 MINUTE (or INTERVAL 1 HOUR)
            await pool.query(
                'INSERT INTO vendor_rejections (vendor_id, user_id, auto_return_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
                [vendor_id, vendor.user_id]
            );
            
            // Change user role back to customer when vendor is rejected
            await pool.query(   
                'UPDATE users SET role = "customer" WHERE user_id = ?',
                [vendor.user_id]
            );
            
            await createNotification({
                user_id: vendor.user_id,
                user_type: 'vendor',
                title: 'Vendor Application Needs Review 📋',
                message: `Hello ${vendor.fname}, your vendor application requires some improvements. You can reapply after 1 week (${autoReturnDate.toLocaleDateString()}) to give you time to address any issues.`,
                notification_type: 'system_announcement',
                related_vendor_id: vendor_id
            });

            // Send rejection email
            try {
                const emailResult = await sendVendorRejectionEmail({
                    fname: vendor.fname,
                    email: vendor.email,
                    store_name: vendor.store_name || 'Your Store',
                    rejectionReason: req.body.rejection_reason || 'Application requires additional review and improvements.',
                    autoReturnDate: autoReturnDate.toLocaleDateString()
                });
                
                if (emailResult.success) {
                    console.log(`Rejection email sent successfully to ${vendor.email}`);
                } else {
                    console.error(` Failed to send rejection email to ${vendor.email}:`, emailResult.error);
                }
            } catch (emailError) {
                console.error(` Error sending rejection email to ${vendor.email}:`, emailError.message);
                // Don't fail the rejection if email fails
            }
        }
        
        console.log('Vendor status updated successfully');
        
        res.json({
            success: true,
            message: 'Vendor status updated successfully'
        });
        
    } catch (err) {
        console.error('Failed to update vendor status:', err);
        res.status(500).json({
            error: 'Failed to update vendor status',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const checkVendorOngoingOrders = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        
        console.log('Checking ongoing orders for vendor:', vendor_id);
        
        // Query to get ongoing orders (not delivered, not cancelled)
        const [orders] = await pool.query(`
            SELECT 
                o.order_id,
                o.total_amount,
                o.status,
                o.payment_status,
                o.delivery_datetime,
                o.created_at,
                CONCAT(u.fname, ' ', COALESCE(u.lname, '')) as customer_name,
                u.email as customer_email
            FROM orders o
            LEFT JOIN users u ON o.customer_id = u.user_id
            WHERE o.vendor_id = ?
            AND o.status NOT IN ('delivered', 'cancelled')
            ORDER BY o.created_at DESC
        `, [vendor_id]);
        
        console.log(`Found ${orders.length} ongoing orders for vendor ${vendor_id}`);
        
        res.json({
            success: true,
            hasOngoingOrders: orders.length > 0,
            ongoingOrdersCount: orders.length,
            orders: orders
        });
        
    } catch (err) {
        console.error('Failed to check vendor ongoing orders:', err);
        res.status(500).json({
            error: 'Failed to check vendor ongoing orders',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        console.log('Fetching all users...');
        
        // Query to get all users with their basic information
        const [users] = await pool.query(`
            SELECT 
                u.user_id,
                u.fname,
                u.lname,
                u.username,
                u.email,
                u.contact_no,
                u.role,
                COALESCE(u.status, 'active') as status,
                u.created_at,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.vendor_id
                    ELSE NULL
                END as vendor_id,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.store_name
                    ELSE NULL
                END as store_name,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.status
                    ELSE NULL
                END as vendor_status
            FROM users u
            LEFT JOIN vendors v ON u.user_id = v.user_id
            ORDER BY u.created_at DESC
        `);
        
        console.log('Users fetched successfully:', users.length);
        
        res.json({
            success: true,
            users: users
        });
        
    } catch (err) {
        console.error('Failed to fetch users:', err);
        res.status(500).json({
            error: 'Failed to fetch users',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { user_id } = req.params;
        
        console.log('Fetching user details for ID:', user_id);
        
        // Query to get specific user with detailed information including birth_date, gender, and location
        const [users] = await pool.query(`
            SELECT 
                u.user_id,
                u.fname,
                u.lname,
                u.username,
                u.email,
                u.contact_no,
                u.birth_date,
                u.gender,
                u.role,
                COALESCE(u.status, 'active') as status,
                u.created_at,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.store_name
                    ELSE NULL
                END as store_name,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.status
                    ELSE NULL
                END as vendor_status,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.vendor_id
                    ELSE NULL
                END as vendor_id,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.business_permit_url
                    ELSE NULL
                END as business_permit_url,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.valid_id_url
                    ELSE NULL
                END as valid_id_url,
                CASE 
                    WHEN v.vendor_id IS NOT NULL THEN v.proof_image_url
                    ELSE NULL
                END as proof_image_url,
                CASE 
                    WHEN v.vendor_id IS NOT NULL AND v.primary_address_id IS NOT NULL THEN 
                        CONCAT_WS(', ', 
                            COALESCE(a.unit_number, ''), 
                            a.street_name, 
                            a.barangay, 
                            a.cityVillage, 
                            a.province, 
                            a.region,
                            COALESCE(a.postal_code, '')
                        )
                    ELSE NULL
                END as location
            FROM users u
            LEFT JOIN vendors v ON u.user_id = v.user_id
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            WHERE u.user_id = ?
        `, [user_id]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        console.log('User details fetched successfully');
        
        res.json({
            success: true,
            user: users[0]
        });
        
    } catch (err) {
        console.error('Failed to fetch user details:', err);
        res.status(500).json({
            error: 'Failed to fetch user details',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { fname, lname, username, email, contact_no, birth_date, gender, role } = req.body;
        
        console.log('Updating user:', user_id, req.body);
        
        // Format birth_date for MySQL (convert ISO string to date-only format)
        let formattedBirthDate = null;
        if (birth_date) {
            try {
                // If it's an ISO string, extract just the date part in local time
                if (birth_date.includes('T')) {
                    const date = new Date(birth_date);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    formattedBirthDate = `${year}-${month}-${day}`;
                } else {
                    // If it's already in YYYY-MM-DD format, use as is
                    formattedBirthDate = birth_date;
                }
            } catch (dateError) {
                console.error('Error formatting birth_date:', dateError);
                formattedBirthDate = null;
            }
        }
        
        // Validate required fields
        if (!fname || !email || !role) {
            return res.status(400).json({ error: 'First name, email, and role are required' });
        }
        
        // Check if email already exists for other users
        const [existingEmail] = await pool.query(
            'SELECT user_id FROM users WHERE email = ? AND user_id != ?', 
            [email, user_id]
        );
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        // Check if username already exists for other users (if username provided)
        if (username) {
            const [existingUsername] = await pool.query(
                'SELECT user_id FROM users WHERE username = ? AND user_id != ?', 
                [username, user_id]
            );
            if (existingUsername.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }
        }
        
        // Update user information
        const [result] = await pool.query(
            'UPDATE users SET fname = ?, lname = ?, username = ?, email = ?, contact_no = ?, birth_date = ?, gender = ?, role = ? WHERE user_id = ?',
            [fname, lname || '', username || '', email, contact_no || '', formattedBirthDate, gender || null, role, user_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('User updated successfully');
        
        res.json({
            success: true,
            message: 'User updated successfully'
        });
        
    } catch (err) {
        console.error('Failed to update user:', err);
        res.status(500).json({
            error: 'Failed to update user',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { status } = req.body;
        
        console.log('Updating user status:', user_id, status);
        
        // Validate status
        if (!['active', 'inactive', 'suspended'].includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or suspended' });
        }
        
        // Update user status
        const [result] = await pool.query(
            'UPDATE users SET status = ? WHERE user_id = ?',
            [status, user_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('User status updated successfully');
        
        res.json({
            success: true,
            message: 'User status updated successfully'
        });
        
    } catch (err) {
        console.error('Failed to update user status:', err);
        res.status(500).json({
            error: 'Failed to update user status',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const deleteUser = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { user_id } = req.params;
        
        console.log('Deleting user:', user_id);
        
        await connection.beginTransaction();
        
        // Get user information before deletion for logging
        const [userInfo] = await connection.query(
            'SELECT fname, lname, email, role FROM users WHERE user_id = ?',
            [user_id]
        );
        
        if (userInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userInfo[0];
        
        // Always attempt vendor cleanup (covers both vendor users and customers who previously had vendor data)
        // Pass the connection so it participates in the same transaction
        try {
            await cleanupVendorDataByUserId(user_id, connection);
        } catch (vendorCleanupError) {
            console.error('Vendor cleanup error (rolling back transaction):', vendorCleanupError);
            throw vendorCleanupError; // Re-throw to trigger rollback
        }
        
        // Preserve orders by setting customer_id to NULL before deleting user
        // This keeps order history for financial/legal compliance
        try {
            await connection.query(
                'UPDATE orders SET customer_id = NULL WHERE customer_id = ?',
                [user_id]
            );
            console.log(`✅ Preserved orders by setting customer_id to NULL (orders kept for compliance)`);
        } catch (err) {
            console.log('Note: Could not update orders.customer_id (may have foreign key constraint):', err.message);
        }
        
        // Anonymize user data before deletion
        // Note: status column is ENUM('active', 'inactive', 'suspended'), so we use 'inactive' instead of 'deleted'
        await connection.query(`
            UPDATE users SET 
                email = CONCAT('deleted_', user_id, '@deleted.local'),
                fname = 'Deleted',
                lname = 'User',
                username = CONCAT('deleted_', user_id),
                password = NULL,
                contact_no = NULL,
                birth_date = NULL,
                gender = NULL,
                status = 'inactive'
            WHERE user_id = ?
        `, [user_id]);
        console.log(`✅ Anonymized user personal data`);
        
        // NOTE: Orders are preserved with customer_id = NULL
        // This maintains order history for:
        // 1. Financial/legal compliance (tax records, audit trail)
        // 2. Business analytics
        // 3. Historical data integrity
        
        // Delete user-related temporary data
        await connection.query('DELETE FROM notifications WHERE user_id = ?', [user_id]);
        await connection.query('DELETE FROM cart_items WHERE user_id = ?', [user_id]);
        await connection.query('DELETE FROM user_addresses WHERE user_id = ?', [user_id]);
        
        // Delete feedback if exists
        try {
            await connection.query('DELETE FROM feedback WHERE user_id = ?', [user_id]);
        } catch (err) {
            console.log('Note: feedback table may not exist, skipping:', err.message);
        }
        
        // Finally, delete the anonymized user record
        const [result] = await connection.query(
            'DELETE FROM users WHERE user_id = ?',
            [user_id]
        );
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }
        
        await connection.commit();
        console.log(`✅ User ${user.fname} ${user.lname} (${user.email}) deleted successfully`);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (err) {
        await connection.rollback();
        console.error('❌ Failed to delete user:', err);
        res.status(500).json({
            error: 'Failed to delete user',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    } finally {
        connection.release();
    }
};

module.exports = { countTotal, getAllVendors, getVendorById, updateVendorStatus, checkVendorOngoingOrders, getAllUsers, getUserById, updateUser, updateUserStatus, deleteUser };
