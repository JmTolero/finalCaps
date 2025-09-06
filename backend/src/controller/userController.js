const pool = require('../db/config');
const { User } = require('../model/userModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

const userLogin = async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing username or password' });
        }

        // Allow a single admin account via env without relying on DB
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const inputUser = String(username).trim();
        const inputPass = String(password);
        const envUser = adminUsername ? String(adminUsername).trim() : null;
        const envPass = adminPassword ? String(adminPassword) : null;
        if (envUser && envPass && inputUser === envUser && inputPass === envPass) {
            return res.json({
                message: 'Login successful',
                user: {
                    id: 0,
                    username: envUser,
                    firstName: 'Admin',
                    lastName: '',
                    role: 'admin'
                }
            });
        }

        // Query user from DB; select * to allow optional role column
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1',[username]);

        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const resolvedRole = user.role || user.user_role || null; // support various schemas
        return res.json({
            message: 'Login successful',
            user: {
                id: user.user_id,
                username: user.username,
                firstName: user.fname,
                lastName: user.lname,
                role: resolvedRole || 'customer'
            }
        });
    } catch (err) {
        console.error('POST /login failed:', err.code, err.message);
        return res.status(500).json({
            error: 'Database error',
            code: err.code,
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}

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

const registerVendor = async (req, res) => {
    try {
        console.log('=== VENDOR REGISTRATION REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('=====================================');
        
        // Handle both JSON and form-data requests
        const { fname, username, password, contact_no, email, store_name, address, role } = req.body;
        
        // Validate required fields
        if (!fname || !email || !password || !store_name || !address) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email already exists
        const [existingEmail] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Insert user (matching your actual schema)
        const [userResult] = await pool.query(
            'INSERT INTO users (fname, lname, username, password, contact_no, email, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [fname, '', username, password, '', email, 'vendor']
        );

        const userId = userResult.insertId;
        console.log('User created with ID:', userId);

        // Get file paths
        const validIdUrl = req.files?.valid_id ? req.files.valid_id[0].filename : null;
        const businessPermitUrl = req.files?.business_permit ? req.files.business_permit[0].filename : null;
        const iceCreamPhotoUrl = req.files?.ice_cream_photo ? req.files.ice_cream_photo[0].filename : null;

        // Insert vendor (matching your actual schema)
        const [vendorResult] = await pool.query(
            'INSERT INTO vendors (store_name, address_id, business_permit_url, valid_id_url, status, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [store_name, address, businessPermitUrl, validIdUrl, 'pending', userId]
        );

        console.log('Vendor created with ID:', vendorResult.insertId);

        res.json({
            success: true,
            message: 'Vendor registration successful. Your account is pending approval.',
            vendor: {
                vendor_id: vendorResult.insertId,
                store_name: store_name,
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

const getAllVendors = async (req, res) => {
    try {
        console.log('Fetching all vendors...');
        
        // Query to get all vendors with their user information
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.address_id as location,
                v.business_permit_url,
                v.valid_id_url,
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

const updateVendorStatus = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        const { status } = req.body;
        
        console.log('Updating vendor status:', vendor_id, status);
        
        // Validate status
        if (!['pending', 'approved', 'rejected'].includes(status.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid status. Must be pending, approved, or rejected' });
        }
        
        // Update vendor status
        const [result] = await pool.query(
            'UPDATE vendors SET status = ? WHERE vendor_id = ?',
            [status, vendor_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
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

module.exports = {userLogin, countTotal, registerVendor, upload, getAllVendors, updateVendorStatus};

