import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import GoogleMapFree from '../shared/GoogleMapFree';
import axios from 'axios';

const LocationPickerModal = ({ 
  isOpen, 
  onClose, 
  addressId, 
  currentCoordinates = null,
  onLocationSaved 
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen && currentCoordinates) {
      setSelectedLocation({
        lat: parseFloat(currentCoordinates.latitude) || 14.5995,
        lng: parseFloat(currentCoordinates.longitude) || 120.9842
      });
    }
  }, [isOpen, currentCoordinates]);

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setError(null);
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      setError('Please select a location on the map');
      return;
    }

    if (!addressId) {
      setError('Address ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.put(
        `${apiBase}/api/addresses/${addressId}/exact-location`,
        {
          exact_latitude: selectedLocation.lat,
          exact_longitude: selectedLocation.lng,
          coordinate_accuracy: 'exact',
          coordinate_source: 'vendor_pin'
        },
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Exact location saved successfully!');
        setTimeout(() => {
          onLocationSaved && onLocationSaved(selectedLocation);
          onClose();
        }, 1500);
      } else {
        setError(response.data.error || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving exact location:', error);
      setError(error.response?.data?.error || 'Failed to save location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedLocation(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;


  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 999999, 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Set Exact Location</h2>
              <p className="text-blue-100 text-sm mt-1">
                Pin your exact store location on the map for accurate delivery tracking
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-blue-800 mb-1">How to set your exact location:</h3>
                <ul className="text-xs text-blue-700 space-y-0.5">
                  <li>• Click on the map to place a pin</li>
                  <li>• Drag the pin to adjust position</li>
                  <li>• Pin should be on your actual store building</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '300px' }}>
            <GoogleMapFree
              center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [14.5995, 120.9842]}
              zoom={selectedLocation ? 18 : 15}
              markers={selectedLocation ? [{
                id: 'selected-location',
                position: selectedLocation,
                title: 'Your Store Location',
                infoWindow: `
                  <div class="p-4">
                    <h3 class="font-bold text-lg mb-2">Your Store Location</h3>
                    <p class="text-sm text-gray-600">Lat: ${selectedLocation.lat.toFixed(6)}</p>
                    <p class="text-sm text-gray-600">Lng: ${selectedLocation.lng.toFixed(6)}</p>
                    <p class="text-xs text-blue-600 mt-2">✅ Exact GPS coordinates</p>
                  </div>
                `,
                icon: {
                  path: 'M12 0C7.6 0 4 3.6 4 8c0 5.4 8 13 8 13s8-7.6 8-13c0-4.4-3.6-8-8-8z',
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  strokeColor: '#065f46',
                  strokeWeight: 2,
                  scale: 1.5,
                  anchor: { x: 12, y: 24 }
                }
              }] : []}
              onLocationChange={handleLocationChange}
              showCurrentLocation={true}
              className="w-full h-full"
              interactive={true}
            />
          </div>

          {/* Location Info */}
          {selectedLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="font-semibold text-green-800">Location Selected</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Latitude:</span>
                  <span className="ml-2 text-green-600">{selectedLocation.lat.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Longitude:</span>
                  <span className="ml-2 text-green-600">{selectedLocation.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 font-medium">Error:</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-800 font-medium">Success:</span>
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLocation}
              disabled={loading || !selectedLocation}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Exact Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the modal using a portal to document.body with absolute positioning
  const portalContainer = document.getElementById('modal-root') || document.body;
  return createPortal(modalContent, portalContainer);
};

export default LocationPickerModal;
