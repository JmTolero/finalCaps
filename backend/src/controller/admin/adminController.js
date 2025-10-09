const pool = require('../../db/config');
const { createNotification } = require('../shared/notificationController');
const { User } = require('../../model/shared/userModel');

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
                message: `Congratulations ${vendor.fname}! Your vendor application has been approved. You can now set up your store and start selling your delicious ice cream!`,
                notification_type: 'system_announcement',
                related_vendor_id: vendor_id
            });
        } else if (status.toLowerCase() === 'rejected') {
            // Calculate auto-return date (TESTING: 5 seconds from now)
            const autoReturnDate = new Date();
            autoReturnDate.setSeconds(autoReturnDate.getSeconds() + 5); // TEST: 5 seconds
            // autoReturnDate.setDate(autoReturnDate.getDate() + 7); // PRODUCTION: 1 week
                
            // Record the rejection for auto-return tracking
            await pool.query(
                'INSERT INTO vendor_rejections (vendor_id, user_id, auto_return_at) VALUES (?, ?, ?)',
                [vendor_id, vendor.user_id, autoReturnDate]
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
                // If it's an ISO string, extract just the date part
                if (birth_date.includes('T')) {
                    formattedBirthDate = new Date(birth_date).toISOString().split('T')[0];
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

module.exports = { countTotal, getAllVendors, getVendorById, updateVendorStatus, checkVendorOngoingOrders, getAllUsers, getUserById, updateUser, updateUserStatus };
