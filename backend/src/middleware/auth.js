const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token or session data
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Auth middleware - Authorization header:', authHeader);
  console.log('🔐 Auth middleware - Extracted token:', token);

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔐 JWT token verified:', decoded);
    
    if (!decoded.user_id && !decoded.id) {
      console.log('❌ No user_id or id in JWT payload');
      return res.status(403).json({
        success: false,
        error: 'Invalid JWT payload'
      });
    }

    // Normalize user_id field
    if (decoded.id && !decoded.user_id) {
      decoded.user_id = decoded.id;
    }

    req.user = decoded;
    console.log('✅ JWT Authentication successful for user:', decoded.user_id);
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    return res.status(403).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = {
  authenticateToken
};
