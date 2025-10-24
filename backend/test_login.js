const axios = require('axios');

async function testLogin() {
    try {
        // Test login for vendor user (you'll need to replace with actual credentials)
        const response = await axios.post('http://localhost:3001/api/auth/login', {
            username: 'joemartolero987@gmail.com', // Replace with actual vendor username
            password: 'your_password_here' // Replace with actual password
        });
        
        console.log('Login Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.user && response.data.user.profile_image_url) {
            console.log('✅ Profile image URL found:', response.data.user.profile_image_url);
        } else {
            console.log('❌ No profile image URL in response');
        }
        
    } catch (error) {
        console.error('Login test failed:', error.response?.data || error.message);
    }
}

testLogin();
