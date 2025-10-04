import React, { useEffect, useRef, useState, useCallback } from 'react';

const GoogleMap = ({ 
  center = { lat: 14.5995, lng: 120.9842 }, // Default to Manila
  zoom = 10,
  markers = [],
  onLocationChange,
  onMarkerClick,
  showCurrentLocation = true,
  className = "w-full h-96",
  mapType = "roadmap"
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const apiLoadedRef = useRef(false);
  const mapInitializedRef = useRef(false);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Google Maps API (only once)
  useEffect(() => {
    if (apiLoadedRef.current) return;
    
    if (!window.google || !window.google.maps) {
      console.log('Loading Google Maps API...');
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('Google Maps API key not provided. Using fallback static map.');
        apiLoadedRef.current = true;
        setIsLoading(false);
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API loaded');
        apiLoadedRef.current = true;
        setIsLoading(false);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        apiLoadedRef.current = true;
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      console.log('Google Maps API already loaded');
      apiLoadedRef.current = true;
      setIsLoading(false);
    }
  }, []); // Empty dependency array - only run once

  // Initialize map when API is ready
  useEffect(() => {
    if (!apiLoadedRef.current || isLoading || mapInitializedRef.current || !mapRef.current) {
      return;
    }

    console.log('Initializing Google Map...');
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      mapTypeId: mapType,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(mapInstance);
    mapInitializedRef.current = true;

    // Add markers
    markers.forEach((marker, index) => {
      const mapMarker = new window.google.maps.Marker({
        position: marker.position,
        map: mapInstance,
        title: marker.title || `Marker ${index + 1}`,
        icon: marker.icon || null
      });

      if (marker.infoWindow) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: marker.infoWindow
        });

        mapMarker.addListener('click', () => {
          infoWindow.open(mapInstance, mapMarker);
          if (onMarkerClick) {
            onMarkerClick(marker, mapMarker);
          }
        });
      }
    });

    // Get user's current location if enabled
    if (showCurrentLocation) {
      getCurrentLocation(mapInstance);
    }
  }, [isLoading]); // Only depend on isLoading

  // Update map when markers change (but don't reinitialize)
  useEffect(() => {
    if (!map || !mapInitializedRef.current) return;

    // Clear existing markers
    if (map.markers) {
      map.markers.forEach(marker => marker.setMap(null));
    }

    // Add new markers
    const newMarkers = [];
    markers.forEach((marker, index) => {
      const mapMarker = new window.google.maps.Marker({
        position: marker.position,
        map: map,
        title: marker.title || `Marker ${index + 1}`,
        icon: marker.icon || null
      });

      newMarkers.push(mapMarker);

      if (marker.infoWindow) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: marker.infoWindow
        });

        mapMarker.addListener('click', () => {
          infoWindow.open(map, mapMarker);
          if (onMarkerClick) {
            onMarkerClick(marker, mapMarker);
          }
        });
      }
    });

    // Store markers reference
    map.markers = newMarkers;
  }, [markers, map, onMarkerClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map && map.markers) {
        // Remove all markers
        map.markers.forEach(marker => {
          if (marker.setMap) {
            marker.setMap(null);
          }
        });
      }
    };
  }, [map]);

  // Get user's current location
  const getCurrentLocation = (mapInstance) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(userPos);
        
        // Add user location marker
        const userMarker = new window.google.maps.Marker({
          position: userPos,
          map: mapInstance,
          title: 'Your Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 12)
          }
        });

        // Center map on user location
        mapInstance.setCenter(userPos);
        mapInstance.setZoom(Math.max(zoom, 12));

        if (onLocationChange) {
          onLocationChange(userPos);
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
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
    if (userLocation && map) {
      map.setCenter(userLocation);
      map.setZoom(Math.max(zoom, 12));
    } else if (map) {
      getCurrentLocation(map);
    }
  };

  // Check if we have a valid API key
  const hasValidApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY && 
                        process.env.REACT_APP_GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE';

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      {hasValidApiKey ? (
        <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />
      ) : (
        /* Fallback Static Map */
        <div className="w-full h-full rounded-lg shadow-lg bg-gray-100 flex items-center justify-center relative">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map</h3>
            <p className="text-gray-500 mb-4">Vendor locations will be displayed here</p>
            
            {/* Show vendor markers as static elements */}
            <div className="space-y-2">
              {markers.map((marker, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded shadow-sm">
                  <div className={`w-3 h-3 rounded-full ${marker.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-700">{marker.title}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Add your Google Maps API key to enable interactive map features.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && hasValidApiKey && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
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
      {showCurrentLocation && hasValidApiKey && (
        <button
          onClick={centerOnCurrentLocation}
          className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-md transition-colors duration-200"
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
        <div className="absolute bottom-4 left-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
          ✓ Location detected
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
