// Simple test script to verify QR code upload functionality
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const testQRUpload = async () => {
  try {
    console.log('🧪 Testing QR code upload...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('qr_code_image', testImageBuffer, {
      filename: 'test-qr.png',
      contentType: 'image/png'
    });
    formData.append('gcash_number', '09123456789');
    formData.append('business_name', 'Test Vendor Store');

    const response = await axios.post('http://localhost:3001/api/vendor/qr-code', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer test-token' // You'll need to replace with actual token
      }
    });

    console.log('✅ QR upload test successful:', response.data);
  } catch (error) {
    console.error('❌ QR upload test failed:', error.response?.data || error.message);
  }
};

// Uncomment to run test
// testQRUpload();

module.exports = { testQRUpload };
