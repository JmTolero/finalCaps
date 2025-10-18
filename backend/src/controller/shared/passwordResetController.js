const pool = require('../../db/config');
const { validateRequiredFields, trimObjectStrings } = require('../../utils/validation');
const { generateSecureToken } = require('../../utils/tokenGenerator');
const { sendEmail } = require('../../config/email');

/**
 * Request password reset - sends reset email
 */
const requestPasswordReset = async (req, res) => {
    try {
        // Trim input values
        const trimmedBody = trimObjectStrings(req.body || {});
        const { email } = trimmedBody;
        
        // Validate required fields
        const requiredFields = [
            { key: 'email', name: 'Email' }
        ];
        
        const validation = validateRequiredFields(trimmedBody, requiredFields);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        // Check if user exists with this email
        const [users] = await pool.query('SELECT user_id, username, fname, lname, email FROM users WHERE email = ? LIMIT 1', [email]);
        
        if (users.length === 0) {
            // For security, don't reveal if email exists or not
            return res.json({ 
                message: 'If an account with that email exists, a password reset link has been sent.' 
            });
        }

        const user = users[0];
        
        // Generate secure reset token
        const resetToken = generateSecureToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        
        // Invalidate any existing reset tokens for this user
        await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE', [user.user_id]);
        
        // Store the new reset token
        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, email, expires_at) VALUES (?, ?, ?, ?)',
            [user.user_id, resetToken, email, expiresAt]
        );
        
        // Generate reset link
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        // Send reset email
        const emailResult = await sendEmail(
            email, 
            'passwordReset', 
            [resetLink, `${user.fname} ${user.lname}`.trim() || user.username]
        );
        
        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            return res.status(500).json({ 
                error: 'Failed to send reset email. Please try again later.' 
            });
        }
        
        return res.json({ 
            message: 'If an account with that email exists, a password reset link has been sent.' 
        });
        
    } catch (error) {
        console.error('Password reset request error:', error);
        return res.status(500).json({ 
            error: 'An error occurred while processing your request. Please try again later.' 
        });
    }
};

/**
 * Reset password using token
 */
const resetPassword = async (req, res) => {
    try {
        // Trim input values
        const trimmedBody = trimObjectStrings(req.body || {});
        const { token, newPassword } = trimmedBody;
        
        // Validate required fields
        const requiredFields = [
            { key: 'token', name: 'Reset token' },
            { key: 'newPassword', name: 'New password' }
        ];
        
        const validation = validateRequiredFields(trimmedBody, requiredFields);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        // Validate password strength (basic validation)
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters long.' 
            });
        }
        
        // Find valid reset token
        const [tokens] = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW() LIMIT 1',
            [token]
        );
        
        if (tokens.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid or expired reset token. Please request a new password reset.' 
            });
        }
        
        const resetToken = tokens[0];
        
        // Update user password
        await pool.query(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [newPassword, resetToken.user_id]
        );
        
        // Mark token as used
        await pool.query(
            'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
            [resetToken.id]
        );
        
        return res.json({ 
            message: 'Password has been reset successfully. You can now log in with your new password.' 
        });
        
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ 
            error: 'An error occurred while resetting your password. Please try again later.' 
        });
    }
};

/**
 * Verify reset token validity
 */
const verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ error: 'Reset token is required.' });
        }
        
        // Check if token exists and is valid
        const [tokens] = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW() LIMIT 1',
            [token]
        );
        
        if (tokens.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid or expired reset token.' 
            });
        }
        
        return res.json({ 
            valid: true,
            message: 'Reset token is valid.' 
        });
        
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({ 
            error: 'An error occurred while verifying the reset token.' 
        });
    }
};

module.exports = {
    requestPasswordReset,
    resetPassword,
    verifyResetToken
};
