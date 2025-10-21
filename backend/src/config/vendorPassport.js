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
        
        // Check if user already exists with this email
        const [existingUser] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            const user = existingUser[0];
            
            // Check if user is already a vendor
            if (user.role === 'vendor') {
                return done(null, false, { message: 'User is already registered as a vendor' });
            }
            
            // Check if user has a pending vendor application
            const [existingVendor] = await pool.query(
                'SELECT * FROM vendors WHERE user_id = ?',
                [user.user_id]
            );
            
            if (existingVendor.length > 0) {
                return done(null, false, { message: 'Vendor application already exists for this user' });
            }
            
            // Update user with Google ID and auth provider
            await pool.query(
                'UPDATE users SET google_id = ?, auth_provider = "google", profile_image_url = ? WHERE user_id = ?',
                [profile.id, profile.photos[0]?.value || null, user.user_id]
            );
            
            const userData = {
                id: user.user_id,
                username: user.username,
                firstName: user.fname,
                lastName: user.lname,
                email: user.email,
                contact_no: user.contact_no,
                role: user.role,
                auth_provider: 'google',
                profile_image_url: profile.photos[0]?.value || null,
                isExistingUser: true,
                needsUsernameUpdate: true // Flag to indicate username can be updated
            };
            
            return done(null, userData);
        } else {
            // Create new user with vendor role
            const firstName = profile.name.givenName || '';
            const lastName = profile.name.familyName || '';
            const username = email.split('@')[0] + '_' + profile.id.slice(-4); // Generate unique username
            
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
