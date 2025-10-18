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
        
        // Check if user already exists with this Google ID
        const [existingUser] = await pool.query(
            'SELECT * FROM users WHERE google_id = ? OR (email = ? AND auth_provider = "google")',
            [profile.id, profile.emails[0].value]
        );

        if (existingUser.length > 0) {
            // User exists, update their Google ID if needed
            const user = existingUser[0];
            if (!user.google_id) {
                await pool.query(
                    'UPDATE users SET google_id = ?, auth_provider = "google" WHERE user_id = ?',
                    [profile.id, user.user_id]
                );
            }
            
            const userData = {
                id: user.user_id,
                username: user.username,
                firstName: user.fname,
                lastName: user.lname,
                email: user.email,
                contact_no: user.contact_no,
                role: user.role || 'customer',
                auth_provider: 'google',
                profile_image_url: user.profile_image_url
            };
            
            return done(null, userData);
        } else {
            // Create new user
            const email = profile.emails[0].value;
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
