const express = require('express');
const router = express.Router();
const { sendVendorApprovalEmail } = require('../utils/emailService');

// Test email endpoint for debugging
router.post('/test-email', async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    
    // Auto-detect environment: Gmail for localhost, Resend for production
    const service = process.env.NODE_ENV === 'production' 
      ? (process.env.EMAIL_SERVICE || 'resend')
      : (process.env.EMAIL_SERVICE || 'gmail');
    
    const emailConfig = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      EMAIL_SERVICE: service,
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS || 'NOT SET',
      FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET'
    };
    
    // Add service-specific config
    if (service === 'resend') {
      emailConfig.RESEND_API_KEY = process.env.RESEND_API_KEY ? 'SET' : 'NOT SET';
    } else if (service === 'mailgun') {
      emailConfig.MAILGUN_API_KEY = process.env.MAILGUN_API_KEY ? 'SET' : 'NOT SET';
      emailConfig.MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'NOT SET';
      emailConfig.MAILGUN_SMTP_USER = process.env.MAILGUN_SMTP_USER || 'NOT SET';
      emailConfig.MAILGUN_SMTP_PASSWORD = process.env.MAILGUN_SMTP_PASSWORD ? 'SET' : 'NOT SET';
    }
    
    console.log('📧 Email Configuration:', emailConfig);
    
    // Test sending a vendor approval email
    const testVendorData = {
      fname: 'Test',
      email: 'joemartolero987@gmail.com', // Change this to your actual email for testing
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
