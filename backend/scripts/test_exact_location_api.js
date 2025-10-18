const axios = require('axios');

// Test the exact location API endpoint
async function testExactLocationAPI() {
    try {
        console.log('🧪 Testing Exact Location API...\n');
        
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const testAddressId = 1; // Use a real address ID from your database
        const testCoordinates = {
            exact_latitude: 14.5995,
            exact_longitude: 120.9842,
            coordinate_accuracy: 'exact',
            coordinate_source: 'vendor_pin'
        };
        
        console.log(`📍 Testing with address ID: ${testAddressId}`);
        console.log(`🎯 Coordinates: ${testCoordinates.exact_latitude}, ${testCoordinates.exact_longitude}`);
        
        // Test the API endpoint
        const response = await axios.put(
            `${apiBase}/api/addresses/${testAddressId}/exact-location`,
            testCoordinates,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer test-token` // You might need a real token
                }
            }
        );
        
        console.log('\n✅ API Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('\n❌ API Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testExactLocationAPI();
