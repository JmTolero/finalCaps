import React, { useEffect, useRef, useState } from 'react';

const GoogleMapFree = ({ 
  center = [14.5995, 120.9842], // Default to Manila [lat, lng]
  zoom = 10,
  markers = [],
  onLocationChange,
  onMarkerClick,
  showCurrentLocation = true,
  className = "w-full h-96"
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  
  // const [mapLoaded, setMapLoaded] = useState(false); // Removed unused variable
  const [apiKey, setApiKey] = useState('');

  // Check for Google Maps API key
  useEffect(() => {
    // Try environment variable first, fallback to hardcoded
    const envKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const hardcodedKey = 'AIzaSyArt8GMWuhdWsHKM73YdXwvKOsMLaaeQYM';
    const key = envKey || hardcodedKey;
    
    console.log('🔍 API Key Check:', {
      'Environment variable': envKey ? envKey.substring(0, 10) + '...' : 'Not found',
      'Using': envKey ? 'Environment' : 'Hardcoded',
      'Final key': key.substring(0, 10) + '...'
    });
    
    if (key && key.trim() !== '') {
      setApiKey(key);
      console.log('✅ Google Maps API key found:', key.substring(0, 10) + '...');
    } else {
      console.log('⚠️ No Google Maps API key found - using free fallback');
    }
  }, []);

  // Check location permission status on component mount
  useEffect(() => {
    // Don't automatically request location - wait for user gesture
    console.log('📍 Component mounted - waiting for user to request location');
    setIsLoading(false);
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) return;

      // Initialize map with default center if no user location
      if (!center) {
        // Use a default center (Manila) if no user location provided
        const defaultCenter = [14.5995, 120.9842];
        console.log('🗺️ Using default center:', defaultCenter);
        
        // If no API key, use a beautiful fallback
        if (!apiKey) {
          createFallbackMap();
          return;
        }

        // Load Google Maps API
        if (!window.google || !window.google.maps) {
          loadGoogleMapsAPI();
          return;
        }

        createGoogleMap();
        return;
      }

      // If no API key, use a beautiful fallback
      if (!apiKey) {
        createFallbackMap();
        return;
      }

      // Load Google Maps API
      if (!window.google || !window.google.maps) {
        loadGoogleMapsAPI();
        return;
      }

      createGoogleMap();
    };

    const loadGoogleMapsAPI = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Maps API loaded successfully');
        setTimeout(createGoogleMap, 100);
      };
      
      script.onerror = () => {
        console.log('❌ Failed to load Google Maps API - using fallback');
        createFallbackMap();
      };
      
      // Add global error handler for Google Maps API errors
      window.gm_authFailure = () => {
        console.log('🚨 Google Maps authentication failure - switching to fallback');
        createFallbackMap();
      };
      
      document.head.appendChild(script);
    };

    const createGoogleMap = () => {
      try {
        const mapOptions = {
          center: { lat: center[0], lng: center[1] },
          zoom: zoom,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true
        };

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
        
        // Add error listener for billing and referrer issues
        window.google.maps.event.addListener(mapInstanceRef.current, 'error', (error) => {
          console.log('🚨 Google Maps Error:', error);
          if (error.includes('BillingNotEnabled') || 
              error.includes('billing') || 
              error.includes('RefererNotAllowed') ||
              error.includes('RefererNotAllowedMapError')) {
            console.log('💳 Google Maps error detected - switching to fallback map');
            createFallbackMap();
          }
        });
        
        // Add markers
        addMarkersToMap();
        
        // Add click listener for map
        mapInstanceRef.current.addListener('click', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          console.log('Map clicked at:', { lat, lng });
        });

        // setMapLoaded(true); // Removed unused variable
        setIsLoading(false);
        console.log('✅ Google Maps initialized successfully');
        
      } catch (error) {
        console.log('❌ Error creating Google Map:', error);
        createFallbackMap();
      }
    };

    const addMarkersToMap = () => {
      if (!mapInstanceRef.current) return;

      // Add customer location marker if user location is available
      if (userLocation) {
        const customerMarker = new window.google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#2196F3" stroke="white" stroke-width="3"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
                <text x="16" y="20" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#2196F3">📍</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          },
          zIndex: 1000 // Ensure customer marker appears on top
        });

        // Add info window for customer location
        const customerInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; text-align: center;">
              <h3 style="margin: 0 0 4px 0; color: #2196F3; font-size: 14px;">📍 Your Location</h3>
              <p style="margin: 0; color: #666; font-size: 12px;">You are here</p>
            </div>
          `
        });

        customerMarker.addListener('click', () => {
          customerInfoWindow.open(mapInstanceRef.current, customerMarker);
        });

        console.log('✅ Customer location marker added');
      }

      // Add vendor markers
      if (markers.length > 0) {
        markers.forEach((marker, index) => {
          const googleMarker = new window.google.maps.Marker({
            position: { lat: marker.position.lat, lng: marker.position.lng },
            map: mapInstanceRef.current,
            title: marker.title,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#2196F3" stroke="white" stroke-width="2"/>
                    <text x="12" y="16" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">🏪</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12)
              },
            zIndex: 100 // Vendor markers below customer marker
          });

          // Add click listener
          googleMarker.addListener('click', () => {
            console.log('Vendor marker clicked:', marker.title);
            if (onMarkerClick) {
              onMarkerClick(marker, googleMarker);
            }
          });

          // Add info window if available
          if (marker.infoWindow) {
            const infoWindow = new window.google.maps.InfoWindow({
              content: marker.infoWindow
            });

            googleMarker.addListener('click', () => {
              infoWindow.open(mapInstanceRef.current, googleMarker);
            });
          }
        });

        console.log(`✅ Added ${markers.length} vendor markers`);
      }
    };

    const createFallbackMap = () => {
      console.log('🗺️ Creating enhanced fallback map');
      const mapContainer = mapRef.current;
      mapContainer.innerHTML = '';
      
      // Use default center if none provided
      const mapCenter = center || [14.5995, 120.9842];
      
      // Create a beautiful map-like background
      const mapBackground = document.createElement('div');
      mapBackground.style.position = 'absolute';
      mapBackground.style.top = '0';
      mapBackground.style.left = '0';
      mapBackground.style.width = '100%';
      mapBackground.style.height = '100%';
      mapBackground.style.background = `
        linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%),
        radial-gradient(circle at 30% 30%, rgba(33, 150, 243, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 70% 70%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)
      `;
      mapBackground.style.backgroundImage = `
        linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
        linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
        radial-gradient(circle at 25% 25%, rgba(33, 150, 243, 0.1) 0%, transparent 30%),
        radial-gradient(circle at 75% 75%, rgba(76, 175, 80, 0.1) 0%, transparent 30%)
      `;
      mapBackground.style.backgroundSize = '20px 20px, 20px 20px, 200px 200px, 200px 200px';
      mapBackground.style.borderRadius = '8px';
      mapBackground.style.cursor = 'grab';
      
      // Add zoom controls to fallback map
      const zoomControls = document.createElement('div');
      zoomControls.style.position = 'absolute';
      zoomControls.style.top = '10px';
      zoomControls.style.right = '10px';
      zoomControls.style.display = 'flex';
      zoomControls.style.flexDirection = 'column';
      zoomControls.style.gap = '5px';
      
      const zoomInBtn = document.createElement('button');
      zoomInBtn.innerHTML = '+';
      zoomInBtn.style.width = '30px';
      zoomInBtn.style.height = '30px';
      zoomInBtn.style.backgroundColor = 'white';
      zoomInBtn.style.border = '1px solid #ccc';
      zoomInBtn.style.borderRadius = '4px';
      zoomInBtn.style.cursor = 'pointer';
      zoomInBtn.style.fontSize = '16px';
      zoomInBtn.style.fontWeight = 'bold';
      zoomInBtn.onclick = () => {
        console.log('🔍 Zoom in clicked');
        alert('Zoom in - Fallback map zoom simulation');
      };
      
      const zoomOutBtn = document.createElement('button');
      zoomOutBtn.innerHTML = '-';
      zoomOutBtn.style.width = '30px';
      zoomOutBtn.style.height = '30px';
      zoomOutBtn.style.backgroundColor = 'white';
      zoomOutBtn.style.border = '1px solid #ccc';
      zoomOutBtn.style.borderRadius = '4px';
      zoomOutBtn.style.cursor = 'pointer';
      zoomOutBtn.style.fontSize = '16px';
      zoomOutBtn.style.fontWeight = 'bold';
      zoomOutBtn.onclick = () => {
        console.log('🔍 Zoom out clicked');
        alert('Zoom out - Fallback map zoom simulation');
      };
      
      zoomControls.appendChild(zoomInBtn);
      zoomControls.appendChild(zoomOutBtn);
      
      mapContainer.appendChild(mapBackground);
      mapContainer.appendChild(zoomControls);

      // Add customer location marker to fallback map
      if (userLocation) {
        const customerMarkerElement = document.createElement('div');
        customerMarkerElement.style.position = 'absolute';
        customerMarkerElement.style.left = '50%';
        customerMarkerElement.style.top = '50%';
        customerMarkerElement.style.transform = 'translate(-50%, -50%)';
        customerMarkerElement.style.width = '32px';
        customerMarkerElement.style.height = '32px';
        customerMarkerElement.style.backgroundColor = '#2196F3';
        customerMarkerElement.style.borderRadius = '50%';
        customerMarkerElement.style.border = '3px solid white';
        customerMarkerElement.style.display = 'flex';
        customerMarkerElement.style.alignItems = 'center';
        customerMarkerElement.style.justifyContent = 'center';
        customerMarkerElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
        customerMarkerElement.style.color = 'white';
        customerMarkerElement.style.fontWeight = 'bold';
        customerMarkerElement.style.fontSize = '16px';
        customerMarkerElement.style.cursor = 'pointer';
        customerMarkerElement.style.zIndex = '2000';
        customerMarkerElement.innerHTML = '📍';
        customerMarkerElement.title = 'Your Location';
        
        customerMarkerElement.addEventListener('click', () => {
          console.log('Customer location marker clicked');
          alert('📍 You are here!');
        });
        
        mapContainer.appendChild(customerMarkerElement);
        console.log('✅ Customer location marker added to fallback map');
      }

      // Add vendor markers to fallback map with coordinate-based positioning
      if (markers.length > 0) {
        console.log(`📍 Adding ${markers.length} vendor markers to fallback map`);
        
        markers.forEach((marker, index) => {
          const markerElement = document.createElement('div');
          markerElement.style.position = 'absolute';
          
          // Calculate position based on actual coordinates
          const latDiff = marker.position.lat - mapCenter[0];
          const lngDiff = marker.position.lng - mapCenter[1];
          
          // Scale factors for better distribution on map
          const latScale = 1500; // Adjust for latitude spread
          const lngScale = 1500; // Adjust for longitude spread
          
          const leftPercent = Math.max(10, Math.min(90, 50 + (lngDiff * latScale)));
          const topPercent = Math.max(10, Math.min(90, 50 - (latDiff * lngScale)));
          
          markerElement.style.left = `${leftPercent}%`;
          markerElement.style.top = `${topPercent}%`;
          markerElement.style.transform = 'translate(-50%, -50%)';
          markerElement.style.width = '24px';
          markerElement.style.height = '24px';
          markerElement.style.backgroundColor = '#2196F3';
          markerElement.style.borderRadius = '50%';
          markerElement.style.border = '3px solid white';
          markerElement.style.display = 'flex';
          markerElement.style.alignItems = 'center';
          markerElement.style.justifyContent = 'center';
          markerElement.style.boxShadow = '0 3px 6px rgba(0,0,0,0.4)';
          markerElement.style.color = 'white';
          markerElement.style.fontWeight = 'bold';
          markerElement.style.fontSize = '12px';
          markerElement.style.cursor = 'pointer';
          markerElement.style.zIndex = '1000';
          markerElement.innerHTML = '🏪';
          markerElement.title = `${marker.title || `Vendor ${index + 1}`} - ${marker.location || 'Location not specified'}`;
          
          // Add hover effects
          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
            markerElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.6)';
          });
          
          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'translate(-50%, -50%) scale(1)';
            markerElement.style.boxShadow = '0 3px 6px rgba(0,0,0,0.4)';
          });
          
          markerElement.addEventListener('click', () => {
            console.log('🏪 Fallback vendor marker clicked:', marker.title);
            console.log('📍 Location:', marker.location);
            console.log('🎯 Coordinates:', marker.position);
            
            if (onMarkerClick) {
              onMarkerClick(marker, markerElement);
            } else {
              // Show vendor info in alert if no click handler
              alert(`${marker.title || `Vendor ${index + 1}`}\n📍 ${marker.location || 'Location not specified'}`);
            }
          });
          
          mapContainer.appendChild(markerElement);
          console.log(`✅ Added marker ${index + 1}: ${marker.title || `Vendor ${index + 1}`} at ${leftPercent.toFixed(1)}%, ${topPercent.toFixed(1)}%`);
        });
        
        console.log(`🎉 Successfully added ${markers.length} vendor markers to fallback map`);
      } else {
        console.log('⚠️ No vendor markers to display on fallback map');
      }

      // setMapLoaded(true); // Removed unused variable
      setIsLoading(false);
      console.log('✅ Fallback map created successfully');
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, [center, zoom, apiKey, locationPermissionGranted, userLocation]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationPermissionGranted(false);
      return;
    }

    console.log('📍 Requesting user location...');
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        console.log('✅ User location obtained:', userPos);
        setUserLocation(userPos);
        setLocationPermissionGranted(true);
        setIsLoading(false);
        
        if (onLocationChange) {
          onLocationChange(userPos);
        }

        // Center map on user location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(userPos);
          mapInstanceRef.current.setZoom(15);
          console.log('🗺️ Map centered on user location');
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            console.log('❌ Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            console.log('❌ Location unavailable');
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            console.log('❌ Location request timeout');
            break;
          default:
            errorMessage = 'Unknown location error.';
            console.log('❌ Unknown location error');
            break;
        }
        setLocationError(errorMessage);
        setLocationPermissionGranted(true); // Still allow map to show even if location denied
        setIsLoading(false);
        console.log('⚠️ Location permission denied - map will show without user location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Center map on current location
  const centerOnCurrentLocation = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(userLocation);
      mapInstanceRef.current.setZoom(15);
      console.log('Centering on user location:', userLocation);
    } else {
      getCurrentLocation();
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg shadow-lg bg-gray-100 relative z-0"
        style={{ 
          minHeight: '500px',
          height: '500px',
          width: '100%',
          position: 'relative'
        }}
      />
      
      {/* Location Permission Request */}
      {!locationPermissionGranted && !userLocation && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Location Permission Required</h3>
            <p className="text-gray-600 mb-4">Please allow location access to view the map and find nearby vendors.</p>
            <button
              onClick={getCurrentLocation}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Allow Location Access
            </button>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">
              {apiKey ? 'Loading Google Maps...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Location Error */}
      {locationError && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">{locationError}</p>
        </div>
      )}

      {/* Current Location Button */}
      {showCurrentLocation && (
        <button
          onClick={centerOnCurrentLocation}
          className="absolute top-16 left-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-md transition-colors duration-200 z-30"
          title="Center on current location"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* User Location Status */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm z-10">
          ✓ Location detected
        </div>
      )}



      {/* Map Attribution */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 px-2 py-1 rounded text-xs text-gray-600 z-10">
        {apiKey ? '© Google Maps' : '© Map Data'}
      </div>

      {/* API Key Status */}
      {!apiKey && (
        <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm z-20">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Using free fallback - Add REACT_APP_GOOGLE_MAPS_API_KEY for full Google Maps</span>
          </div>
        </div>
      )}

    </div>

    {/* Map Legend - Outside Map */}
    <div className="mt-4 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        Map Legend
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Location */}
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
            <span className="text-xs text-white">📍</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-800">Your Location</span>
            <p className="text-xs text-gray-500">Where you are now</p>
          </div>
        </div>
        
        {/* Vendor Location */}
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
            <span className="text-xs text-white">🏪</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-800">Ice Cream Shops</span>
            <p className="text-xs text-gray-500">Click to view details</p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded bg-gray-100 border border-gray-300 flex items-center justify-center">
            <span className="text-xs text-gray-600">🔍</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-800">Zoom Controls</span>
            <p className="text-xs text-gray-500">+ and - buttons</p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default GoogleMapFree;
