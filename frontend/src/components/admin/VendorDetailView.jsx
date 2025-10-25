import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getImageUrl } from '../../utils/imageUtils';

const VendorDetailView = ({ vendorId, onBack, onStatusUpdate }) => {
  const [vendor, setVendor] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const fetchVendorDetails = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/vendors/${vendorId}`);
      if (response.data.success) {
        console.log('Vendor data received:', response.data.vendor);
        console.log('Document URLs:', {
          valid_id_url: response.data.vendor.valid_id_url,
          business_permit_url: response.data.vendor.business_permit_url,
          proof_image_url: response.data.vendor.proof_image_url
        });
        setVendor(response.data.vendor);
        
        // Fetch vendor's addresses if we have user_id
        if (response.data.vendor.user_id) {
          try {
            const addressResponse = await axios.get(`${apiBase}/api/user/${response.data.vendor.user_id}/addresses`);
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

  const showConfirmDialog = (status) => {
    setPendingAction(status);
    setShowConfirmModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(`${apiBase}/api/admin/vendors/${vendorId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setVendor(prev => ({ ...prev, status: newStatus }));
        onStatusUpdate(vendorId, newStatus);
        
        // Show success modal
        setShowConfirmModal(false);
        setPendingAction('success');
        
        // Navigate back to requested approval tab after a short delay
        setTimeout(() => {
          onBack();
        }, 2000);
        
      } else {
        // Show error modal
        setShowConfirmModal(false);
        setPendingAction('error');
        setTimeout(() => {
          setPendingAction(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating vendor status:', err);
      setShowConfirmModal(false);
      setPendingAction('error');
      setTimeout(() => {
        setPendingAction(null);
      }, 3000);
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
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const fileUrl = getImageUrl(documentUrl, apiBase);
      const response = await axios.get(fileUrl, {
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
      // Check if file is a PDF
      const isPdf = documentUrl.toLowerCase().endsWith('.pdf');
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Get the correct URL (handles both Cloudinary and legacy local files)
      const fileUrl = getImageUrl(documentUrl, apiBase);
      
      console.log('Original document URL:', documentUrl);
      console.log('API Base:', apiBase);
      console.log('Generated file URL:', fileUrl);
      console.log('Is PDF:', isPdf);
      
      if (isPdf) {
        // For PDFs, open in a new tab/window instead of modal
        console.log('Opening PDF:', fileUrl);
        window.open(fileUrl, '_blank');
      } else {
        // For images, use the modal as before
        console.log('Setting image URL for modal:', fileUrl);
        setSelectedImage(fileUrl);
        setSelectedImageTitle(title);
        setShowImageModal(true);
      }
    } else {
      console.log('No document URL provided for:', title);
      alert('No document available for this file');
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
    <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-6 lg:py-10 min-h-screen">
      {/* Main Content - Single Box with Back Button and Two Sections */}
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
        {/* Header with back button in separate row */}
        <div className="mb-3 sm:mb-4 lg:mb-6">
          <div className="mb-2 sm:mb-3">
            <button
              onClick={onBack}
              className="flex items-center bg-white text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm sm:text-base font-medium">Back</span>
            </button>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">Vendor Details</h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          
          {/* Left Section - Vendor Information */}
          <div className="flex-1 lg:w-1/2">
            {/* Profile Section */}
            <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6 lg:mb-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{vendor.fname || 'Vendor'}</h2>
                <p className="text-sm sm:text-base text-gray-700">
                  {vendor.store_name || (
                    <span className="text-gray-500 italic">Store name not set up yet</span>
                  )}
                </p>
              </div>
            </div>

            {/* Vendor Details */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <span className="text-sm sm:text-base text-gray-900 font-medium">Store Locations: </span>
                {addresses.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {addresses.map((address, index) => (
                      <div key={address.address_id} className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1 sm:gap-0">
                          <span className="text-xs sm:text-sm font-medium text-blue-600">
                            {address.address_label || `Location ${index + 1}`}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                              {address.address_type}
                            </span>
                            {address.is_default === 1 && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                ⭐ Default
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-xs sm:text-sm break-words">
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
                  <span className="text-sm sm:text-base text-gray-500">
                    {vendor.location || 'No structured address available'}
                  </span>
                )}
              </div>
              
              <div>
                <span className="text-sm sm:text-base text-gray-900 font-medium">Email Address: </span>
                <span className="text-sm sm:text-base text-gray-700 break-words">{vendor.email || 'Lee@gmail.com'}</span>
              </div>
              
              <div>
                <span className="text-sm sm:text-base text-gray-900 font-medium">Contact No. : </span>
                <span className="text-sm sm:text-base text-gray-700">{vendor.contact_no || '09123123122'}</span>
              </div>
              
              <div>
                <span className="text-sm sm:text-base text-gray-900 font-medium">Date of Birth:</span>
                <span className="text-sm sm:text-base text-gray-700 ml-2">{vendor.birth_date ? formatDate(vendor.birth_date) : 'Not provided'}</span>
              </div>
              
              <div>
                <span className="text-sm sm:text-base text-gray-900 font-medium">Gender: </span>
                <span className="text-sm sm:text-base text-gray-700">{vendor.gender ? vendor.gender.charAt(0).toUpperCase() + vendor.gender.slice(1).replace('_', ' ') : 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Right Section - Document Verification */}
          <div className="flex-1 lg:w-1/2 bg-blue-50 rounded-lg p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Document Verification</h3>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Valid ID */}
              <div className="bg-white rounded-lg p-3 sm:p-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900">Uploaded Valid ID</p>
                    <div className="flex flex-col sm:flex-row sm:space-x-3 mt-1 space-y-1 sm:space-y-0">
                      <button
                        onClick={() => viewImage(vendor.valid_id_url, 'Valid ID')}
                        className="text-xs sm:text-sm text-green-600 hover:text-green-800 underline text-left"
                      >
                        👁️ View Document
                      </button>
                      <button
                        onClick={() => downloadDocument(vendor.valid_id_url, 'valid_id')}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline text-left"
                      >
                        📥 Download file
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Permit */}
              <div className="bg-white rounded-lg p-3 sm:p-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900">Uploaded Business Permit</p>
                    <div className="flex flex-col sm:flex-row sm:space-x-3 mt-1 space-y-1 sm:space-y-0">
                      <button
                        onClick={() => viewImage(vendor.business_permit_url, 'Business Permit')}
                        className="text-xs sm:text-sm text-green-600 hover:text-green-800 underline text-left"
                      >
                        👁️ View Document
                      </button>
                      <button
                        onClick={() => downloadDocument(vendor.business_permit_url, 'business_permit')}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline text-left"
                      >
                        📥 Download file
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ice Cream Making Proof */}
              <div className="bg-white rounded-lg p-3 sm:p-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900">Ice Cream Making Proof</p>
                    <div className="flex flex-col sm:flex-row sm:space-x-3 mt-1 space-y-1 sm:space-y-0">
                      <button
                        onClick={() => {
                          console.log('Ice Cream Making Proof button clicked, proof_image_url:', vendor.proof_image_url);
                          viewImage(vendor.proof_image_url, 'Ice Cream Making Proof');
                        }}
                        className="text-xs sm:text-sm text-green-600 hover:text-green-800 underline text-left"
                      >
                        👁️ View Document
                      </button>
                      <button
                        onClick={() => downloadDocument(vendor.proof_image_url, 'ice_cream_proof')}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline text-left"
                      >
                        📥 Download file
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                <div>
                  <span className="text-sm sm:text-base text-gray-900 font-medium">ID:</span>
                  <span className="text-sm sm:text-base text-gray-700 ml-2">{vendor.vendor_id || ''}</span>
                </div>
                
                <div>
                  <span className="text-sm sm:text-base text-gray-900 font-medium">Date submitted:</span>
                  <span className="text-sm sm:text-base text-gray-700 ml-2">{formatDate(vendor.created_at) || ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Outside the flex container, positioned at bottom right */}
        <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={() => showConfirmDialog('approved')}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            Approve
          </button>
          <button
            onClick={() => showConfirmDialog('rejected')}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition-colors text-sm sm:text-base"
          >
            Reject
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{selectedImageTitle}</h3>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 p-2 sm:p-4 overflow-auto flex items-center justify-center">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt={selectedImageTitle}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onLoad={() => {
                    console.log('Image loaded successfully:', selectedImage);
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', selectedImage);
                    console.error('Error details:', e);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KICA8L3N2Zz4K';
                    e.target.alt = 'Image not found';
                  }}
                />
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 p-3 sm:p-4 border-t">
              <button
                onClick={closeImageModal}
                className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm sm:text-base"
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
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium text-sm sm:text-base"
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && pendingAction && pendingAction !== 'error' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
            <div className="flex items-start sm:items-center mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 ${
                pendingAction === 'approved' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {pendingAction === 'approved' ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {pendingAction === 'approved' ? 'Approve Vendor' : 'Reject Vendor'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 break-words">
                  {pendingAction === 'approved' 
                    ? `Are you sure you want to approve ${vendor?.store_name || 'this vendor'}?` 
                    : `Are you sure you want to reject ${vendor?.store_name || 'this vendor'}?`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                }}
                className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(pendingAction)}
                className={`px-3 sm:px-4 py-2 text-white font-medium rounded transition-colors text-sm sm:text-base ${
                  pendingAction === 'approved' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {pendingAction === 'approved' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {pendingAction === 'success' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Vendor {vendor?.status === 'approved' ? 'approved' : 'rejected'} successfully!
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
              <span className="text-xs sm:text-sm text-gray-500">Redirecting back to vendor list...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {pendingAction === 'error' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Error!</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Failed to update vendor status. Please try again.</p>
            <button
              onClick={() => setPendingAction(null)}
              className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default VendorDetailView;
