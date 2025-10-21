const { generateToken } = require('../../utils/jwt');
const pool = require('../../db/config');

// Vendor Google OAuth success handler
const vendorGoogleAuthSuccess = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Google authentication failed' });
        }

        const user = req.user;
        
        // Generate JWT token
        const token = generateToken(user);
        
        // For API calls, return JSON
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({
                message: 'Google authentication successful',
                user: user,
                token: token
            });
        }
        
        // For browser redirects, redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        // If it's an existing user, redirect to document completion page
        if (user.isExistingUser) {
            const redirectUrl = `${frontendUrl}/vendor-google-complete?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}&existing=true`;
            res.redirect(redirectUrl);
        } else {
            // New user - create vendor record and redirect to document completion
            try {
                const [vendorResult] = await pool.query(
                    'INSERT INTO vendors (store_name, business_permit_url, valid_id_url, proof_image_url, status, user_id, primary_address_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                    [null, null, null, null, 'pending', user.id, null]
                );
                
                const redirectUrl = `${frontendUrl}/vendor-google-complete?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}&vendor_id=${vendorResult.insertId}&existing=false`;
                res.redirect(redirectUrl);
            } catch (error) {
                console.error('Error creating vendor record:', error);
                const redirectUrl = `${frontendUrl}/vendor-google-complete?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}&error=vendor_creation_failed`;
                res.redirect(redirectUrl);
            }
        }
    } catch (error) {
        console.error('Vendor Google auth success error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Vendor Google OAuth failure handler
const vendorGoogleAuthFailure = (req, res) => {
    // Redirect to frontend with error parameter
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/vendor-register?error=google_auth_failed`;
    res.redirect(redirectUrl);
};

// Complete vendor registration with documents
const completeVendorRegistration = async (req, res) => {
    try {
        console.log('=== COMPLETE VENDOR REGISTRATION REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('=============================================');
        
        const { user_id, vendor_id, birth_date, gender, contact_no, username } = req.body;
        
        // Validate required fields
        if (!user_id || !birth_date || !gender) {
            return res.status(400).json({ error: 'Missing required fields: user_id, birth_date, gender' });
        }
        
        // If username is provided, validate it
        if (username) {
            // Check if username already exists
            const [existingUsername] = await pool.query(
                'SELECT user_id FROM users WHERE username = ? AND user_id != ?',
                [username, user_id]
            );
            
            if (existingUsername.length > 0) {
                return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
            }
            
            // Validate username format (alphanumeric and underscores only, 3-20 characters)
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({ 
                    error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.' 
                });
            }
        }
        
        // Check if vendor_id is provided (for new users)
        let finalVendorId = vendor_id;
        
        if (!vendor_id) {
            // Create vendor record for existing user
            const [vendorResult] = await pool.query(
                'INSERT INTO vendors (store_name, business_permit_url, valid_id_url, proof_image_url, status, user_id, primary_address_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [null, null, null, null, 'pending', user_id, null]
            );
            finalVendorId = vendorResult.insertId;
        }
        
        // Update user with additional information
        if (username) {
            await pool.query(
                'UPDATE users SET username = ?, birth_date = ?, gender = ?, contact_no = ? WHERE user_id = ?',
                [username, birth_date, gender, contact_no || null, user_id]
            );
        } else {
            await pool.query(
                'UPDATE users SET birth_date = ?, gender = ?, contact_no = ? WHERE user_id = ?',
                [birth_date, gender, contact_no || null, user_id]
            );
        }
        
        // Get file paths
        const validIdUrl = req.files?.valid_id ? req.files.valid_id[0].path : null;
        const businessPermitUrl = req.files?.business_permit ? req.files.business_permit[0].path : null;
        const proofImageUrl = req.files?.proof_image ? req.files.proof_image[0].path : null;
        
        // Update vendor record with document URLs
        await pool.query(
            'UPDATE vendors SET business_permit_url = ?, valid_id_url = ?, proof_image_url = ? WHERE vendor_id = ?',
            [businessPermitUrl, validIdUrl, proofImageUrl, finalVendorId]
        );
        
        // Get updated user and vendor data
        const [userResult] = await pool.query(
            'SELECT user_id, fname, lname, username, email, role FROM users WHERE user_id = ?',
            [user_id]
        );
        
        const [vendorResult] = await pool.query(
            'SELECT vendor_id, store_name, status FROM vendors WHERE vendor_id = ?',
            [finalVendorId]
        );
        
        res.json({
            success: true,
            message: 'Vendor registration completed successfully. Your account is pending approval.',
            vendor: {
                vendor_id: finalVendorId,
                store_name: vendorResult[0].store_name,
                status: vendorResult[0].status,
                user_id: user_id
            },
            user: {
                user_id: user_id,
                fname: userResult[0].fname,
                email: userResult[0].email,
                role: 'vendor'
            }
        });
        
    } catch (error) {
        console.error('Complete vendor registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    vendorGoogleAuthSuccess,
    vendorGoogleAuthFailure,
    completeVendorRegistration
};
