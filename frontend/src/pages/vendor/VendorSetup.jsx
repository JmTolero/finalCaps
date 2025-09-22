    import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AddressForm from '../../components/shared/AddressForm';
import logoImage from '../../assets/images/LOGO.png';
import axios from 'axios';

export const VendorSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  
  // Shop setup form data
  const [shopForm, setShopForm] = useState({
    store_name: '',
    contact_no: '',
    email: '',
    username: '',
    password: ''
  });

  // Address form data
  const [addressData, setAddressData] = useState({
    unit_number: '',
    street_name: '',
    barangay: '',
    cityVillage: '',
    province: '',
    region: '',
    postal_code: '',
    landmark: '',
    address_type: 'business'
  });

  // File uploads
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [status, setStatus] = useState({ type: null, message: '' });

  // Profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Get vendor data from URL parameters or session storage
  useEffect(() => {
    const vendorId = searchParams.get('vendor_id');
    const storedVendor = sessionStorage.getItem('pendingVendor');
    
    if (vendorId) {
      // Get vendor_id from URL parameters (from login redirect)
      fetchVendorData(vendorId);
    } else if (storedVendor) {
      // Fallback to session storage (from registration)
      const vendor = JSON.parse(storedVendor);
      setVendorData(vendor);
      fetchVendorData(vendor.vendor_id);
    } else {
      // No vendor_id found, redirect to login
      navigate('/login');
    }
  }, [searchParams, navigate]);

  // Handle clicks outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('pendingVendor');
    sessionStorage.removeItem('user');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('userChanged'));
    navigate('/login');
  };


  const fetchVendorData = async (vendorId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/vendor/setup/${vendorId}`);
      
      if (response.data.success) {
        const vendor = response.data.vendor;
        setVendorData(vendor); // Set the vendor data state
        setShopForm(prev => ({
          ...prev,
          store_name: '', // Always start with empty store name
          email: vendor.email || '',
          contact_no: vendor.contact_no || '',
          username: vendor.username || '',
          password: '' // Don't populate password for security
        }));
        
        // Fetch existing address data if vendor has primary_address_id
        if (vendor.primary_address_id) {
          await fetchVendorAddress(vendorId);
        }
        
        console.log('Vendor data loaded:', vendor);
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      // Use stored data as fallback
      const storedVendor = JSON.parse(sessionStorage.getItem('pendingVendor'));
      if (storedVendor) {
        setVendorData(storedVendor); // Set the vendor data state
        setShopForm(prev => ({
          ...prev,
          store_name: '', // Always start with empty store name
          email: storedVendor.email || '',
          contact_no: storedVendor.contact_no || ''
        }));
      }
    }
  };

  const fetchVendorAddress = async (vendorId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      // Use the user_id from vendorData instead of vendorId
      const userId = vendorData?.user_id;
      if (!userId) {
        console.log('No user ID available for fetching address');
        return;
      }
      
      const response = await axios.get(`${apiBase}/api/addresses/user/${userId}/addresses`);
      
      if (response.data && response.data.length > 0) {
        // Get the first address (primary address)
        const address = response.data[0];
        setAddressData({
          unit_number: address.unit_number || '',
          street_name: address.street_name || '',
          barangay: address.barangay || '',
          cityVillage: address.cityVillage || '',
          province: address.province || '',
          region: address.region || '',
          postal_code: address.postal_code || '',
          landmark: address.landmark || '',
          address_type: 'business'
        });
        console.log('Address data loaded:', address);
      }
    } catch (error) {
      console.error('Error fetching vendor address:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShopForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddressChange = (newAddressData) => {
    setAddressData(newAddressData);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate shop information
      const missingFields = [];
      if (!shopForm.store_name) missingFields.push('Shop Name');
      if (!shopForm.contact_no) missingFields.push('Contact Number');
      if (!shopForm.email) missingFields.push('Email Address');
      
      if (missingFields.length > 0) {
        setStatus({ 
          type: 'error', 
          message: `Please fill in the following required fields: ${missingFields.join(', ')}` 
        });
        return;
      }
    } else if (currentStep === 2) {
      // Validate address information - make more fields required
      const missingAddressFields = [];
      if (!addressData.street_name) missingAddressFields.push('Street Name');
      if (!addressData.barangay) missingAddressFields.push('Barangay');
      if (!addressData.cityVillage) missingAddressFields.push('City/Village');
      if (!addressData.province) missingAddressFields.push('Province');
      if (!addressData.region) missingAddressFields.push('Region');
      
      if (missingAddressFields.length > 0) {
        setStatus({ 
          type: 'error', 
          message: `Please fill in the following required address fields: ${missingAddressFields.join(', ')}` 
        });
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
    setStatus({ type: null, message: '' });
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    setStatus({ type: null, message: '' });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('Starting vendor setup submission...');
      console.log('Shop form data:', shopForm);
      console.log('Address data:', addressData);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";

      // Check if vendorData is available
      if (!vendorData || !vendorData.vendor_id) {
        setStatus({ 
          type: 'error', 
          message: 'Vendor data not found. Please try logging in again.' 
        });
        return;
      }

      // Update vendor profile
      const formData = new FormData();
      Object.keys(shopForm).forEach(key => {
        if (shopForm[key]) {
          formData.append(key, shopForm[key]);
        }
      });

      if (profileImage) {
        formData.append('profile_image', profileImage);
      }

      // Update vendor information
      await axios.put(
        `${apiBase}/api/vendor/profile/${vendorData.vendor_id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Add address (now required)
      if (addressData.street_name && addressData.barangay && addressData.cityVillage && addressData.province) {
        console.log('Adding address:', addressData);
        await axios.post(
          `${apiBase}/api/addresses/user/${vendorData.user_id}/address`,
          {
            ...addressData,
            address_label: 'Store Location'
          }
        );
      } else {
        throw new Error('Address is required. Please fill in all address fields.');
      }

      setStatus({ type: 'success', message: 'Store setup completed successfully! You can now add products to start selling.' });
      
      // Clear pending vendor data
      sessionStorage.removeItem('pendingVendor');
      
      // Navigate to vendor dashboard with products tab after a short delay
      setTimeout(() => {
        navigate('/vendor?tab=products');
      }, 2000);

    } catch (error) {
      console.error('Store setup error:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to setup store. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Custom Navbar with Profile Dropdown */}
      <header className="w-full bg-sky-100 flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-3">
          <Link to="/">
            <img
              src={logoImage}
              alt="ChillNet Logo"
              className="ChillNet-Logo h-10 rounded-full object-cover"
            />
          </Link>
        </div>
        
        {/* Profile Dropdown in Navbar */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="p-2 rounded-full hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {profileImagePreview ? (
                <img 
                  src={profileImagePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                {/* User Info */}
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <div className="font-medium">{vendorData?.fname || 'Vendor'}</div>
                  <div className="text-gray-500">{shopForm.email}</div>
                </div>
                
                {/* Setup Info */}
                <div className="px-4 py-2 text-sm text-gray-500 border-b">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Complete setup to access settings
                  </div>
                  <div className="text-xs text-gray-400 mt-1 ml-7">
                    Fill in your store details below
                  </div>
                </div>
                
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
        {/* Main Content */}
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-blue-900">SET UP YOUR SHOP</h1>
                  <p className="text-blue-600 mt-1">Complete your store setup to proceed with approval</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">ID: {vendorData?.vendor_id || 'N/A'}</p>
                  <p className="text-sm font-medium">
                    Approve Status: 
                    <span className="ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Pending
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Messages */}
              {status.type && (
                <div className={`p-4 rounded-lg mb-6 ${
                  status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                  'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {status.message}
                </div>
              )}

              {/* Setup Form */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Step 1: Shop Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Shop Information</h2>
                    
                    {/* Shop Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name of the shop/vendor <span className="text-red-500">*</span>
                        {!shopForm.store_name && <span className="text-red-500 text-xs ml-2">(Required)</span>}
                      </label>
                      <input
                        type="text"
                        name="store_name"
                        value={shopForm.store_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          !shopForm.store_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter your shop name"
                        required
                      />
                    </div>

                    {/* Profile Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload shop/vendor profile
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {profileImagePreview ? (
                            <img 
                              src={profileImagePreview} 
                              alt="Profile preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400">📷</span>
                          )}
                        </div>
                        <label className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                          Choose a file
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                          {!shopForm.email && <span className="text-red-500 text-xs ml-2">(Required)</span>}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={shopForm.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            !shopForm.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact No. <span className="text-red-500">*</span>
                          {!shopForm.contact_no && <span className="text-red-500 text-xs ml-2">(Required)</span>}
                        </label>
                        <input
                          type="text"
                          name="contact_no"
                          value={shopForm.contact_no}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            !shopForm.contact_no ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="09123456789"
                          required
                        />
                      </div>
                    </div>

                    {/* Login Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={shopForm.username}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter username"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Address Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Shop Address</h2>
                    <p className="text-gray-600 mb-4">
                      Add your shop address to help customers find you. All fields marked with <span className="text-red-500 font-semibold">*</span> are required.
                    </p>
                    
                    <AddressForm
                      addressData={addressData}
                      onAddressChange={handleAddressChange}
                      showAddressType={true}
                      addressType="business"
                      required={true}
                      labelPrefix="Shop "
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <div>
                    {currentStep > 1 && (
                      <button
                        onClick={handlePrevStep}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                  </div>
                  
                  <div>
                    {currentStep < 2 ? (
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Setting up...' : 'Complete Setup'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    {[1, 2].map((step) => (
                      <div
                        key={step}
                        className={`w-3 h-3 rounded-full ${
                          step <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default VendorSetup;
