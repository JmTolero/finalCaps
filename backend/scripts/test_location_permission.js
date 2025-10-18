// Test script to debug location permission issue
const testLocationPermission = () => {
    console.log('🧪 Testing location permission...');
    
    if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported');
        return;
    }
    
    console.log('📍 Testing geolocation API...');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('✅ SUCCESS: Location permission is working!');
            console.log('📍 Coordinates:', position.coords.latitude, position.coords.longitude);
            console.log('🎯 Accuracy:', position.coords.accuracy, 'meters');
            console.log('⏰ Timestamp:', new Date(position.timestamp));
        },
        (error) => {
            console.log('❌ ERROR: Location permission failed');
            console.log('Error code:', error.code);
            console.log('Error message:', error.message);
            
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.log('🚫 User denied location permission');
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.log('📍 Location information unavailable');
                    break;
                case error.TIMEOUT:
                    console.log('⏰ Location request timed out');
                    break;
                default:
                    console.log('❓ Unknown error');
                    break;
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
};

// Run the test
testLocationPermission();

console.log('\n💡 Debugging Tips:');
console.log('1. Check browser console for permission state logs');
console.log('2. Look for "Permission State Changed" messages');
console.log('3. Check if locationPermissionGranted is true');
console.log('4. Verify userLocation is not null');
console.log('5. Try refreshing the page after granting permission');
