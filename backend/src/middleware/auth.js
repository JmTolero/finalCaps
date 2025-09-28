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
    // First, try to verify as JWT token
    try {
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
      return;
    } catch (jwtError) {
      console.log('🔐 Not a JWT token, trying session data...');
    }

    // Fallback: Parse as session data (current approach)
    const userData = JSON.parse(token);
    console.log('🔐 Parsed session user data:', userData);
    
    if (!userData.user_id && !userData.id) {
      console.log('❌ No user_id or id in user data');
      return res.status(403).json({
        success: false,
        error: 'Invalid user data'
      });
    }

    // Normalize user_id field
    if (userData.id && !userData.user_id) {
      userData.user_id = userData.id;
    }

    req.user = userData;
    console.log('✅ Session Authentication successful for user:', userData.user_id);
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

module.exports = {
  authenticateToken
};
