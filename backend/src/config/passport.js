const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db/config');
const { generateToken } = require('../utils/jwt');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google OAuth profile:', profile);
        const email = profile.emails[0].value;
        
        // Check if user already exists with this email (regardless of auth_provider)
        // This handles cases where user registered manually and then tries Google sign-in
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
            // User exists - link Google account if not already linked
            if (!existingUser.google_id) {
                // User registered manually, now linking Google account
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
                role: existingUser.role || 'customer',
                auth_provider: 'google',
                profile_image_url: profile.photos[0]?.value || existingUser.profile_image_url
            };
            
            return done(null, userData);
        } else {
            // Create new user (email doesn't exist in database)
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
                role: 'customer',
                auth_provider: 'google',
                profile_image_url: profile.photos[0]?.value || null
            };

            return done(null, newUser);
        }
    } catch (error) {
        console.error('Google OAuth error:', error);
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
