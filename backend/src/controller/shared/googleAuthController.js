const { generateToken } = require('../../utils/jwt');

// Google OAuth success handler
const googleAuthSuccess = async (req, res) => {
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
        const redirectUrl = `${frontendUrl}/google-callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Google auth success error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Google OAuth failure handler
const googleAuthFailure = (req, res) => {
    // Redirect to frontend with error parameter instead of returning JSON
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/google-callback?error=cancelled`;
    res.redirect(redirectUrl);
};

// Google OAuth logout handler
const googleLogout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
};

module.exports = {
    googleAuthSuccess,
    googleAuthFailure,
    googleLogout
};
