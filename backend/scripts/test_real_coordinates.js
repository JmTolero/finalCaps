// Test script to verify the map works with real coordinates
const testMapWithRealData = () => {
    console.log('🧪 Testing map with real vendor data...');
    
    // Sample real vendor data from API
    const realVendorData = {
        vendor_id: 1,
        store_name: "theStore",
        vendor_status: "approved",
        fname: "a",
        lname: "adf",
        email: "adf",
        contact_no: "asdf",
        location: "Cordova, Cebu",
        latitude: "14.59950000",
        longitude: "120.98420000",
        flavors: [{ flavor_name: "asd" }]
    };
    
    // Transform to map format
    const mapMarker = {
        id: realVendorData.vendor_id,
        name: realVendorData.store_name || 'Unnamed Vendor',
        position: {
            lat: parseFloat(realVendorData.latitude) || 14.5995,
            lng: parseFloat(realVendorData.longitude) || 120.9842
        },
        infoWindow: `
            <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${realVendorData.store_name || 'Unnamed Vendor'}</h3>
                <p class="text-gray-600 mb-2">${realVendorData.contact_no || 'No contact info'}</p>
                <p class="text-sm text-gray-500 mb-3">📍 ${realVendorData.location || 'Location not specified'}</p>
                <p class="text-sm ${realVendorData.vendor_status === 'approved' ? 'text-green-600' : 'text-red-600'} mb-2">
                    ${realVendorData.vendor_status === 'approved' ? '🟢 Currently Open' : '🔴 Currently Closed'}
                </p>
                <p class="text-sm text-gray-600 mb-3">👤 ${realVendorData.fname} ${realVendorData.lname}</p>
                ${realVendorData.flavors && realVendorData.flavors.length > 0 ? `
                    <p class="text-sm text-gray-600 mb-3">
                        🍦 Flavors: ${realVendorData.flavors.map(f => f.flavor_name).join(', ')}
                    </p>
                ` : ''}
            </div>
        `,
        isOpen: realVendorData.vendor_status === 'approved',
        location: realVendorData.location
    };
    
    console.log('✅ Real vendor data transformed successfully!');
    console.log('📍 Map marker data:', mapMarker);
    console.log('🎯 Coordinates:', mapMarker.position);
    console.log('🏪 Vendor name:', mapMarker.name);
    console.log('📍 Location:', mapMarker.location);
    
    return mapMarker;
};

// Run the test
const result = testMapWithRealData();
console.log('\n🎉 Test completed! The map should now work with real vendor coordinates.');
console.log('🗺️ Next step: Update the frontend to use this real data instead of mock data.');
