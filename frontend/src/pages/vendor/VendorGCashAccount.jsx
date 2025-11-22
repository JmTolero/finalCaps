import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';

const VendorGCashAccount = () => {
  const [gcashInfo, setGcashInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [gcashNumberError, setGcashNumberError] = useState(null);
  const statusMessageRef = useRef(null);
  
  // Form data
  const [formData, setFormData] = useState({
    gcash_number: '',
    business_name: ''
  });

  useEffect(() => {
    fetchGCashInfo();
  }, []);

  // Auto-scroll to status message when it appears
  useEffect(() => {
    if ((error || success) && statusMessageRef.current) {
      // Small delay to ensure the message is rendered
      setTimeout(() => {
        const headerOffset = 100; // Offset for header
        const elementPosition = statusMessageRef.current.offsetTop;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [error, success]);

  const fetchGCashInfo = async () => {
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
        setGcashInfo(response.data.qrCode);
        // Use business_name from GCash info if available, otherwise use store_name from vendor
        const shopName = response.data.qrCode?.business_name || response.data.store_name || '';
        setFormData({
          gcash_number: response.data.qrCode?.gcash_number || '',
          business_name: shopName
        });
      }
    } catch (err) {
      console.error('Error fetching GCash info:', err);
      // Even on 404, get store_name for auto-population
      if (err.response?.status === 404 && err.response?.data?.store_name) {
        setFormData({
          gcash_number: '',
          business_name: err.response.data.store_name // Auto-populate with store_name
        });
      } else if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to fetch GCash information');
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
    
    // For GCash number, only allow digits
    if (name === 'gcash_number') {
      // Remove any non-digit characters
      const numbersOnly = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
      
      // Real-time validation
      validateGCashNumberInput(numbersOnly);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateGCashNumberInput = (number) => {
    if (!number || number.trim() === '') {
      setGcashNumberError(null);
      return;
    }

    const cleanNumber = number.replace(/\D/g, '');
    
    if (cleanNumber.length === 0) {
      setGcashNumberError('GCash number is required');
      return;
    }

    if (cleanNumber.length < 11) {
      setGcashNumberError('GCash number must be 11 digits (e.g., 09123456789)');
      return;
    }

    if (cleanNumber.length > 11) {
      setGcashNumberError('GCash number must be exactly 11 digits');
      return;
    }

    if (!cleanNumber.startsWith('09')) {
      setGcashNumberError('GCash number must start with 09 (e.g., 09123456789)');
      return;
    }

    // Valid number
    setGcashNumberError(null);
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

      // Validate GCash number input first
      const cleanNumber = formData.gcash_number.replace(/\D/g, '');
      
      if (!cleanNumber || cleanNumber.length === 0) {
        setGcashNumberError('GCash number is required');
        throw new Error('GCash number is required');
      }

      if (cleanNumber.length < 11) {
        setGcashNumberError('GCash number must be 11 digits (e.g., 09123456789)');
        throw new Error('GCash number must be 11 digits (e.g., 09123456789)');
      }

      if (cleanNumber.length > 11) {
        setGcashNumberError('GCash number must be exactly 11 digits');
        throw new Error('GCash number must be exactly 11 digits');
      }

      if (!cleanNumber.startsWith('09')) {
        setGcashNumberError('GCash number must start with 09 (e.g., 09123456789)');
        throw new Error('GCash number must start with 09 (e.g., 09123456789)');
      }

      // Clear any previous errors
      setGcashNumberError(null);

      // Validate GCash number format
      const validatedNumber = validateGCashNumber(formData.gcash_number);
      if (!validatedNumber) {
        setGcashNumberError('Please enter a valid GCash number (e.g., 09123456789)');
        throw new Error('Please enter a valid GCash number (e.g., 09123456789)');
      }

      if (!formData.business_name.trim()) {
        throw new Error('Shop name is required. Please ensure your store name is set in vendor setup.');
      }

      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.post(
        `${apiBase}/api/vendor/qr-code`,
        {
          gcash_number: validatedNumber,
          business_name: formData.business_name.trim()
        },
        {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setGcashInfo(response.data.qrCode);
        setIsEditing(false);
        setSuccess('GCash number saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving QR code:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save GCash number');
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
      gcash_number: gcashInfo?.gcash_number || '',
      business_name: gcashInfo?.business_name || ''
    });
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-700">Loading GCash information...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">GCash Number Setup</h1>
            <p className="text-sm sm:text-base text-gray-600">Enter your GCash mobile number for integrated payments</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* QR Code Management Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
              {/* GCash Icon */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl">📱</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">GCash Number</h2>
              </div>

              {/* Success Message */}
              {success && (
                <div 
                  ref={statusMessageRef}
                  className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6"
                >
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
                <div 
                  ref={statusMessageRef}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm sm:text-base text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* GCash Information */}
              {gcashInfo ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Account Details */}
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">GCash Number</label>
                        <p className="text-base sm:text-lg font-mono text-gray-900 break-all">{gcashInfo.gcash_number}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Shop Name</label>
                        <p className="text-base sm:text-lg text-gray-900 break-words">{gcashInfo.business_name}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Status</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {gcashInfo.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-600">Created</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {gcashInfo.created_at ? (() => {
                              const date = new Date(gcashInfo.created_at);
                              return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                            })() : 'N/A'}
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
                        Update GCash Number
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
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">No GCash number found. Please enter your GCash number to enable integrated payments.</p>
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
                    Add GCash Number
                  </button>
                </div>
              )}

              {/* Edit Form */}
              {isEditing && (
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">GCash Number Details</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        GCash Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="gcash_number"
                        value={formData.gcash_number}
                        onChange={handleInputChange}
                        onKeyPress={(e) => {
                          // Only allow numbers (0-9)
                          if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                            e.preventDefault();
                          }
                        }}
                        placeholder="09123456789"
                        maxLength={11}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                          gcashNumberError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        required
                      />
                      {gcashNumberError ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {gcashNumberError}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Enter your GCash mobile number (numbers only, e.g., 09123456789)</p>
                      )}
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
                      {saving ? 'Saving...' : 'Save GCash Number'}
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
                  <h4 className="font-medium text-green-900 mb-2 text-sm sm:text-base">✅ Benefits of Integrated GCash Payments:</h4>
                  <ul className="text-xs sm:text-sm text-green-800 space-y-1">
                    <li>• Automatic payment processing via Xendit</li>
                    <li>• Instant order confirmation</li>
                    <li>• Secure and reliable payment gateway</li>
                    <li>• No manual payment verification needed</li>
                    <li>• Customers pay through integrated GCash</li>
                  </ul>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">📱 How It Works:</h4>
                  <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
                    <li>1. Enter your GCash mobile number</li>
                    <li>2. Customers choose GCash payment at checkout</li>
                    <li>3. Payment is processed automatically</li>
                    <li>4. Order is confirmed instantly</li>
                    <li>5. Funds are transferred securely</li>
                  </ol>
                </div>

                {/* Payment Flow */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">💡 Important Notes:</h4>
                  <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
                    <li>• Use the same number registered with your GCash account</li>
                    <li>• Ensure your GCash account is verified</li>
                    <li>• This number is used for payment processing</li>
                    <li>• You can update it anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default VendorGCashAccount;