import React, { useState, useEffect, useMemo } from 'react';
import GoogleMapFree from '../shared/GoogleMapFree';
import axios from 'axios';

const CustomerVendorMap = ({ 
  onVendorSelect, 
  onLocationChange,
  className = "w-full h-96" 
}) => {
  const [vendors, setVendors] = useState([]);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch vendors and delivery zones
  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    setLoading(true);
    
    // Fetch real vendor data from API
    console.log('Loading real vendor data from API...');
    
    const mockVendors = [
      {
        id: 1,
        name: 'ChillNet Ice Cream Shop',
        position: {
          lat: 14.5995,
          lng: 120.9842
        },
        infoWindow: `
          <div class="p-4">
            <h3 class="font-bold text-lg mb-2">ChillNet Ice Cream Shop</h3>
            <p class="text-gray-600 mb-2">+63 912 345 6789</p>
            <p class="text-sm text-gray-500 mb-3">📍 Cordova, Cebu</p>
            <p class="text-sm text-gray-600 mb-3">⭐ 4.5/5 (55 reviews)</p>
            <div class="flex gap-2">
              <button onclick="selectVendor(1)" 
                      class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                View Shop
              </button>
            </div>
          </div>
        `,
        deliveryZones: ['Cordova', 'Lapu-Lapu City'],
        isOpen: true,
        rating: 4.5,
        flavors: ['Mango', 'Ube', 'Choco'],
        drumSizes: ['Large', 'Medium', 'Small']
      },
      {
        id: 2,
        name: 'Frozen Delights',
        position: {
          lat: 14.6042,
          lng: 120.9822
        },
        infoWindow: `
          <div class="p-4">
            <h3 class="font-bold text-lg mb-2">Frozen Delights</h3>
            <p class="text-gray-600 mb-2">+63 917 654 3210</p>
            <p class="text-sm text-gray-500 mb-3">📍 Location not specified</p>
            <p class="text-sm text-gray-600 mb-3">⭐ 4.2/5 (32 reviews)</p>
            <div class="flex gap-2">
              <button onclick="selectVendor(2)" 
                      class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                View Shop
              </button>
            </div>
          </div>
        `,
        deliveryZones: ['Makati', 'Taguig'],
        isOpen: false,
        rating: 4.2,
        flavors: ['Vanilla', 'Strawberry', 'Cookies & Cream'],
        drumSizes: ['Large', 'Medium']
      }
    ];

    const mockZones = [
      {
        id: 1,
        name: 'Manila',
        type: 'city',
        price: 50,
        boundaries: [
          { lat: 14.5, lng: 120.9 },
          { lat: 14.6, lng: 120.9 },
          { lat: 14.6, lng: 121.0 },
          { lat: 14.5, lng: 121.0 }
        ],
        color: '#4CAF50'
      },
      {
        id: 2,
        name: 'Quezon City',
        type: 'city',
        price: 75,
        boundaries: [
          { lat: 14.6, lng: 121.0 },
          { lat: 14.7, lng: 121.0 },
          { lat: 14.7, lng: 121.1 },
          { lat: 14.6, lng: 121.1 }
        ],
        color: '#FF9800'
      },
      {
        id: 3,
        name: 'Makati',
        type: 'city',
        price: 100,
        boundaries: [
          { lat: 14.5, lng: 121.0 },
          { lat: 14.6, lng: 121.0 },
          { lat: 14.6, lng: 121.1 },
          { lat: 14.5, lng: 121.1 }
        ],
        color: '#F44336'
      }
    ];

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Fetch real vendor data from API
      console.log('Fetching real vendor data from API...');
      const response = await axios.get(`${apiBase}/api/vendor/with-locations`);
      
      if (response.data.success && response.data.vendors) {
        // Transform API data to match expected format
        const realVendors = response.data.vendors.map(vendor => {
          // Prioritize exact GPS coordinates over approximate
          const displayLat = parseFloat(vendor.exact_latitude) || parseFloat(vendor.latitude) || 14.5995;
          const displayLng = parseFloat(vendor.exact_longitude) || parseFloat(vendor.longitude) || 120.9842;
          const locationType = vendor.exact_latitude && vendor.exact_longitude ? 'exact' : 
                              (vendor.latitude && vendor.longitude ? 'approximate' : 'none');
          const coordinateSource = vendor.coordinate_source || 'geocoding';
          
          // Choose marker color based on location accuracy with source info
          const sourceIcon = coordinateSource === 'gps' ? '🎯' : coordinateSource === 'vendor_pin' ? '📍' : '🌐';
          const locationBadge = locationType === 'exact' ? 
            `<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">${sourceIcon} Exact Location</span>` :
            locationType === 'approximate' ? 
            `<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">${sourceIcon} Approximate Location</span>` :
            '<span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">📍 Location Unverified</span>';

          return {
            id: vendor.vendor_id,
            name: vendor.store_name || 'Unnamed Store',
            position: {
              lat: displayLat,
              lng: displayLng
            },
            locationType: locationType, // Track location accuracy
            infoWindow: `
              <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${vendor.store_name || 'Unnamed Store'}</h3>
                <div class="mb-3">${locationBadge}</div>
                <p class="text-gray-600 mb-2">${vendor.contact_no || 'No contact info'}</p>
                <p class="text-sm text-gray-500 mb-3">📍 ${vendor.location || 'Location not specified'}</p>
                <p class="text-sm text-gray-600 mb-3">👤 ${vendor.fname} ${vendor.lname}</p>
                ${vendor.flavors && vendor.flavors.length > 0 ? `
                  <p class="text-sm text-gray-600 mb-3">
                    🍦 Flavors: ${vendor.flavors.map(f => f.flavor_name).join(', ')}
                  </p>
                ` : ''}
                <div class="flex gap-2">
                  <button onclick="selectVendor(${vendor.vendor_id})" 
                          class="bg-orange-300 text-black px-3 py-1 rounded text-sm hover:bg-orange-400">
                    View Shop
                  </button>
                </div>
              </div>
            `,
            deliveryZones: [vendor.location],
            isOpen: vendor.vendor_status === 'approved',
            rating: 4.5, // Default rating since not in API
            flavors: vendor.flavors || [],
            drumSizes: ['Large', 'Medium', 'Small'], // Default sizes
            location: vendor.location,
            vendorData: vendor // Include original vendor data
          };
        });
        
        setVendors(realVendors);
        setDeliveryZones(mockZones); // Keep mock zones for now
        setError(null);
        setLoading(false);
        console.log(`✅ Loaded ${realVendors.length} real vendors from API`);
      } else {
        console.log('❌ No vendor data received from API, using mock data');
        setVendors(mockVendors);
        setDeliveryZones(mockZones);
        setError(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error fetching real vendor data:', error);
      console.log('Using mock data as fallback');
      setVendors(mockVendors);
      setDeliveryZones(mockZones);
      setError('Failed to load vendor data');
      setLoading(false);
    }
  };

  // Handle location change from map
  const handleLocationChange = (location) => {
    setUserLocation(location);
    
    // Determine which delivery zone the user is in
    const userZone = findUserZone(location);
    setSelectedZone(userZone);
    
    if (onLocationChange) {
      onLocationChange(location, userZone);
    }
  };

  // Find which delivery zone contains the user's location
  const findUserZone = (location) => {
    // This would typically use a more sophisticated geocoding service
    // For now, we'll use a simple distance-based approach
    return deliveryZones.find(zone => {
      // Simple check - in a real app, you'd use proper polygon containment
      return zone.boundaries.some(boundary => 
        Math.abs(boundary.lat - location.lat) < 0.1 && 
        Math.abs(boundary.lng - location.lng) < 0.1
      );
    });
  };

  // Handle marker click
  const handleMarkerClick = (marker, mapMarker) => {
    // Call onVendorSelect with the clicked vendor data
    if (marker.vendorData && onVendorSelect) {
      onVendorSelect(marker.vendorData);
    }

    // Add custom click handlers for vendor selection
    window.selectVendor = (vendorId) => {
      const vendor = vendors.find(v => v.id === vendorId);
      if (onVendorSelect) {
        onVendorSelect(vendor);
      }
    };

    window.checkDelivery = (vendorId) => {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor && selectedZone) {
        alert(`Delivery to ${selectedZone.name}: ₱${selectedZone.price}`);
      } else {
        alert('Please enable location to check delivery availability');
      }
    };
  };

  // Create map markers for vendors with location accuracy visual indicators
  const createVendorMarkers = useMemo(() => {
    return vendors.map(vendor => ({
      id: vendor.id,
      position: vendor.position,
      title: vendor.name,
      infoWindow: vendor.infoWindow,
      isOpen: vendor.isOpen,
      locationType: vendor.locationType,
      // Use different marker colors based on location accuracy
      icon: vendor.locationType === 'exact' ? {
        path: 'M12 0C7.6 0 4 3.6 4 8c0 5.4 8 13 8 13s8-7.6 8-13c0-4.4-3.6-8-8-8z',
        fillColor: '#10b981', // Green for exact location
        fillOpacity: 1,
        strokeColor: '#065f46',
        strokeWeight: 2,
        scale: 1.5,
        anchor: { x: 12, y: 24 }
      } : vendor.locationType === 'approximate' ? {
        path: 'M12 0C7.6 0 4 3.6 4 8c0 5.4 8 13 8 13s8-7.6 8-13c0-4.4-3.6-8-8-8z',
        fillColor: '#f59e0b', // Orange for approximate location
        fillOpacity: 0.8,
        strokeColor: '#b45309',
        strokeWeight: 2,
        scale: 1.3,
        anchor: { x: 12, y: 24 }
      } : undefined, // Use default marker for unverified
      vendorData: vendor // Include full vendor data for click handler
    }));
  }, [vendors]); // Only recalculate when vendors change

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading vendors and delivery zones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 rounded-lg`}>
        <div className="text-center text-red-600">
          <p className="mb-2">{error}</p>
          <button 
            onClick={fetchVendorData}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {/* Map */}
      <GoogleMapFree
        center={userLocation ? [userLocation.lat, userLocation.lng] : [14.5995, 120.9842]}
        zoom={userLocation ? 12 : 10}
        markers={createVendorMarkers}
        onLocationChange={handleLocationChange}
        onMarkerClick={handleMarkerClick}
        showCurrentLocation={true}
        className="w-full"
      />

      {/* Zone Information */}
      {selectedZone && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Delivery Zone Information</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-700">
                <span className="font-medium">Zone:</span> {selectedZone.name}
              </p>
              <p className="text-blue-700">
                <span className="font-medium">Type:</span> {selectedZone.type}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-800">
                ₱{selectedZone.price}
              </p>
              <p className="text-sm text-blue-600">Delivery Fee</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerVendorMap;
