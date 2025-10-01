const pool = require('../../db/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateRequiredFields, trimObjectStrings } = require('../../utils/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/vendor-documents/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter - Field name:', file.fieldname);
    console.log('File filter - Original name:', file.originalname);
    console.log('File filter - MIME type:', file.mimetype);
    
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    console.log('File filter - Extension check:', extname);
    console.log('File filter - MIME type check:', mimetype);
    
    if (mimetype && extname) {
      console.log('File filter - File accepted');
      return cb(null, true);
    } else {
      console.log('File filter - File rejected');
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

const registerVendor = async (req, res) => {
    try {
        console.log('=== VENDOR REGISTRATION REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('Request file fields:', Object.keys(req.files || {}));
        console.log('=====================================');
        
        // Handle both JSON and form-data requests and trim strings
        const trimmedBody = trimObjectStrings(req.body);
        const { fname, lname, username, password, contact_no, email, birth_date, gender, role } = trimmedBody;
        
        // Validate required fields (address is optional during registration)
        const requiredFields = [
            { key: 'fname', name: 'First name' },
            { key: 'lname', name: 'Last name' },
            { key: 'email', name: 'Email' },
            { key: 'password', name: 'Password' },
            { key: 'birth_date', name: 'Birth date' },
            { key: 'gender', name: 'Gender' }
        ];
        
        const validation = validateRequiredFields(trimmedBody, requiredFields);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        // Check if email already exists
        const [existingEmail] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if username already exists
        const [existingUsername] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Insert user
        const [userResult] = await pool.query(
            'INSERT INTO users (fname, lname, username, password, contact_no, email, birth_date, gender, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [fname, lname || '', username, password, contact_no || '', email, birth_date, gender, 'vendor']
        );

        const userId = userResult.insertId;
        console.log('User created with ID:', userId);

        // Get file paths
        const validIdUrl = req.files?.valid_id ? req.files.valid_id[0].filename : null;
        const businessPermitUrl = req.files?.business_permit ? req.files.business_permit[0].filename : null;
        const proofImageUrl = req.files?.proof_image ? req.files.proof_image[0].filename : null;

        // No location data collected during registration - address will be required in vendor setup
        let primaryAddressId = null;

        // Insert vendor without store name (will be set during setup)
        const [vendorResult] = await pool.query(
            'INSERT INTO vendors (store_name, business_permit_url, valid_id_url, proof_image_url, status, user_id, primary_address_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [null, businessPermitUrl, validIdUrl, proofImageUrl, 'pending', userId, primaryAddressId]
        );

        console.log('Vendor created with ID:', vendorResult.insertId);

        res.json({
            success: true,
            message: 'Vendor registration successful. Your account is pending approval.',
            vendor: {
                vendor_id: vendorResult.insertId,
                store_name: null,
                status: 'pending',
                user_id: userId
            },
            user: {
                user_id: userId,
                fname: fname,
                email: email,
                role: 'vendor'
            }
        });

    } catch (err) {
        console.error('Vendor registration failed:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage
        });
        res.status(500).json({
            error: 'Registration failed',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const getCurrentVendor = async (req, res) => {
    try {
        // Get user ID from request headers (sent by frontend)
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        
        console.log('Fetching vendor data for user ID:', userId);
        
        // Get vendor data by user_id instead of vendor_id
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.status,
                v.user_id,
                v.profile_image_url,
                v.business_permit_url,
                v.valid_id_url,
                v.proof_image_url,
                u.fname,
                u.lname,
                u.username,
                u.email,
                u.contact_no
            FROM vendors v
            LEFT JOIN users u ON v.user_id = u.user_id
            WHERE v.user_id = ?
        `, [userId]);
        
        if (vendors.length === 0) {
            console.log('No vendor found for user ID:', userId);
            return res.status(404).json({
                success: false,
                error: 'Vendor not found for this user'
            });
        }
        
        console.log('Vendor data found for user:', userId, 'vendor:', vendors[0].vendor_id);
        console.log('📦 Vendor details:', {
            vendor_id: vendors[0].vendor_id,
            store_name: vendors[0].store_name,
            status: vendors[0].status,
            user_id: vendors[0].user_id
        });
        
        res.json({
            success: true,
            vendor: vendors[0]
        });
        
    } catch (err) {
        console.error('Failed to fetch current vendor:', err);
        res.status(500).json({
            error: 'Failed to fetch vendor information',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const getVendorForSetup = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.status,
                v.user_id,
                v.proof_image_url,
                u.fname,
                u.lname,
                u.username,
                u.email,
                u.contact_no
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
        
        res.json({
            success: true,
            vendor: vendors[0]
        });
        
    } catch (err) {
        console.error('Failed to fetch vendor for setup:', err);
        res.status(500).json({
            error: 'Failed to fetch vendor information',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const updateVendorProfile = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        const trimmedBody = trimObjectStrings(req.body);
        const { store_name, contact_no, email, username, password } = trimmedBody;
        
        console.log('Updating vendor profile:', vendor_id, trimmedBody);
        
        // Get vendor and user information
        const [vendor] = await pool.query(
            'SELECT user_id FROM vendors WHERE vendor_id = ?',
            [vendor_id]
        );
        
        if (vendor.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        
        const userId = vendor[0].user_id;
        
        // Handle profile image upload
        let profileImageUrl = null;
        if (req.files?.profile_image) {
            profileImageUrl = req.files.profile_image[0].filename;
        }
        
        // Handle proof image upload
        let proofImageUrl = null;
        if (req.files?.proof_image) {
            proofImageUrl = req.files.proof_image[0].filename;
        }
        
        // Update vendor information (store_name, profile image, and proof image)
        const vendorUpdateData = [store_name];
        let vendorQuery = 'UPDATE vendors SET store_name = ?';
        
        if (profileImageUrl) {
            vendorQuery += ', profile_image_url = ?';
            vendorUpdateData.push(profileImageUrl);
        }
        
        if (proofImageUrl) {
            vendorQuery += ', proof_image_url = ?';
            vendorUpdateData.push(proofImageUrl);
        }
        
        vendorQuery += ' WHERE vendor_id = ?';
        vendorUpdateData.push(vendor_id);
        
        await pool.query(vendorQuery, vendorUpdateData);
        
        // Get updated vendor data to return all document URLs
        const [updatedVendor] = await pool.query(
            'SELECT profile_image_url, business_permit_url, valid_id_url, proof_image_url FROM vendors WHERE vendor_id = ?',
            [vendor_id]
        );
        
        // Update user information
        const userUpdateData = [];
        let userQuery = 'UPDATE users SET';
        let updates = [];
        
        if (email) {
            updates.push(' email = ?');
            userUpdateData.push(email);
        }
        
        if (contact_no) {
            updates.push(' contact_no = ?');
            userUpdateData.push(contact_no);
        }
        
        if (username && username.trim() !== '') {
            updates.push(' username = ?');
            userUpdateData.push(username);
        }
        
        if (password && password.trim() !== '') {
            updates.push(' password = ?');
            userUpdateData.push(password);
        }
        
        if (updates.length > 0) {
            userQuery += updates.join(',') + ' WHERE user_id = ?';
            userUpdateData.push(userId);
            await pool.query(userQuery, userUpdateData);
        }
        
        res.json({
            success: true,
            message: 'Vendor profile updated successfully',
            profile_image_url: updatedVendor[0]?.profile_image_url,
            business_permit_url: updatedVendor[0]?.business_permit_url,
            valid_id_url: updatedVendor[0]?.valid_id_url,
            proof_image_url: updatedVendor[0]?.proof_image_url
        });
        
    } catch (err) {
        console.error('Failed to update vendor profile:', err);
        res.status(500).json({
            error: 'Failed to update vendor profile',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const checkVendorSetupComplete = async (req, res) => {
    try {
        const { user_id } = req.params;
        
        // Check if vendor exists and get setup completion status
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id, v.store_name, v.status, v.primary_address_id,
                v.business_permit_url, v.valid_id_url, v.proof_image_url,
                u.fname, u.lname, u.username, u.email, u.contact_no
            FROM vendors v
            LEFT JOIN users u ON v.user_id = u.user_id
            WHERE v.user_id = ?
        `, [user_id]);

        if (vendors.length === 0) {
            return res.json({
                success: true,
                isVendor: false,
                setupComplete: false
            });
        }

        const vendor = vendors[0];
        
        // Check if setup is complete (has all required fields)
        // Setup is complete only if vendor has a proper store name
        const isSetupComplete = !!(
            vendor.business_permit_url &&
            vendor.valid_id_url &&
            vendor.store_name
        );

        res.json({
            success: true,
            isVendor: true,
            setupComplete: isSetupComplete,
            vendor: {
                vendor_id: vendor.vendor_id,
                store_name: vendor.store_name,
                fname: vendor.fname,
                lname: vendor.lname,
                username: vendor.username,
                email: vendor.email,
                contact_no: vendor.contact_no,
                status: vendor.status
            }
        });
    } catch (err) {
        console.error('Error checking vendor setup:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

const getVendorDashboardData = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        
        // Get basic vendor info
        const [vendorInfo] = await pool.query(`
            SELECT v.vendor_id, v.store_name, v.status
            FROM vendors v
            WHERE v.vendor_id = ?
        `, [vendor_id]);
        
        if (vendorInfo.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        // Get order statistics
        const [orderStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN payment_status = 'paid' THEN CAST(total_amount AS DECIMAL(10,2)) ELSE 0 END) as total_revenue,
                SUM(CASE WHEN payment_status = 'paid' THEN CAST(total_amount AS DECIMAL(10,2)) ELSE 0 END) as sales_today,
                SUM(CASE WHEN payment_status = 'paid' THEN CAST(total_amount AS DECIMAL(10,2)) ELSE 0 END) as sales_this_month
            FROM orders 
            WHERE vendor_id = ?
        `, [vendor_id]);

        // Get top flavor
        const [topFlavor] = await pool.query(`
            SELECT f.flavor_name, COUNT(*) as order_count
            FROM orders o
            INNER JOIN order_items oi ON o.order_id = oi.order_id
            INNER JOIN products p ON oi.product_id = p.product_id
            INNER JOIN flavors f ON p.flavor_id = f.flavor_id
            WHERE o.vendor_id = ?
            GROUP BY f.flavor_id, f.flavor_name
            ORDER BY order_count DESC
            LIMIT 1
        `, [vendor_id]);

        // Get upcoming deliveries (only approved orders with delivery dates)
        const [upcomingDeliveries] = await pool.query(`
            SELECT 
                o.order_id,
                o.delivery_datetime,
                o.delivery_address,
                o.status,
                o.payment_status,
                u.fname as customer_name,
                u.lname as customer_lname,
                u.contact_no as customer_phone,
                o.total_amount,
                o.created_at
            FROM orders o
            INNER JOIN users u ON o.customer_id = u.user_id
            WHERE o.vendor_id = ? 
            AND o.status IN ('confirmed', 'preparing', 'out_for_delivery')
            AND o.delivery_datetime IS NOT NULL
            AND o.delivery_datetime > NOW()
            ORDER BY o.delivery_datetime ASC
            LIMIT 10
        `, [vendor_id]);

        // Get flavor count (products are auto-generated from orders, so we count flavors instead)
        const [productCount] = await pool.query(`
            SELECT COUNT(*) as product_count
            FROM flavors
            WHERE vendor_id = ?
        `, [vendor_id]);

        const stats = orderStats[0];
        const topFlavorData = topFlavor[0];

        res.json({
            success: true,
            data: {
                vendor: vendorInfo[0],
                total_orders: stats.total_orders || 0,
                total_revenue: stats.total_revenue || 0,
                pending_orders: stats.pending_orders || 0,
                confirmed_orders: stats.confirmed_orders || 0,
                delivered_orders: stats.delivered_orders || 0,
                sales_today: stats.sales_today || 0,
                sales_this_month: stats.sales_this_month || 0,
                top_flavor: topFlavorData ? topFlavorData.flavor_name : 'N/A',
                product_count: productCount[0].product_count || 0,
                upcoming_deliveries: upcomingDeliveries
            }
        });

    } catch (err) {
        console.error('Failed to fetch vendor dashboard data:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const registerExistingUserAsVendor = async (req, res) => {
    try {
        console.log('=== EXISTING USER VENDOR REGISTRATION REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('Request file fields:', Object.keys(req.files || {}));
        console.log('================================================');
        
        // Handle both JSON and form-data requests and trim strings
        const trimmedBody = trimObjectStrings(req.body);
        const { fname, lname, username, password, contact_no, email, birth_date, gender, store_name, city, province, role } = trimmedBody;
        
        // Validate required fields (store_name will be set after approval)
        const requiredFields = [
            { key: 'fname', name: 'First name' },
            { key: 'lname', name: 'Last name' },
            { key: 'email', name: 'Email' },
            { key: 'password', name: 'Password' },
            { key: 'birth_date', name: 'Birth date' },
            { key: 'gender', name: 'Gender' }
        ];
        
        const validation = validateRequiredFields(trimmedBody, requiredFields);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        // Check if user exists and get their current data
        const [existingUser] = await pool.query(
            'SELECT user_id, fname, lname, username, email, contact_no, role FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = existingUser[0];
        
        // Check if user is already a vendor
        if (user.role === 'vendor') {
            return res.status(400).json({ error: 'User is already a vendor' });
        }

        // Check if vendor record already exists for this user
        const [existingVendor] = await pool.query(
            'SELECT vendor_id FROM vendors WHERE user_id = ?',
            [user.user_id]
        );
        
        if (existingVendor.length > 0) {
            return res.status(400).json({ error: 'Vendor application already exists for this user' });
        }

        // Update user role to vendor and add birth_date and gender
        await pool.query(
            'UPDATE users SET role = ?, birth_date = ?, gender = ? WHERE user_id = ?',
            ['vendor', birth_date, gender, user.user_id]
        );

        // Get file paths
        const validIdUrl = req.files?.valid_id ? req.files.valid_id[0].filename : null;
        const businessPermitUrl = req.files?.business_permit ? req.files.business_permit[0].filename : null;
        const proofImageUrl = req.files?.proof_image ? req.files.proof_image[0].filename : null;

        let primaryAddressId = null;

        // If basic location was provided, create a basic address
        if (city && province) {
            const [addressResult] = await pool.query(
                'INSERT INTO addresses (street_name, barangay, cityVillage, province, region, address_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
                ['', '', city, province, '', 'business']
            );
            
            primaryAddressId = addressResult.insertId;

            // Link address to user
            await pool.query(
                'INSERT INTO user_addresses (user_id, address_id, address_label, is_default, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
                [user.user_id, primaryAddressId, 'Store Location']
            );
        }

        // Insert vendor record (store_name will be set after approval)
        const [vendorResult] = await pool.query(
            'INSERT INTO vendors (store_name, business_permit_url, valid_id_url, proof_image_url, status, user_id, primary_address_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [null, businessPermitUrl, validIdUrl, proofImageUrl, 'pending', user.user_id, primaryAddressId]
        );

        console.log('Vendor created with ID:', vendorResult.insertId);

        res.json({
            success: true,
            message: 'Vendor application submitted successfully. Your account is pending approval.',
            vendor: {
                vendor_id: vendorResult.insertId,
                store_name: null, // Will be set after approval
                status: 'pending',
                user_id: user.user_id
            },
            user: {
                user_id: user.user_id,
                fname: user.fname,
                lname: user.lname,
                email: user.email,
                role: 'vendor'
            }
        });

    } catch (err) {
        console.error('Existing user vendor registration failed:', err);
        res.status(500).json({
            error: 'Registration failed',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

// Get all products for a specific vendor
const getVendorProducts = async (req, res) => {
    try {
        const { vendorId } = req.params;
        console.log('Fetching products for vendor:', vendorId);
        const [products] = await pool.query(`
            SELECT 
                p.product_id, p.product_name, p.price, p.size, p.stock, p.description, p.image_url,
                f.flavor_name, v.store_name
            FROM products p
            INNER JOIN flavors f ON p.flavor_id = f.flavor_id
            INNER JOIN vendors v ON p.vendor_id = v.vendor_id
            WHERE p.vendor_id = ? ORDER BY p.product_name
        `, [vendorId]);
        console.log('Products fetched successfully:', products.length);
        res.json({ success: true, products: products });
    } catch (err) {
        console.error('Failed to fetch vendor products:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch vendor products', message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
    }
};

// Get all products from all approved vendors (for marketplace)
const getAllProducts = async (req, res) => {
    try {
        console.log('Fetching all products from all vendors');
        const [products] = await pool.query(`
            SELECT 
                p.product_id, p.product_name, p.price, p.size, p.stock, p.description, p.image_url,
                f.flavor_name, v.store_name, v.location, v.vendor_id
            FROM products p
            INNER JOIN flavors f ON p.flavor_id = f.flavor_id
            INNER JOIN vendors v ON p.vendor_id = v.vendor_id
            WHERE v.status = 'approved'
            ORDER BY v.store_name, p.product_name
        `);
        console.log('All products fetched successfully:', products.length);
        res.json({ success: true, products: products });
    } catch (err) {
        console.error('Failed to fetch all products:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch all products', message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
    }
};

// Get vendors with their locations for map display
const getVendorsWithLocations = async (req, res) => {
    try {
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.profile_image_url,
                v.status as vendor_status,
                u.fname,
                u.lname,
                u.email,
                u.contact_no,
                CASE 
                  WHEN a.address_id IS NULL OR (
                    (a.cityVillage IS NULL OR a.cityVillage = '') AND 
                    (a.province IS NULL OR a.province = '')
                  ) 
                  THEN 'Location not specified'
                  ELSE CONCAT_WS(', ',
                    COALESCE(NULLIF(a.cityVillage, ''), NULL),
                    COALESCE(NULLIF(a.province, ''), NULL)
                  )
                END as location,
                a.latitude,
                a.longitude,
                GROUP_CONCAT(DISTINCT f.flavor_name) as flavors
            FROM vendors v
            LEFT JOIN users u ON v.user_id = u.user_id
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            LEFT JOIN flavors f ON v.vendor_id = f.vendor_id AND f.store_status = 'published'
            WHERE v.status = 'approved'
            GROUP BY v.vendor_id, v.store_name, v.profile_image_url, v.status, u.fname, u.lname, u.email, u.contact_no, a.unit_number, a.street_name, a.barangay, a.cityVillage, a.province, a.region, a.postal_code, a.latitude, a.longitude
            ORDER BY v.store_name
        `);

        // Process flavors data
        const processedVendors = vendors.map(vendor => ({
            ...vendor,
            flavors: vendor.flavors ? vendor.flavors.split(',').map(flavor => ({ flavor_name: flavor.trim() })) : []
        }));

        res.json({
            success: true,
            vendors: processedVendors
        });
    } catch (error) {
        console.error('Error fetching vendors with locations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendors',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getAllApprovedVendors = async (req, res) => {
    try {
        console.log('📋 Fetching all approved vendors for customer store listing');

        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.profile_image_url,
                v.status,
                v.created_at,
                CASE 
                    WHEN (a.address_id IS NULL OR (
                        (a.cityVillage IS NULL OR a.cityVillage = '') AND 
                        (a.province IS NULL OR a.province = '')
                    )) AND (a2.address_id IS NULL OR (
                        (a2.cityVillage IS NULL OR a2.cityVillage = '') AND 
                        (a2.province IS NULL OR a2.province = '')
                    ))
                    THEN 'Location not specified'
                    WHEN a.address_id IS NOT NULL AND (
                        (a.cityVillage IS NOT NULL AND a.cityVillage != '') OR 
                        (a.province IS NOT NULL AND a.province != '')
                    )
                    THEN CONCAT_WS(', ',
                        COALESCE(NULLIF(a.cityVillage, ''), NULL),
                        COALESCE(NULLIF(a.province, ''), NULL)
                    )
                    ELSE CONCAT_WS(', ',
                        COALESCE(NULLIF(a2.cityVillage, ''), NULL),
                        COALESCE(NULLIF(a2.province, ''), NULL)
                    )
                END as location
            FROM vendors v
            LEFT JOIN addresses a ON v.primary_address_id = a.address_id
            LEFT JOIN user_addresses ua ON v.user_id = ua.user_id AND ua.is_default = 1
            LEFT JOIN addresses a2 ON ua.address_id = a2.address_id
            WHERE v.status = 'approved'
            ORDER BY v.store_name
        `);

        console.log(`📋 Found ${vendors.length} approved vendors`);

        res.json({
            success: true,
            vendors: vendors
        });
    } catch (error) {
        console.error('Error fetching all approved vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch approved vendors',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = { registerVendor, upload, getCurrentVendor, getVendorForSetup, updateVendorProfile, checkVendorSetupComplete, getVendorDashboardData, registerExistingUserAsVendor, getVendorProducts, getAllProducts, getVendorsWithLocations, getAllApprovedVendors };
