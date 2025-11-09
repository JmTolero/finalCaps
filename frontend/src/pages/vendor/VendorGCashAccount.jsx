import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';

const VendorGCashAccount = () => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    qr_code_image: null,
    gcash_number: '',
    business_name: ''
  });

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        throw new Error('User not logged in');
      }

      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/vendor/qr-code`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setQrCode(response.data.qrCode);
        // Use business_name from QR code if available, otherwise use store_name from vendor
        const shopName = response.data.qrCode?.business_name || response.data.store_name || '';
        setFormData({
          qr_code_image: null, // Always start with null for new uploads
          gcash_number: response.data.qrCode?.gcash_number || '',
          business_name: shopName
        });
      }
    } catch (err) {
      console.error('Error fetching QR code:', err);
      // Even on 404, get store_name for auto-population
      if (err.response?.status === 404 && err.response?.data?.store_name) {
        setFormData({
          qr_code_image: null,
          gcash_number: '',
          business_name: err.response.data.store_name // Auto-populate with store_name
        });
      } else if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to fetch QR code');
      } else {
        // If 404 but no store_name, try to fetch from vendor endpoint
        try {
          const userRaw = sessionStorage.getItem('user');
          const user = userRaw ? JSON.parse(userRaw) : null;
          const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
          const vendorResponse = await axios.get(`${apiBase}/api/vendor/current`, {
            headers: {
              'x-user-id': user.id
            }
          });
          if (vendorResponse.data.success && vendorResponse.data.vendor?.store_name) {
            setFormData({
              qr_code_image: null,
              gcash_number: '',
              business_name: vendorResponse.data.vendor.store_name
            });
          }
        } catch (vendorErr) {
          console.error('Error fetching vendor info:', vendorErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        qr_code_image: file
      }));
    }
  };

  const validateGCashNumber = (number) => {
    // Remove any non-digit characters
    const cleanNumber = number.replace(/\D/g, '');
    
    // Check if it's a valid Philippine mobile number
    if (cleanNumber.length === 11 && cleanNumber.startsWith('09')) {
      return `+63${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('639')) {
      return `+${cleanNumber}`;
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('+639')) {
      return cleanNumber;
    }
    
    return null;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate GCash number
      const validatedNumber = validateGCashNumber(formData.gcash_number);
      if (!validatedNumber) {
        throw new Error('Please enter a valid GCash number (e.g., 09123456789)');
      }

      if (!formData.business_name.trim()) {
        throw new Error('Shop name is required. Please ensure your store name is set in vendor setup.');
      }

      if (!formData.qr_code_image || !(formData.qr_code_image instanceof File)) {
        throw new Error('Please upload your GCash QR code');
      }

      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const formDataToSend = new FormData();
      formDataToSend.append('qr_code_image', formData.qr_code_image);
      formDataToSend.append('gcash_number', validatedNumber);
      formDataToSend.append('business_name', formData.business_name.trim());

      const response = await axios.post(`${apiBase}/api/vendor/qr-code`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setQrCode(response.data.qrCode);
        setIsEditing(false);
        setSuccess('GCash QR code saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving QR code:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save QR code');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      qr_code_image: null,
      gcash_number: qrCode?.gcash_number || '',
      business_name: qrCode?.business_name || ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) {
      setShowImageModal(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-700">Loading QR code...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavWithLogo />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">GCash QR Code Setup</h1>
            <p className="text-sm sm:text-base text-gray-600">Upload your GCash QR code for direct customer payments</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* QR Code Management Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
              {/* QR Icon */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl">📱</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">GCash QR Code</h2>
              </div>

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm sm:text-base text-green-800 font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm sm:text-base text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* QR Code Information */}
              {qrCode ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* QR Code Display */}
                  <div className="text-center">
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <img 
                        src={qrCode.qr_code_image} 
                        alt="GCash QR Code" 
                        className="w-32 h-32 sm:w-48 sm:h-48 mx-auto border-2 border-gray-200 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setShowImageModal(true)}
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Your GCash QR Code</p>
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium underline"
                    >
                      View Full Image
                    </button>
                  </div>

                  {/* Account Details */}
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">GCash Number</label>
                        <p className="text-base sm:text-lg font-mono text-gray-900 break-all">{qrCode.gcash_number}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Shop Name</label>
                        <p className="text-base sm:text-lg text-gray-900 break-words">{qrCode.business_name}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Status</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {qrCode.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-600">Created</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {new Date(qrCode.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    {!isEditing ? (
                      <button
                        onClick={handleEdit}
                        className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        Update QR Code
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="w-full sm:flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">No GCash QR code found. Please upload your QR code to receive direct payments.</p>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setTimeout(() => {
                        const formElement = document.querySelector('.mt-6.sm\\:mt-8.pt-6.sm\\:pt-8.border-t.border-gray-200');
                        if (formElement) {
                          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Upload QR Code
                  </button>
                </div>
              )}

              {/* Edit Form */}
              {isEditing && (
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">QR Code Details</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Upload GCash QR Code</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload a clear image of your GCash QR code</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">GCash Number</label>
                      <input
                        type="tel"
                        name="gcash_number"
                        value={formData.gcash_number}
                        onChange={handleInputChange}
                        placeholder="09123456789"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter your GCash mobile number</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Shop Name</label>
                      <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        placeholder="Your shop/store name"
                        readOnly
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Shop name is automatically fetched from your store information</p>
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      {saving ? 'Saving...' : 'Save QR Code'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Information Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl">💡</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">How It Works</h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Benefits */}
                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-green-900 mb-2 text-sm sm:text-base">✅ Benefits of Direct QR Payments:</h4>
                  <ul className="text-xs sm:text-sm text-green-800 space-y-1">
                    <li>• You receive 100% of payment - no platform fees</li>
                    <li>• Customers pay directly to your GCash</li>
                    <li>• Faster payment processing</li>
                    <li>• Build direct relationship with customers</li>
                  </ul>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">📱 How to Get Your QR Code:</h4>
                  <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
                    <li>1. Open your GCash app</li>
                    <li>2. Go to "Profile" or "Me"</li>
                    <li>3. Tap "My QR Code"</li>
                    <li>4. Take a screenshot of your QR code</li>
                    <li>5. Upload it here</li>
                  </ol>
                </div>

                {/* Payment Flow */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">🔄 Payment Flow:</h4>
                  <ol className="text-xs sm:text-sm text-gray-700 space-y-1">
                    <li>1. Customer places order</li>
                    <li>2. System shows your QR code</li>
                    <li>3. Customer scans and pays</li>
                    <li>4. Money goes directly to your GCash</li>
                    <li>5. Order is confirmed</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && qrCode && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          onClick={handleModalClose}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-full overflow-y-auto my-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">GCash QR Code</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-3 sm:p-4">
              <div className="text-center">
                <img 
                  src={qrCode.qr_code_image} 
                  alt="GCash QR Code Full Size" 
                  className="w-full max-w-md sm:max-w-lg mx-auto border border-gray-200 rounded-lg"
                />
                <div className="mt-3 sm:mt-4 space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600 break-all">
                    <span className="font-medium">GCash Number:</span> {qrCode.gcash_number}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                    <span className="font-medium">Shop Name:</span> {qrCode.business_name}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end p-3 sm:p-4 border-t">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorGCashAccount;