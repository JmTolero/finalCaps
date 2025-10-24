const pool = require('../../db/config');
const jwt = require('jsonwebtoken');

// Helper function to get user ID from token or session
const getUserId = (req) => {
    // First try to get from JWT token
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            return decoded.user_id || decoded.id;
        } catch (error) {
            console.log('JWT token verification failed:', error.message);
        }
    }
    
    // Fallback to session or user object
    return req.session?.userId || req.user?.id || req.user?.user_id;
};

// Middleware to verify admin access
const verifyAdmin = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                error: 'No user session found' 
            });
        }

        // Check if user exists and has admin role
        const [users] = await pool.query(
            'SELECT user_id, role FROM users WHERE user_id = ? AND role = ?',
            [userId, 'admin']
        );

        if (users.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Access denied. Admin privileges required.' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Admin access verified',
            user: users[0]
        });

    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Middleware to verify vendor access
const verifyVendor = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                error: 'No user session found' 
            });
        }

        // Check if user exists and has vendor role
        const [users] = await pool.query(
            'SELECT user_id, role FROM users WHERE user_id = ? AND role = ?',
            [userId, 'vendor']
        );

        if (users.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Access denied. Vendor privileges required.' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Vendor access verified',
            user: users[0]
        });

    } catch (error) {
        console.error('Vendor verification error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Middleware to verify customer access
const verifyCustomer = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                error: 'No user session found' 
            });
        }

        // Check if user exists and has customer role
        const [users] = await pool.query(
            'SELECT user_id, role FROM users WHERE user_id = ? AND role = ?',
            [userId, 'customer']
        );

        if (users.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Access denied. Customer privileges required.' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Customer access verified',
            user: users[0]
        });

    } catch (error) {
        console.error('Customer verification error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

// Logout endpoint
const logout = async (req, res) => {
    try {
        // Destroy session if using sessions
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
            });
        }

        // Clear any JWT tokens if using JWT
        // This would typically involve blacklisting the token

        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};

module.exports = {
    verifyAdmin,
    verifyVendor,
    verifyCustomer,
    logout
};
