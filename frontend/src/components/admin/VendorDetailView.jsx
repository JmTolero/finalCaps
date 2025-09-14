import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const VendorDetailView = ({ vendorId, onBack, onStatusUpdate }) => {
  const [vendor, setVendor] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState('');

  const fetchVendorDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/admin/vendors/${vendorId}`);
      if (response.data.success) {
        console.log('Vendor data received:', response.data.vendor);
        setVendor(response.data.vendor);
        
        // Fetch vendor's addresses if we have user_id
        if (response.data.vendor.user_id) {
          try {
            const addressResponse = await axios.get(`http://localhost:3001/api/user/${response.data.vendor.user_id}/addresses`);
            setAddresses(addressResponse.data || []);
          } catch (addressErr) {
            console.error('Error fetching vendor addresses:', addressErr);
            setAddresses([]);
          }
        }
      } else {
        setError('Failed to fetch vendor details');
      }
    } catch (err) {
      console.error('Error fetching vendor details:', err);
      setError('Failed to fetch vendor details');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
    }
  }, [vendorId, fetchVendorDetails]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/admin/vendors/${vendorId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setVendor(prev => ({ ...prev, status: newStatus }));
        onStatusUpdate(vendorId, newStatus);
        alert(`Vendor ${newStatus} successfully!`);
      } else {
        alert('Failed to update vendor status');
      }
    } catch (err) {
      console.error('Error updating vendor status:', err);
      alert('Failed to update vendor status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadDocument = async (documentUrl, documentType) => {
    try {
      const response = await axios.get(`http://localhost:3001/uploads/vendor-documents/${documentUrl}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get file extension from the document URL
      const extension = documentUrl.split('.').pop();
      link.setAttribute('download', `${documentType}_${vendor.store_name}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document');
    }
  };

  const viewImage = (documentUrl, title) => {
    console.log('viewImage called with:', { documentUrl, title });
    if (documentUrl) {
      const imageUrl = `http://localhost:3001/uploads/vendor-documents/${documentUrl}`;
      console.log('Setting image URL:', imageUrl);
      setSelectedImage(imageUrl);
      setSelectedImageTitle(title);
      setShowImageModal(true);
    } else {
      console.log('No document URL provided for:', title);
      alert('No image available for this document');
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setSelectedImageTitle('');
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">
        <div className="text-center py-8">
          <div className="text-lg text-gray-500">Loading vendor details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">
        <div className="text-center py-8">
          <div className="text-red-500">{error}</div>
          <button 
            onClick={fetchVendorDetails}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">
        <div className="text-center py-8">
          <div className="text-gray-500">Vendor not found</div>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">
      {/* Main Content - Single Box with Back Button and Two Sections */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header with back button inside the box */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold">Vendor Details</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Section - Vendor Information */}
          <div className="flex-1 md:w-1/2">
            {/* Profile Section */}
            <div className="flex items-start space-x-4 mb-8">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{vendor.fname || 'Vendor'}</h2>
                <p className="text-gray-700">{vendor.store_name || 'Frosty bites ice cream'}</p>
              </div>
            </div>

            {/* Vendor Details */}
            <div className="space-y-4">
              <div>
                <span className="text-gray-900 font-medium">Store Locations: </span>
                {addresses.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {addresses.map((address, index) => (
                      <div key={address.address_id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-blue-600">
                            {address.address_label || `Location ${index + 1}`}
                          </span>
                          <div className="flex space-x-1">
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                              {address.address_type}
                            </span>
                            {address.is_default === 1 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ⭐ Default
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">
                          {[
                            address.unit_number,
                            address.street_name,
                            address.barangay,
                            address.cityVillage,
                            address.province,
                            address.region
                          ].filter(Boolean).join(', ')}
                          {address.postal_code && ` ${address.postal_code}`}
                        </p>
                        {address.landmark && (
                          <p className="text-gray-500 text-xs mt-1">
                            Landmark: {address.landmark}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">
                    {vendor.location || 'No structured address available'}
                  </span>
                )}
              </div>
              
              <div>
                <span className="text-gray-900 font-medium">Email Address: </span>
                <span className="text-gray-700">{vendor.email || 'Lee@gmail.com'}</span>
              </div>
              
              <div>
                <span className="text-gray-900 font-medium">Contact No. : </span>
                <span className="text-gray-700">{vendor.contact_no || '09123123122'}</span>
              </div>
              
              <div>
                <span className="text-gray-900 font-medium">Date of Birth:</span>
                <span className="text-gray-700 ml-2">{vendor.birth_date ? formatDate(vendor.birth_date) : 'Not provided'}</span>
              </div>
              
              <div>
                <span className="text-gray-900 font-medium">Gender: </span>
                <span className="text-gray-700">{vendor.gender ? vendor.gender.charAt(0).toUpperCase() + vendor.gender.slice(1).replace('_', ' ') : 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Right Section - Document Verification */}
          <div className="flex-1 md:w-1/2 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Document Verification</h3>
            
            <div className="space-y-4">
              {/* Valid ID */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Uploaded Valid ID</p>
                    <div className="flex space-x-3 mt-1">
                      <button
                        onClick={() => viewImage(vendor.valid_id_url, 'Valid ID')}
                        className="text-sm text-green-600 hover:text-green-800 underline"
                      >
                        👁️ View Image
                      </button>
                      <button
                        onClick={() => downloadDocument(vendor.valid_id_url, 'valid_id')}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        📥 Download file
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Permit */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Uploaded Business Permit</p>
                    <div className="flex space-x-3 mt-1">
                      <button
                        onClick={() => viewImage(vendor.business_permit_url, 'Business Permit')}
                        className="text-sm text-green-600 hover:text-green-800 underline"
                      >
                        👁️ View Image
                      </button>
                      <button
                        onClick={() => downloadDocument(vendor.business_permit_url, 'business_permit')}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        📥 Download file
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ice Cream Making Proof */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Ice Cream Making Proof</p>
                    <div className="flex space-x-3 mt-1">
                      <button
                        onClick={() => {
                          console.log('Ice Cream Making Proof button clicked, proof_image_url:', vendor.proof_image_url);
                          viewImage(vendor.proof_image_url, 'Ice Cream Making Proof');
                        }}
                        className="text-sm text-green-600 hover:text-green-800 underline"
                      >
                        👁️ View Image
                      </button>
                      <button
                        onClick={() => downloadDocument(vendor.proof_image_url, 'ice_cream_proof')}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        📥 Download file
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 space-y-4">
                <div>
                  <span className="text-gray-900 font-medium">ID:</span>
                  <span className="text-gray-700 ml-2">{vendor.vendor_id || ''}</span>
                </div>
                
                <div>
                  <span className="text-gray-900 font-medium">Date submitted:</span>
                  <span className="text-gray-700 ml-2">{formatDate(vendor.created_at) || ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Outside the flex container, positioned at bottom right */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={() => handleStatusUpdate('rejected')}
            className="px-6 py-3 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => handleStatusUpdate('approved')}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors"
          >
            Approve
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImageTitle}</h3>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt={selectedImageTitle}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KICA8L3N2Zz4K';
                    e.target.alt = 'Image not found';
                  }}
                />
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end space-x-2 p-4 border-t">
              <button
                onClick={closeImageModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (selectedImageTitle === 'Valid ID') {
                    downloadDocument(vendor.valid_id_url, 'valid_id');
                  } else if (selectedImageTitle === 'Business Permit') {
                    downloadDocument(vendor.business_permit_url, 'business_permit');
                  } else if (selectedImageTitle === 'Ice Cream Making Proof') {
                    downloadDocument(vendor.proof_image_url, 'ice_cream_proof');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default VendorDetailView;
