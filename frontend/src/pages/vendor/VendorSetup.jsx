import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const statusMessageRef = useRef(null);

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
  sessionStorage.removeItem('token');
  localStorage.removeItem('pendingVendor');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('userChanged'));
    navigate('/login');
  };


  const fetchVendorAddress = useCallback(async (userId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      if (!userId) {
        console.log('No user ID available for fetching address');
        return;
      }
      
      const response = await axios.get(`${apiBase}/api/addresses/user/${userId}/addresses`);
      
      if (response.data && response.data.length > 0) {
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
  }, []);

  const fetchVendorData = useCallback(async (vendorId) => {
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
          await fetchVendorAddress(vendor.user_id);
        }
        
        console.log('Vendor data loaded:', vendor);
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      // Use stored data as fallback
  const storedVendor = JSON.parse(sessionStorage.getItem('pendingVendor') || localStorage.getItem('pendingVendor'));
      if (storedVendor) {
        setVendorData(storedVendor); // Set the vendor data state
        setShopForm(prev => ({
          ...prev,
          store_name: '', // Always start with empty store name
          email: storedVendor.email || '',
          contact_no: storedVendor.contact_no || ''
        }));
        if (storedVendor.user_id) {
          await fetchVendorAddress(storedVendor.user_id);
        }
      }
    }
  }, [fetchVendorAddress]);

  // Get vendor data from URL parameters or session storage
  useEffect(() => {
    const vendorId = searchParams.get('vendor_id');
  const storedVendor = sessionStorage.getItem('pendingVendor') || localStorage.getItem('pendingVendor');
    
    if (vendorId) {
      fetchVendorData(vendorId);
    } else if (storedVendor) {
      const vendor = JSON.parse(storedVendor);
      setVendorData(vendor);
      fetchVendorData(vendor.vendor_id);
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, fetchVendorData]);

  // Auto-scroll to status message when it appears
  useEffect(() => {
    if (status.type && statusMessageRef.current) {
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
  }, [status.type, status.message]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Prevent spaces in contact_no and email fields
    const filteredValue = (name === 'contact_no' || name === 'email') 
      ? value.replace(/\s/g, '') 
      : value;
    setShopForm(prev => ({
      ...prev,
      [name]: filteredValue
    }));
  };

  const handleKeyDown = (e) => {
    // Prevent space key in contact_no and email fields
    if (e.target.name === 'contact_no' || e.target.name === 'email') {
      if (e.key === ' ') {
        e.preventDefault();
      }
    }
  };

  const handleBlur = (e) => {
    // Trim whitespace from shop name field on blur
    if (e.target.name === 'store_name') {
      const trimmedValue = e.target.value.trim();
      if (trimmedValue !== e.target.value) {
        setShopForm(prev => ({
          ...prev,
          [e.target.name]: trimmedValue
        }));
      }
    }
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
      const trimmedShopName = shopForm.store_name?.trim();
      if (!trimmedShopName || trimmedShopName.length === 0) {
        missingFields.push('Shop Name');
      } else if (trimmedShopName.length < 4) {
        setStatus({ 
          type: 'error', 
          message: 'Shop Name must be at least 4 characters long.' 
        });
        return;
      }
      if (!shopForm.contact_no?.trim()) missingFields.push('Contact Number');
      if (!shopForm.email?.trim()) missingFields.push('Email Address');
      
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
        setLoading(false);
        return;
      }

      // Validate that all required address fields are filled before allowing completion
      const missingAddressFields = [];
      if (!addressData.street_name) missingAddressFields.push('Street Name');
      if (!addressData.barangay) missingAddressFields.push('Barangay');
      if (!addressData.cityVillage) missingAddressFields.push('City/Village');
      if (!addressData.province) missingAddressFields.push('Province');
      if (!addressData.region) missingAddressFields.push('Region');
      
      if (missingAddressFields.length > 0) {
        setStatus({ 
          type: 'error', 
          message: `Please fill in the following required address fields first: ${missingAddressFields.join(', ')}` 
        });
        setLoading(false);
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

      // Add address (now required - validation already done above)
      console.log('Adding address:', addressData);
      await axios.post(
        `${apiBase}/api/addresses/user/${vendorData.user_id}/address`,
        {
          ...addressData,
          address_label: 'Store Location'
        }
      );

      setStatus({ type: 'success', message: 'Store setup completed successfully! You can now add products to start selling.' });
      
      // Clear pending vendor data
      sessionStorage.removeItem('pendingVendor');
      localStorage.removeItem('pendingVendor');
      
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
      <header className="w-full bg-sky-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link to="/">
            <img
              src={logoImage}
              alt="ChillNet Logo"
              className="ChillNet-Logo h-8 sm:h-10 rounded-full object-cover"
            />
          </Link>
        </div>
        
        {/* Profile Dropdown in Navbar */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="p-1.5 sm:p-2 rounded-full hover:bg-blue-100 transition-colors touch-manipulation"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {profileImagePreview ? (
                <img 
                  src={profileImagePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
              <div className="py-1">
                {/* User Info */}
                <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 border-b min-w-0 max-w-full">
                  <div className="font-medium truncate max-w-full">{vendorData?.fname || 'Vendor'}</div>
                  <div className="text-gray-500 truncate overflow-hidden break-all max-w-full" title={shopForm.email}>{shopForm.email}</div>
                </div>
                
                {/* Setup Info */}
                <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 border-b">
                  <div className="flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm">Complete setup to access settings</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 ml-5 sm:ml-7">
                    Fill in your store details below
                  </div>
                </div>
                
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-700 hover:bg-red-50 transition-colors touch-manipulation"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-900 leading-tight tracking-tight drop-shadow-sm">
                    SET UP YOUR SHOP
                  </h1>
                  <p className="text-blue-700 mt-2 text-base sm:text-lg font-medium">Complete your store setup to proceed with approval</p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-sm sm:text-base text-blue-800 font-semibold">ID: {vendorData?.vendor_id || 'N/A'}</p>
                  <p className="text-sm sm:text-base font-bold">
                    Approve Status: 
                    <span className="ml-2 px-3 py-1.5 bg-yellow-200 text-yellow-900 rounded-full text-sm font-bold shadow-sm">
                      Pending
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Messages */}
              {status.type && (
                <div 
                  ref={statusMessageRef}
                  className={`p-4 sm:p-5 rounded-xl mb-4 sm:mb-6 text-base sm:text-lg font-semibold shadow-lg border-2 ${
                    status.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 
                    'bg-red-100 text-red-800 border-red-300'
                  }`}>
                  <div className="flex items-center">
                    {status.type === 'success' ? (
                      <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {status.message}
                  </div>
                </div>
              )}

              {/* Setup Form */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                {/* Step 1: Shop Information */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 border-b-2 border-blue-200 pb-2">
                     Shop Information
                    </h2>
                    
                    {/* Shop Name */}
                    <div>
                      <label className="block text-base sm:text-lg font-bold text-gray-800 mb-3">
                        Name of the shop/vendor <span className="text-red-600 text-lg">*</span>
                        {!shopForm.store_name?.trim() && <span className="text-red-600 text-sm ml-2 font-semibold">(Required)</span>}
                        {shopForm.store_name?.trim() && shopForm.store_name.trim().length > 0 && shopForm.store_name.trim().length < 4 && (
                          <span className="text-red-600 text-sm ml-2 font-semibold">(At least 4 characters)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="store_name"
                        value={shopForm.store_name}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 sm:px-5 py-4 sm:py-5 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-base sm:text-lg font-medium shadow-sm transition-all duration-200 ${
                          !shopForm.store_name?.trim() || (shopForm.store_name?.trim() && shopForm.store_name.trim().length < 4) 
                            ? 'border-red-400 bg-red-50' 
                            : 'border-gray-400 hover:border-gray-500'
                        }`}
                        placeholder="Enter your shop name (min. 4 characters)"
                        required
                      />
                    </div>

                    {/* Profile Image Upload */}
                    <div>
                      <label className="block text-base sm:text-lg font-bold text-gray-800 mb-3">
                         Upload shop/vendor profile
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {profileImagePreview ? (
                            <img 
                              src={profileImagePreview} 
                              alt="Profile preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-lg sm:text-xl">📷</span>
                          )}
                        </div>
                        <label className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 cursor-pointer transition-all duration-200 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl touch-manipulation inline-block">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base sm:text-lg font-bold text-gray-800 mb-3">
                           Email Address <span className="text-red-600 text-lg">*</span>
                          {!shopForm.email && <span className="text-red-600 text-sm ml-2 font-semibold">(Required)</span>}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={shopForm.email}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full px-4 sm:px-5 py-4 sm:py-5 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-base sm:text-lg font-medium shadow-sm transition-all duration-200 ${
                            !shopForm.email ? 'border-red-400 bg-red-50' : 'border-gray-400 hover:border-gray-500'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-base sm:text-lg font-bold text-gray-800 mb-3">
                           Contact No. <span className="text-red-600 text-lg">*</span>
                          {!shopForm.contact_no && <span className="text-red-600 text-sm ml-2 font-semibold">(Required)</span>}
                        </label>
                        <input
                          type="text"
                          name="contact_no"
                          value={shopForm.contact_no}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full px-4 sm:px-5 py-4 sm:py-5 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-base sm:text-lg font-medium shadow-sm transition-all duration-200 ${
                            !shopForm.contact_no ? 'border-red-400 bg-red-50' : 'border-gray-400 hover:border-gray-500'
                          }`}
                          placeholder="09123456789"
                          required
                        />
                      </div>
                    </div>

                    {/* Login Credentials */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base sm:text-lg font-bold text-gray-800 mb-3">
                           Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={shopForm.username}
                          onChange={handleInputChange}
                          className="w-full px-4 sm:px-5 py-4 sm:py-5 border-2 border-gray-400 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-base sm:text-lg font-medium shadow-sm transition-all duration-200 hover:border-gray-500"
                          placeholder="Enter username"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Address Information */}
                {currentStep === 2 && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 border-b-2 border-blue-200 pb-2">
                       Shop Address
                    </h2>
                    <p className="text-base sm:text-lg text-gray-700 mb-4 font-medium">
                      Add your shop address to help customers find you. All fields marked with <span className="text-red-600 font-bold text-lg">*</span> are required.
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
                <div className="flex flex-col sm:flex-row sm:justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-gray-300 space-y-3 sm:space-y-0">
                  <div className="order-2 sm:order-1">
                    {currentStep > 1 && (
                      <button
                        onClick={handlePrevStep}
                        className="w-full sm:w-auto px-8 py-4 border-2 border-gray-400 text-gray-800 rounded-xl hover:bg-gray-100 transition-all duration-200 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl touch-manipulation"
                      >
                        ← Previous
                      </button>
                    )}
                  </div>
                  
                  <div className="order-1 sm:order-2">
                    {currentStep < 2 ? (
                      <button
                        onClick={handleNextStep}
                        className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl touch-manipulation"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg font-bold shadow-lg hover:shadow-xl touch-manipulation"
                      >
                        {loading ? 'Setting up...' : 'Complete Setup'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center mt-4 sm:mt-6">
                  <div className="flex space-x-3">
                    {[1, 2].map((step) => (
                      <div
                        key={step}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300 shadow-md ${
                          step <= currentStep ? 'bg-blue-600 shadow-blue-300' : 'bg-gray-300'
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
