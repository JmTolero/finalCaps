const express = require('express');
const router = express.Router();
const passwordResetController = require('../../controller/shared/passwordResetController');

// Request password reset (send reset email)
router.post('/forgot-password', passwordResetController.requestPasswordReset);

// Reset password using token
router.post('/reset-password', passwordResetController.resetPassword);

// Verify reset token validity
router.get('/verify-reset-token/:token', passwordResetController.verifyResetToken);

module.exports = router;
