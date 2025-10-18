const { sendVendorApprovalEmail, sendVendorRejectionEmail } = require('./src/utils/emailService');
require('dotenv').config();

// Test email functionality
async function testEmailNotifications() {
  console.log('🧪 Testing Email Notifications...\n');

  // Test data
  const testVendor = {
    fname: 'John',
    email: 'joemartolero987@gmail.com', // Replace with your test email
    store_name: 'Test Ice Cream Store',
    rejectionReason: 'Test rejection reason for testing purposes',
    autoReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
  };

  console.log('📧 Email Configuration:');
  console.log(`- Service: ${process.env.EMAIL_SERVICE || 'Not set'}`);
  console.log(`- User: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`- Enabled: ${process.env.ENABLE_EMAIL_NOTIFICATIONS || 'Not set'}`);
  console.log(`- Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}\n`);

  // Test approval email
  console.log('1️⃣ Testing Vendor Approval Email...');
  try {
    const approvalResult = await sendVendorApprovalEmail(testVendor);
    if (approvalResult.success) {
      console.log('✅ Approval email test passed');
      console.log(`   Message ID: ${approvalResult.messageId}`);
    } else {
      console.log('❌ Approval email test failed');
      console.log(`   Error: ${approvalResult.error}`);
    }
  } catch (error) {
    console.log('❌ Approval email test error:', error.message);
  }

  console.log('\n2️⃣ Testing Vendor Rejection Email...');
  try {
    const rejectionResult = await sendVendorRejectionEmail(testVendor);
    if (rejectionResult.success) {
      console.log('✅ Rejection email test passed');
      console.log(`   Message ID: ${rejectionResult.messageId}`);
    } else {
      console.log('❌ Rejection email test failed');
      console.log(`   Error: ${rejectionResult.error}`);
    }
  } catch (error) {
    console.log('❌ Rejection email test error:', error.message);
  }

  console.log('\n🎯 Test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Check your email inbox for test emails');
  console.log('2. If using Mailtrap, check your Mailtrap inbox');
  console.log('3. Update test email address in this script');
  console.log('4. Test with real vendor approval/rejection in admin panel');
}

// Run the test
testEmailNotifications().catch(console.error);
