const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db/config');
const { generateToken } = require('../utils/jwt');

// Configure Google OAuth Strategy for Vendor Registration
passport.use('vendor-google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_VENDOR_CALLBACK_URL || "http://localhost:3001/api/vendor/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Vendor Google OAuth profile:', profile);
        
        const email = profile.emails[0].value;
        
        // Check if user already exists with this email (regardless of auth_provider)
        const [existingUserByEmail] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        // Also check if user exists with this Google ID
        const [existingUserByGoogleId] = await pool.query(
            'SELECT * FROM users WHERE google_id = ?',
            [profile.id]
        );

        // Priority: Google ID match > Email match
        const existingUser = existingUserByGoogleId.length > 0 
            ? existingUserByGoogleId[0] 
            : (existingUserByEmail.length > 0 ? existingUserByEmail[0] : null);
        
        // Check for orphaned vendor records by email (in case user was deleted but vendor record remains)
        // This handles cases where deletion didn't fully clean up vendor records
        if (!existingUser) {
            try {
                const [orphanedVendorByEmail] = await pool.query(
                    `SELECT v.* FROM vendors v 
                     INNER JOIN users u ON v.user_id = u.user_id 
                     WHERE u.email = ? OR u.email LIKE ?`,
                    [email, `deleted_%@deleted.local`]
                );
                
                if (orphanedVendorByEmail.length > 0) {
                    console.log(`Found orphaned vendor record(s) for email ${email}, cleaning up...`);
                    for (const vendor of orphanedVendorByEmail) {
                        await pool.query('DELETE FROM vendors WHERE vendor_id = ?', [vendor.vendor_id]);
                    }
                }
            } catch (err) {
                console.error('Error checking for orphaned vendors:', err);
            }
        }

        if (existingUser) {
            // Check if user is deleted (anonymized) - allow re-registration
            const isDeletedUser = existingUser.email && existingUser.email.includes('@deleted.local');
            const isDeletedName = existingUser.fname === 'Deleted' && existingUser.lname === 'User';
            const isDeleted = isDeletedUser || isDeletedName;
            
            if (isDeleted) {
                // User was previously deleted - clean up orphaned vendor record if exists
                try {
                    const [orphanedVendor] = await pool.query(
                        'SELECT vendor_id FROM vendors WHERE user_id = ?',
                        [existingUser.user_id]
                    );
                    
                    if (orphanedVendor.length > 0) {
                        console.log(`Cleaning up orphaned vendor record ${orphanedVendor[0].vendor_id} for deleted user ${existingUser.user_id}`);
                        // Delete orphaned vendor record
                        await pool.query('DELETE FROM vendors WHERE vendor_id = ?', [orphanedVendor[0].vendor_id]);
                    }
                    
                    // Reset user role to customer to allow re-registration as vendor
                    await pool.query(
                        'UPDATE users SET role = ? WHERE user_id = ?',
                        ['customer', existingUser.user_id]
                    );
                    existingUser.role = 'customer'; // Update local reference
                } catch (err) {
                    console.error('Error cleaning up orphaned vendor:', err);
                }
                
                // Allow re-registration for deleted users
                // Continue to create new vendor record below
            } else if (existingUser.role === 'vendor') {
                // User exists with vendor role - check if vendor record actually exists
                const [vendorCheck] = await pool.query(
                    'SELECT vendor_id FROM vendors WHERE user_id = ?',
                    [existingUser.user_id]
                );
                
                // If no vendor record exists, allow re-registration (orphaned role)
                if (vendorCheck.length === 0) {
                    console.log(`User ${existingUser.user_id} has vendor role but no vendor record - allowing re-registration`);
                    // Reset role to customer temporarily
                    await pool.query(
                        'UPDATE users SET role = ? WHERE user_id = ?',
                        ['customer', existingUser.user_id]
                    );
                    existingUser.role = 'customer'; // Update local reference
                } else {
                    // Vendor record exists - block registration
                    return done(null, false, { message: 'User is already registered as a vendor' });
                }
            } else {
                // Check if user has a pending vendor application (for non-deleted, non-vendor users)
                const [existingVendor] = await pool.query(
                    'SELECT vendor_id, status FROM vendors WHERE user_id = ?',
                    [existingUser.user_id]
                );
                
                if (existingVendor.length > 0) {
                    const vendor = existingVendor[0];
                    // Allow re-registration if vendor status is 'pending' (after auto-return)
                    // This allows Google OAuth vendors to reapply after auto-return resets their status
                    if (vendor.status === 'pending') {
                        console.log(`Vendor ${vendor.vendor_id} has pending status - allowing Google OAuth re-registration`);
                        // Continue to allow registration - the completeVendorRegistration will handle updating the existing vendor record
                    } else {
                        // Vendor has other status (approved, rejected, etc.) - block registration
                        return done(null, false, { message: 'Vendor application already exists for this user' });
                    }
                }
            }
            
            // If user was deleted, restore their email and name from Google profile
            if (isDeleted) {
                await pool.query(
                    `UPDATE users SET 
                     email = ?, 
                     fname = ?, 
                     lname = ?,
                     google_id = ?, 
                     auth_provider = 'google', 
                     profile_image_url = ?,
                     status = 'active'
                     WHERE user_id = ?`,
                    [
                        email, 
                        profile.name.givenName || '', 
                        profile.name.familyName || '',
                        profile.id, 
                        profile.photos[0]?.value || existingUser.profile_image_url,
                        existingUser.user_id
                    ]
                );
                // Update local reference
                existingUser.email = email;
                existingUser.fname = profile.name.givenName || '';
                existingUser.lname = profile.name.familyName || '';
            } else {
                // Link Google account if not already linked (for existing customers)
                if (!existingUser.google_id) {
                    await pool.query(
                        'UPDATE users SET google_id = ?, auth_provider = "google", profile_image_url = ? WHERE user_id = ?',
                        [profile.id, profile.photos[0]?.value || existingUser.profile_image_url, existingUser.user_id]
                    );
                } else if (existingUser.google_id !== profile.id) {
                    // Google ID mismatch - this shouldn't happen, but handle it
                    console.warn(`Google ID mismatch for user ${existingUser.user_id}. Existing: ${existingUser.google_id}, New: ${profile.id}`);
                }
            }
            
            const userData = {
                id: existingUser.user_id,
                username: existingUser.username,
                firstName: existingUser.fname,
                lastName: existingUser.lname,
                email: existingUser.email,
                contact_no: existingUser.contact_no,
                role: existingUser.role, // Keep current role (will be updated to 'vendor' in completeVendorRegistration)
                auth_provider: 'google',
                profile_image_url: profile.photos[0]?.value || existingUser.profile_image_url,
                isExistingUser: true,
                needsUsernameUpdate: true // Flag to indicate username can be updated
            };
            
            return done(null, userData);
        } else {
            // Create new user with vendor role
            const firstName = profile.name.givenName || '';
            const lastName = profile.name.familyName || '';
            // Use email local part as username, replace dots with underscores for validation
            const username = email.split('@')[0].replace(/\./g, '_');
            
            // Check if username already exists and make it unique (excluding deleted users)
            let finalUsername = username;
            let counter = 1;
            while (true) {
                const [usernameCheck] = await pool.query(
                    `SELECT user_id FROM users 
                     WHERE username = ? 
                     AND email NOT LIKE '%@deleted.local'
                     AND NOT (fname = 'Deleted' AND lname = 'User')`,
                    [finalUsername]
                );
                if (usernameCheck.length === 0) break;
                finalUsername = username + counter;
                counter++;
            }

            // Create new user with 'customer' role initially
            // Role will be changed to 'vendor' when they complete the registration form
            const [result] = await pool.query(
                `INSERT INTO users (fname, lname, username, email, google_id, auth_provider, profile_image_url, role, status, created_at) 
                 VALUES (?, ?, ?, ?, ?, 'google', ?, 'customer', 'active', NOW())`,
                [firstName, lastName, finalUsername, email, profile.id, profile.photos[0]?.value || null]
            );

            const newUser = {
                id: result.insertId,
                username: finalUsername,
                firstName: firstName,
                lastName: lastName,
                email: email,
                contact_no: null,
                role: 'customer', // Start as customer, will be changed to vendor after completing registration
                auth_provider: 'google',
                profile_image_url: profile.photos[0]?.value || null,
                isExistingUser: false
            };

            return done(null, newUser);
        }
    } catch (error) {
        console.error('Vendor Google OAuth error:', error);
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
