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

        if (existingUser) {
            // Check if user is already a vendor
            if (existingUser.role === 'vendor') {
                return done(null, false, { message: 'User is already registered as a vendor' });
            }
            
            // Check if user has a pending vendor application
            const [existingVendor] = await pool.query(
                'SELECT * FROM vendors WHERE user_id = ?',
                [existingUser.user_id]
            );
            
            if (existingVendor.length > 0) {
                return done(null, false, { message: 'Vendor application already exists for this user' });
            }
            
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
            
            // Check if username already exists and make it unique
            let finalUsername = username;
            let counter = 1;
            while (true) {
                const [usernameCheck] = await pool.query(
                    'SELECT user_id FROM users WHERE username = ?',
                    [finalUsername]
                );
                if (usernameCheck.length === 0) break;
                finalUsername = username + counter;
                counter++;
            }

            const [result] = await pool.query(
                `INSERT INTO users (fname, lname, username, email, google_id, auth_provider, profile_image_url, role, status, created_at) 
                 VALUES (?, ?, ?, ?, ?, 'google', ?, 'vendor', 'active', NOW())`,
                [firstName, lastName, finalUsername, email, profile.id, profile.photos[0]?.value || null]
            );

            const newUser = {
                id: result.insertId,
                username: finalUsername,
                firstName: firstName,
                lastName: lastName,
                email: email,
                contact_no: null,
                role: 'vendor',
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
