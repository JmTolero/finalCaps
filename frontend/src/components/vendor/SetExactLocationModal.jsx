import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SetExactLocationModal = ({ isOpen, onClose, vendorId, onLocationSet }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);

  useEffect(() => {
    if (isOpen && vendorId) {
      fetchLocationInfo();
    }
  }, [isOpen, vendorId]);

  const fetchLocationInfo = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/vendor/${vendorId}/location-info`);
      if (response.data.success) {
        setLocationInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching location info:', err);
    }
  };

  const getCurrentPosition = () => {
    setGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setCurrentLocation(location);
        setGettingLocation(false);
        console.log('📍 Got current location:', location);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
        }
        setError(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const saveExactLocation = async () => {
    if (!currentLocation) {
      setError('Please get your current location first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(
        `${apiBase}/api/vendor/${vendorId}/exact-location`,
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onLocationSet) {
            onLocationSet(response.data.data);
          }
          onClose();
          setSuccess(false);
          setCurrentLocation(null);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            📍 Set Your Exact Shop Location
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Current Location Status */}
        {locationInfo && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-1">Current Status:</p>
            {locationInfo.display_location.has_exact ? (
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-600">
                  Exact location set on {new Date(locationInfo.exact_location.set_at).toLocaleDateString()}
                </span>
              </div>
            ) : locationInfo.display_location.has_approximate ? (
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚠</span>
                <span className="text-sm text-gray-600">
                  Using approximate location (city-level)
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-red-600">✗</span>
                <span className="text-sm text-gray-600">No location set</span>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>📱 For best results:</strong>
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Open this page on your phone at your shop location</li>
            <li>Enable location services in your device settings</li>
            <li>Allow browser to access your location</li>
            <li>Wait for accurate GPS signal (may take a few seconds)</li>
          </ul>
        </div>

        {/* Get Location Button */}
        {!currentLocation && (
          <button
            onClick={getCurrentPosition}
            disabled={gettingLocation}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white mb-4 ${
              gettingLocation
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
          >
            {gettingLocation ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Getting Your Location...
              </span>
            ) : (
              '📍 Get My Current Location'
            )}
          </button>
        )}

        {/* Location Details */}
        {currentLocation && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              ✓ Location Retrieved:
            </p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}
              </p>
              <p>
                <strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}
              </p>
              <p>
                <strong>Accuracy:</strong> ±{Math.round(currentLocation.accuracy)}m
              </p>
            </div>
            <button
              onClick={getCurrentPosition}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              🔄 Get location again
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600 font-semibold">
              ✓ Exact location saved successfully!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveExactLocation}
            disabled={!currentLocation || loading}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition-colors ${
              !currentLocation || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              '💾 Save Exact Location'
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Why set exact location?</strong>
            <br />
            This helps customers find your shop precisely on the map, improving
            delivery accuracy and customer experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetExactLocationModal;

