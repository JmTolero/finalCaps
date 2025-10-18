const crypto = require('crypto');

/**
 * Generate a secure random token for password reset
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} - Secure random token
 */
const generateResetToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random token with timestamp for additional security
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} - Secure random token with timestamp
 */
const generateSecureToken = (length = 32) => {
    const randomPart = crypto.randomBytes(length).toString('hex');
    const timestamp = Date.now().toString(36);
    return `${randomPart}${timestamp}`;
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify if a token matches its hash
 * @param {string} token - Original token
 * @param {string} hashedToken - Stored hashed token
 * @returns {boolean} - True if tokens match
 */
const verifyToken = (token, hashedToken) => {
    const tokenHash = hashToken(token);
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hashedToken));
};

module.exports = {
    generateResetToken,
    generateSecureToken,
    hashToken,
    verifyToken
};
