const express = require('express');
const router = express.Router();
const { sendVendorApprovalEmail } = require('../utils/emailService');

// Test email endpoint for debugging
router.post('/test-email', async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    
    // Check environment variables
    const emailConfig = {
      EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
      ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS || 'NOT SET',
      FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET'
    };
    
    console.log('📧 Email Configuration:', emailConfig);
    
    // Test sending a vendor approval email
    const testVendorData = {
      fname: 'Test',
      email: 'joemartolero987@gmail.com', // Change this to your email for testing
      store_name: 'Test Store'
    };
    
    const result = await sendVendorApprovalEmail(testVendorData);
    
    res.json({
      success: true,
      message: 'Email test completed',
      emailConfig,
      emailResult: result
    });
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Email test failed'
    });
  }
});

module.exports = router;
