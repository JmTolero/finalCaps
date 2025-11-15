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
        
        // For both existing and new users, redirect to document completion page
        // Don't create vendor record yet - it will be created when they complete the form
        // This prevents the issue where clicking back and logging in redirects to vendor-pending
        const redirectUrl = `${frontendUrl}/vendor-google-complete?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}&existing=${user.isExistingUser ? 'true' : 'false'}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Vendor Google auth success error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Vendor Google OAuth failure handler
const vendorGoogleAuthFailure = (req, res) => {
    // Get error message from Passport (stored in session or query params)
    const errorMessage = req.query.error || 
                        req.session?.messages?.[0] || 
                        req.flash?.('error')?.[0] ||
                        'Google authentication failed';
    
    console.log('Vendor Google OAuth failure:', errorMessage);
    
    // Redirect to frontend with error parameter
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorParam = encodeURIComponent(errorMessage);
    const redirectUrl = `${frontendUrl}/vendor-register?error=${errorParam}`;
    res.redirect(redirectUrl);
};

// Complete vendor registration with documents
const completeVendorRegistration = async (req, res) => {
    try {
        console.log('=== COMPLETE VENDOR REGISTRATION REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('=============================================');
        
        const { user_id, vendor_id, birth_date, gender, contact_no, username, password } = req.body;
        
        // Validate required fields
        if (!user_id || !birth_date || !gender) {
            return res.status(400).json({ error: 'Missing required fields: user_id, birth_date, gender' });
        }
        
        // Validate password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters long' });
            }
        } else {
            return res.status(400).json({ error: 'Password is required' });
        }
        
        // If username is provided, validate it
        if (username) {
            // Check if username already exists (excluding deleted users and current user)
            const [existingUsername] = await pool.query(
                `SELECT user_id FROM users 
                 WHERE username = ? 
                 AND user_id != ? 
                 AND email NOT LIKE '%@deleted.local'
                 AND NOT (fname = 'Deleted' AND lname = 'User')`,
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
        
        // Check current user role and vendor status
        const [currentUser] = await pool.query(
            'SELECT role, email, fname, lname FROM users WHERE user_id = ?',
            [user_id]
        );
        
        if (currentUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = currentUser[0];
        
        // Check if user is deleted (anonymized) - allow re-registration
        const isDeletedUser = user.email && user.email.includes('@deleted.local');
        const isDeletedName = user.fname === 'Deleted' && user.lname === 'User';
        const isDeleted = isDeletedUser || isDeletedName;
        
        // Initialize finalVendorId early
        let finalVendorId = vendor_id;
        
        // Always check for existing vendor records first
        try {
            const [existingVendor] = await pool.query(
                'SELECT vendor_id, status FROM vendors WHERE user_id = ?',
                [user_id]
            );
            
            if (existingVendor.length > 0) {
                const vendor = existingVendor[0];
                console.log(`Found vendor record ${vendor.vendor_id} with status: ${vendor.status} for user ${user_id}`);
                
                // If vendor status is 'pending' (after auto-return), allow updating the existing record
                if (vendor.status === 'pending') {
                    console.log(`Vendor ${vendor.vendor_id} has pending status - will update existing vendor record for reapplication`);
                    finalVendorId = vendor.vendor_id; // Use existing vendor_id
                } else if (isDeleted || user.role === 'vendor') {
                    // If user is deleted OR has vendor role but shouldn't, clean up vendor record
                    console.log(`Cleaning up orphaned vendor record ${vendor.vendor_id} for user ${user_id}`);
                    await pool.query('DELETE FROM vendors WHERE vendor_id = ?', [vendor.vendor_id]);
                    console.log(`✅ Cleaned up orphaned vendor record`);
                    finalVendorId = null; // Reset to null so a new vendor record will be created below
                } else {
                    // User is not deleted and has vendor record with non-pending status - this is a real conflict
                    return res.status(400).json({ error: 'Vendor application already exists for this user' });
                }
            }
        } catch (err) {
            console.error('Error checking/cleaning up vendor records:', err);
        }
        
        // After cleanup, check if user role needs to be reset
        if (isDeleted || user.role === 'vendor') {
            // Reset role to customer to allow re-registration
            try {
                await pool.query(
                    'UPDATE users SET role = ? WHERE user_id = ?',
                    ['customer', user_id]
                );
                console.log(`✅ Reset user role from '${user.role}' to 'customer' for user ${user_id}`);
                user.role = 'customer'; // Update local reference
            } catch (err) {
                console.error('Error resetting user role:', err);
            }
        }
        
        // Check if vendor_id needs to be created or updated
        // If finalVendorId was already set from existing pending vendor (after auto-return), use it
        if (!finalVendorId) {
            if (!vendor_id) {
                // Create vendor record for existing customer converting to vendor
                const [vendorResult] = await pool.query(
                    'INSERT INTO vendors (store_name, business_permit_url, valid_id_url, proof_image_url, status, user_id, primary_address_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                    [null, null, null, null, 'pending', user_id, null]
                );
                finalVendorId = vendorResult.insertId;
                console.log(`✅ Created new vendor record with ID: ${finalVendorId}`);
            } else {
                // Verify vendor_id exists and belongs to this user
                const [vendorCheck] = await pool.query(
                    'SELECT vendor_id, user_id FROM vendors WHERE vendor_id = ?',
                    [vendor_id]
                );
                
                if (vendorCheck.length === 0) {
                    console.log(`⚠️ Vendor ID ${vendor_id} not found, creating new vendor record...`);
                    // Vendor record doesn't exist, create it
                    const [vendorResult] = await pool.query(
                        'INSERT INTO vendors (store_name, business_permit_url, valid_id_url, proof_image_url, status, user_id, primary_address_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                        [null, null, null, null, 'pending', user_id, null]
                    );
                    finalVendorId = vendorResult.insertId;
                    console.log(`✅ Created new vendor record with ID: ${finalVendorId} (original vendor_id ${vendor_id} was invalid)`);
                } else if (vendorCheck[0].user_id !== parseInt(user_id)) {
                    console.error(`❌ Vendor ID ${vendor_id} belongs to different user (${vendorCheck[0].user_id} vs ${user_id})`);
                    return res.status(403).json({ error: 'Vendor record does not belong to this user' });
                } else {
                    finalVendorId = vendor_id;
                    console.log(`✅ Using existing vendor record ID: ${finalVendorId} for user ${user_id}`);
                }
            }
        } else {
            console.log(`✅ Using existing vendor record ID: ${finalVendorId} (from auto-return or existing pending status)`);
        }
        
        // Update user with additional information and change role to vendor
        // Include password if provided
        if (password) {
            if (username) {
                await pool.query(
                    'UPDATE users SET username = ?, password = ?, birth_date = ?, gender = ?, contact_no = ?, role = ? WHERE user_id = ?',
                    [username, password, birth_date, gender, contact_no || null, 'vendor', user_id]
                );
            } else {
                await pool.query(
                    'UPDATE users SET password = ?, birth_date = ?, gender = ?, contact_no = ?, role = ? WHERE user_id = ?',
                    [password, birth_date, gender, contact_no || null, 'vendor', user_id]
                );
            }
            console.log('✅ Password updated for user');
        } else {
            if (username) {
                await pool.query(
                    'UPDATE users SET username = ?, birth_date = ?, gender = ?, contact_no = ?, role = ? WHERE user_id = ?',
                    [username, birth_date, gender, contact_no || null, 'vendor', user_id]
                );
            } else {
                await pool.query(
                    'UPDATE users SET birth_date = ?, gender = ?, contact_no = ?, role = ? WHERE user_id = ?',
                    [birth_date, gender, contact_no || null, 'vendor', user_id]
                );
            }
        }
        
        // Get file paths (Cloudinary returns URL in 'path' property)
        const validIdUrl = req.files?.valid_id ? req.files.valid_id[0].path : null;
        const businessPermitUrl = req.files?.business_permit ? req.files.business_permit[0].path : null;
        const proofImageUrl = req.files?.proof_image ? req.files.proof_image[0].path : null;
        
        console.log('📁 File URLs extracted:');
        console.log('  - valid_id_url:', validIdUrl);
        console.log('  - business_permit_url:', businessPermitUrl);
        console.log('  - proof_image_url:', proofImageUrl);
        console.log('  - vendor_id to update:', finalVendorId);
        
        // Update vendor record with document URLs
        const [updateResult] = await pool.query(
            'UPDATE vendors SET business_permit_url = ?, valid_id_url = ?, proof_image_url = ? WHERE vendor_id = ?',
            [businessPermitUrl, validIdUrl, proofImageUrl, finalVendorId]
        );
        
        console.log('✅ Vendor document URLs updated. Affected rows:', updateResult.affectedRows);
        
        // Verify the update by fetching the vendor record
        const [verifyVendor] = await pool.query(
            'SELECT vendor_id, valid_id_url, business_permit_url, proof_image_url FROM vendors WHERE vendor_id = ?',
            [finalVendorId]
        );
        
        if (verifyVendor.length > 0) {
            console.log('📋 Verified vendor document URLs in database:');
            console.log('  - valid_id_url:', verifyVendor[0].valid_id_url);
            console.log('  - business_permit_url:', verifyVendor[0].business_permit_url);
            console.log('  - proof_image_url:', verifyVendor[0].proof_image_url);
        } else {
            console.error('❌ Vendor record not found after update!');
        }
        
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
