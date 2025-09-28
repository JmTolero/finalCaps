const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token for user
const generateToken = (user) => {
  const payload = {
    user_id: user.id || user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    firstName: user.firstName || user.fname,
    lastName: user.lastName || user.lname,
    contact_no: user.contact_no
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'chill-app',
    audience: 'chill-users'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Decode JWT token without verification (for debugging)
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  JWT_SECRET
};
