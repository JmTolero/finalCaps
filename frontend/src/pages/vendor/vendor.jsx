import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AddressForm from '../../components/shared/AddressForm';
import logoImage from '../../assets/images/LOGO.png';
import axios from 'axios';

// Vendor Dashboard Icons
import dashboardIcon from '../../assets/images/vendordashboardicon/vendorDashboardicon.png';
import inventoryIcon from '../../assets/images/vendordashboardicon/inventoryProductVendorIcon.png';
import ordersIcon from '../../assets/images/vendordashboardicon/vendorOrderIcon.png';
import addCustomerIcon from '../../assets/images/vendordashboardicon/addcustomericon.png';
import paymentsIcon from '../../assets/images/vendordashboardicon/paymentsvendoricon.png';
import profileIcon from '../../assets/images/vendordashboardicon/profileVendorIcon.png';

export const Vendor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('profile');
  const [vendorData, setVendorData] = useState({
    fname: '',
    email: '',
    store_name: '',
    contact_no: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
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
  const [status, setStatus] = useState({ type: null, message: '' });
  const [showStatus, setShowStatus] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    confirmed_orders: 0,
    delivered_orders: 0,
    sales_today: 0,
    sales_this_month: 0,
    top_flavor: 'N/A',
    product_count: 0,
    upcoming_deliveries: []
  });
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchAddresses = useCallback(async (userId = null) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const userIdToUse = userId || currentVendor?.user_id;
      
      if (!userIdToUse) {
        console.log('No vendor user ID available yet');
        return;
      }
      
      const response = await axios.get(`${apiBase}/api/user/${userIdToUse}/addresses`);
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
      if (error.response?.status === 404) {
        updateStatus('info', 'No addresses found for this vendor yet.');
      } else {
        updateStatus('error', 'Failed to load addresses. Please try again.');
      }
    }
  }, [currentVendor?.user_id, setAddresses, setStatus]);

  const fetchCurrentVendor = useCallback(async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/vendor/current`);
      
      if (response.data.success) {
        setCurrentVendor(response.data.vendor);
        setVendorData({
          fname: response.data.vendor.fname,
          email: response.data.vendor.email,
          store_name: response.data.vendor.store_name,
          contact_no: response.data.vendor.contact_no
        });
        
        // Set profile image if available
        if (response.data.vendor.profile_image_url) {
          const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
          const imageUrl = `${apiBase}/uploads/vendor-documents/${response.data.vendor.profile_image_url}`;
          setProfileImage(imageUrl);
          setProfileImagePreview(imageUrl);
        }
        
        console.log('Current vendor:', response.data.vendor);
        
        // Fetch addresses for this vendor user
        fetchAddresses(response.data.vendor.user_id);
      } else {
        updateStatus('error', response.data.error || 'No vendor found. Please register as a vendor first.');
      }
    } catch (error) {
      console.error('Error fetching current vendor:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      if (error.response?.status === 404) {
        updateStatus('error', 'No vendor account found. Please register as a vendor first.');
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        updateStatus('error', 'Cannot connect to server. Please make sure the backend server is running on port 3001.');
      } else {
        updateStatus('error', `Failed to load vendor information: ${error.response?.data?.error || error.message}`);
      }
    }
  }, [fetchAddresses]);

  useEffect(() => {
    if (activeView === 'settings') {
      fetchCurrentVendor();
    }
  }, [activeView, fetchCurrentVendor]);

  // Fetch vendor data when component mounts
  useEffect(() => {
    fetchCurrentVendor();
  }, [fetchCurrentVendor]);

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'orders', 'inventory', 'addCustomerOrders', 'payments', 'analytics'].includes(tab)) {
      setActiveView(tab);
    }
  }, [searchParams]);

  // Fetch dashboard data when component mounts or vendor changes
  useEffect(() => {
    if (activeView === 'dashboard' && currentVendor?.vendor_id) {
      fetchDashboardData(currentVendor.vendor_id);
    }
  }, [activeView, currentVendor?.vendor_id]);

  // Fetch vendor dashboard data
  const fetchDashboardData = async (vendorId) => {
    if (!vendorId) return;
    
    try {
      setDashboardLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/vendor/dashboard/${vendorId}`);
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setDashboardData({
        total_orders: 0,
        total_revenue: 0,
        pending_orders: 0,
        confirmed_orders: 0,
        delivered_orders: 0,
        sales_today: 0,
        sales_this_month: 0,
        top_flavor: 'N/A',
        product_count: 0,
        upcoming_deliveries: []
      });
    } finally {
      setDashboardLoading(false);
    }
  };


  const handleAddressChange = (addressData) => {
    setNewAddress(addressData);
  };

  const saveAddress = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      if (!currentVendor?.user_id) {
        updateStatus('error', 'Vendor information not loaded. Please refresh the page.');
        return;
      }
      
      if (editingAddress) {
        // Update existing address
        await axios.put(`${apiBase}/api/address/${editingAddress.address_id}`, newAddress);
        updateStatus('success', 'Store address updated successfully!');
      } else {
        // Create new address with business label
        // Set as default if this is the first address
        const isFirstAddress = addresses.length === 0;
        
        const addressPayload = {
          ...newAddress,
          address_label: 'Store Location',
          is_default: isFirstAddress // Auto-set as default for first address
        };
        await axios.post(`${apiBase}/api/user/${currentVendor.user_id}/address`, addressPayload);
        updateStatus('success', `Store address added successfully!${isFirstAddress ? ' (Set as default)' : ''}`);
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
      fetchAddresses();
      
      // Clear form
      setNewAddress({
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
    } catch (error) {
      updateStatus('error', error.response?.data?.error || 'Failed to save address');
    }
  };

  const editAddress = (address) => {
    setEditingAddress(address);
    setNewAddress(address);
    setShowAddressForm(true);
  };

  const deleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      await axios.delete(`${apiBase}/api/address/${addressId}`);
      updateStatus('success', 'Address deleted successfully!');
      fetchAddresses();
    } catch (error) {
      updateStatus('error', error.response?.data?.error || 'Failed to delete address');
    }
  };

  const setPrimaryAddress = async (addressId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      if (!currentVendor?.user_id) {
        updateStatus('error', 'Vendor information not loaded.');
        return;
      }

      // Set as primary address for the user
      await axios.put(`${apiBase}/api/user/${currentVendor.user_id}/primary-address/${addressId}?table=users`);
      
      updateStatus('success', 'Primary address set successfully!');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting primary address:', error);
      updateStatus('error', error.response?.data?.error || 'Failed to set primary address');
    }
  };

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
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('pendingVendor');
    window.dispatchEvent(new Event('userChanged'));
    navigate('/login');
  };

  const handleSettingsClick = () => {
    setActiveView('settings');
    setIsProfileDropdownOpen(false);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateStatus = (type, message) => {
    setStatus({ type, message });
    setShowStatus(true);
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        setShowStatus(false);
        // Clear the status message after animation
        setTimeout(() => {
          setStatus({ type: null, message: '' });
        }, 300); // Match the transition duration
      }, 3000);
    }
  };


  const handleSaveProfile = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('fname', vendorData.fname);
      formData.append('store_name', vendorData.store_name);
      formData.append('email', vendorData.email);
      formData.append('contact_no', vendorData.contact_no);
      
      // Add profile image if a new one was selected
      if (newProfileImage) {
        formData.append('profile_image', newProfileImage);
      }

      const response = await axios.put(`${apiBase}/api/vendor/profile/${currentVendor?.vendor_id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        updateStatus('success', 'Profile updated successfully!');
        
        // Update current vendor data
        setCurrentVendor(prev => ({
          ...prev,
          fname: vendorData.fname,
          store_name: vendorData.store_name,
          email: vendorData.email,
          contact_no: vendorData.contact_no
        }));
        
        // Update profile image if changed
        if (newProfileImage) {
          const imageUrl = `${apiBase}/uploads/vendor-documents/${response.data.profile_image_url || newProfileImage.name}`;
          setProfileImage(imageUrl);
          setNewProfileImage(null);
        }
      } else {
        updateStatus('error', response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      updateStatus('error', 'Failed to update profile. Please try again.');
    }
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'addresses', label: 'Store Addresses', icon: '📍' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
    { id: 'inventory', label: 'Product Management', icon: inventoryIcon },
    { id: 'orders', label: 'Orders', icon: ordersIcon },
    { id: 'addCustomerOrders', label: 'Add Customer Orders', icon: addCustomerIcon },
    { id: 'payments', label: 'Payments', icon: paymentsIcon }
  ];

  // Settings View with Sidebar Layout
  if (activeView === 'settings') {
    return (
      <>
        {/* Custom Navbar */}
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
                {profileImage ? (
                  <img 
                    src={profileImage} 
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
                    <div className="font-medium">{currentVendor?.fname || 'Vendor'}</div>
                    <div className="text-gray-500">{currentVendor?.email}</div>
                  </div>
                  
                  {/* Settings */}
                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  
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

         <div className="min-h-screen flex">
           {/* Sidebar */}
           <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#BBDEF8] h-screen transition-all duration-300`}>
             <div className="p-4">
               <div className="flex items-center justify-between mb-10">
                 <button
                   onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                   className="p-2 rounded-md hover:bg-blue-200 transition-colors"
                 >
                   <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                   </svg>
                 </button>
                 {isSidebarOpen && (
                   <h2 className="text-xl font-bold text-gray-800">Vendor Panel</h2>
                 )}
               </div>
               
               {/* Menu items */}
               <ul className="flex flex-col space-y-2">
                 {sidebarItems.map((item) => (
                   <li key={item.id}>
                     <button
                       onClick={() => setActiveView(item.id)}
                       className={`w-full flex ${isSidebarOpen ? 'items-center gap-3' : 'items-center justify-center'} p-3 ${isSidebarOpen ? 'text-left' : 'text-center'} transition-colors hover:bg-blue-300 ${
                         activeView === item.id
                           ? 'bg-blue-200 text-blue-800 font-semibold'
                           : 'text-gray-700 hover:text-gray-900'
                       }`}
                     >
                       <img 
                         src={item.icon} 
                         alt={item.label} 
                         className="w-8 h-8 flex-shrink-0 object-contain" 
                       />
                       {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                     </button>
                   </li>
                 ))}
               </ul>
               
               {/* Separate Profile Button */}
               <div className="mt-4">
                 <button
                   onClick={() => {
                     console.log('Profile button clicked in settings - navigating to profile tab');
                     setActiveTab('profile');
                   }}
                   className={`w-full flex ${isSidebarOpen ? 'items-center gap-3' : 'items-center justify-center'} p-3 ${isSidebarOpen ? 'text-left' : 'text-center'} transition-colors hover:bg-blue-300 ${
                     activeTab === 'profile'
                       ? 'bg-blue-200 text-blue-800 font-semibold'
                       : 'text-gray-700 hover:text-gray-900'
                   }`}
                 >
                   <img 
                     src={profileIcon} 
                     alt="Profile" 
                     className="w-8 h-8 flex-shrink-0 object-contain" 
                   />
                   {isSidebarOpen && <span className="font-medium">Profile</span>}
                 </button>
               </div>
             </div>
           </div>

          {/* Main Content */}
          <div className="flex-1">

            <div className="p-8">
              <div className="max-w-6xl mx-auto">

              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Vendor Settings</h1>
                    <p className="text-gray-600 mt-2">Manage your store information and preferences</p>
                    {currentVendor && (
                      <div className="mt-2">
                        <p className="text-sm text-blue-600">
                          Store: {currentVendor.store_name} | Owner: {currentVendor.fname}
                        </p>
                        <p className="text-xs text-gray-500">
                          User ID: {currentVendor.user_id} | Vendor ID: {currentVendor.vendor_id} | Status: {currentVendor.status}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {status.type && showStatus && (
                <div className={`p-4 rounded-lg mb-6 transition-all duration-300 transform ${
                  showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                } ${
                  status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                  status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {status.message}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Settings Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <nav className="space-y-2">
                      {settingsTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="mr-3">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <div>
                        <h2 className="text-2xl font-semibold mb-6">Store Information</h2>
                        <div className="space-y-6">
                          {/* Profile Image Upload Section */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                            <div className="flex items-center space-x-6">
                              {/* Current/Preview Image */}
                              <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                  {profileImagePreview ? (
                                    <img 
                                      src={profileImagePreview} 
                                      alt="Profile preview" 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              
                              {/* Upload Button */}
                              <div className="flex-1">
                                <label className="block">
                                  <span className="sr-only">Choose profile photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileImageChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  />
                                </label>
                                <p className="mt-2 text-sm text-gray-500">
                                  JPG, PNG or GIF. Max size 5MB.
                                </p>
                                {newProfileImage && (
                                  <p className="mt-1 text-sm text-green-600">
                                    ✓ New image selected: {newProfileImage.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Owner Name
                              </label>
                              <input
                                type="text"
                                value={vendorData.fname || ''}
                                onChange={(e) => setVendorData({...vendorData, fname: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Your full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Store Name
                              </label>
                              <input
                                type="text"
                                value={vendorData.store_name || ''}
                                onChange={(e) => setVendorData({...vendorData, store_name: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Your store name"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={vendorData.email || ''}
                                onChange={(e) => setVendorData({...vendorData, email: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="your@email.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Number
                              </label>
                              <input
                                type="text"
                                value={vendorData.contact_no || ''}
                                onChange={(e) => setVendorData({...vendorData, contact_no: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="09123456789"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button 
                              onClick={handleSaveProfile}
                              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              Save Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Addresses Tab */}
                    {activeTab === 'addresses' && (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-semibold">Store Addresses</h2>
                          <button
                            onClick={() => {
                              setShowAddressForm(true);
                              setEditingAddress(null);
                              setNewAddress({
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
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            + Add Store Address
                          </button>
                        </div>

                        {/* Address List */}
                        <div className="space-y-4 mb-6">
                          {addresses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <div className="text-4xl mb-4">🏪</div>
                              <p className="text-lg">No store addresses added yet</p>
                              <p className="text-sm">Add your store address to help customers find you</p>
                            </div>
                          ) : (
                            addresses.map((address, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h3 className="font-semibold text-lg">{address.address_type} Address</h3>
                                      {address.is_default === 1 && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                          ⭐ Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 mt-1">
                                      {address.unit_number && `${address.unit_number}, `}
                                      {address.street_name}, {address.barangay}, {address.cityVillage}, {address.province}
                                      {address.postal_code && ` ${address.postal_code}`}
                                    </p>
                                    {address.landmark && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        Landmark: {address.landmark}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => editAddress(address)}
                                      className="text-blue-600 hover:text-blue-800 mr-2"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => setPrimaryAddress(address.address_id)}
                                      className="text-green-600 hover:text-green-800 mr-2"
                                    >
                                      Set Primary
                                    </button>
                                    <button
                                      onClick={() => deleteAddress(address.address_id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Address Form */}
                        {showAddressForm && (
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">
                              {editingAddress ? 'Edit Store Address' : 'Add New Store Address'}
                            </h3>
                            <AddressForm
                              addressData={newAddress}
                              onAddressChange={handleAddressChange}
                              showAddressType={true}
                              addressType="business"
                              required={true}
                              labelPrefix="Store "
                            />
                            <div className="flex justify-end space-x-4 mt-6">
                              <button
                                onClick={() => {
                                  setShowAddressForm(false);
                                  setEditingAddress(null);
                                }}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveAddress}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                {editingAddress ? 'Update Address' : 'Save Address'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                      <div>
                        <h2 className="text-2xl font-semibold mb-6">Documents</h2>
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-4">📄</div>
                          <p>Document management coming soon...</p>
                        </div>
                      </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                      <div>
                        <h2 className="text-2xl font-semibold mb-6">Notifications</h2>
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-4">🔔</div>
                          <p>Notification settings coming soon...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </>
    );
  }

  // Main Dashboard View with Sidebar Layout
  return (
    <>
      {/* Custom Navbar */}
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
              {profileImage ? (
                <img 
                  src={profileImage} 
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
                  <div className="font-medium">{currentVendor?.fname || 'Vendor'}</div>
                  <div className="text-gray-500">{currentVendor?.email}</div>
                </div>
                
                {/* Settings */}
                <button
                  onClick={handleSettingsClick}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                
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

       <div className="min-h-screen flex">
         {/* Sidebar */}
         <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#BBDEF8] h-screen transition-all duration-300`}>
           <div className="p-4">
             <div className="flex items-center justify-between mb-10">
               <button
                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                 className="p-2 rounded-md hover:bg-blue-200 transition-colors"
               >
                 <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                 </svg>
               </button>
               {isSidebarOpen && (
                 <h2 className="text-xl font-bold text-gray-800">Vendor Panel</h2>
               )}
             </div>
             
             {/* Menu items */}
             <ul className="flex flex-col space-y-2">
               {sidebarItems.map((item) => (
                 <li key={item.id}>
                   <button
                     onClick={() => {
                       console.log('Clicked item:', item.id, 'Current activeView:', activeView);
                       setActiveView(item.id);
                     }}
                     className={`w-full flex ${isSidebarOpen ? 'items-center gap-3' : 'items-center justify-center'} p-3 ${isSidebarOpen ? 'text-left' : 'text-center'} transition-colors hover:bg-blue-300 ${
                       activeView === item.id
                         ? 'bg-blue-200 text-blue-800 font-semibold'
                         : 'text-gray-700 hover:text-gray-900'
                     }`}
                   >
                     <img 
                       src={item.icon} 
                       alt={item.label} 
                       className="w-8 h-8 flex-shrink-0 object-contain" 
                     />
                     {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                   </button>
                 </li>
               ))}
             </ul>
             
             {/* Separate Profile Button */}
             <div className="mt-4">
               <button
                 onClick={() => {
                   console.log('Profile button clicked - navigating to settings');
                   setActiveView('settings');
                   setActiveTab('profile');
                 }}
                 className={`w-full flex ${isSidebarOpen ? 'items-center gap-3' : 'items-center justify-center'} p-3 ${isSidebarOpen ? 'text-left' : 'text-center'} transition-colors hover:bg-blue-300 ${
                   activeView === 'settings' && activeTab === 'profile'
                     ? 'bg-blue-200 text-blue-800 font-semibold'
                     : 'text-gray-700 hover:text-gray-900'
                 }`}
               >
                 <img 
                   src={profileIcon} 
                   alt="Profile" 
                   className="w-8 h-8 flex-shrink-0 object-contain" 
                 />
                 {isSidebarOpen && <span className="font-medium">Profile</span>}
               </button>
             </div>
           </div>
         </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Dashboard Content */}
            {activeView === 'dashboard' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Dashboard</h1>
                  <p className="text-gray-600">Welcome to your vendor dashboard. Manage your ice cream business here.</p>
                </div>
                

                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <img src={ordersIcon} alt="Orders" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardLoading ? '...' : dashboardData.total_orders}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <img src={paymentsIcon} alt="Revenue" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardLoading ? '...' : `₱${dashboardData.total_revenue.toLocaleString()}`}
                        </p>
                      </div>
                      </div>
                    </div>
                  </div>
                  
                {/* Other Details and Upcoming Deliveries */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Other Details Card */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Orders:</span>
                        <span className="text-sm font-semibold text-orange-600">
                          {dashboardLoading ? '...' : dashboardData.pending_orders}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Confirm Orders:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {dashboardLoading ? '...' : dashboardData.confirmed_orders}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Top Flavor:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {dashboardLoading ? '...' : dashboardData.top_flavor}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sales Today:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {dashboardLoading ? '...' : `₱${dashboardData.sales_today.toLocaleString()}`}
                        </span> 
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sales this Month:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {dashboardLoading ? '...' : `₱${dashboardData.sales_this_month.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upcoming Deliveries Card */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deliveries</h3>
                    <div className="space-y-3">
                      {dashboardLoading ? (
                        <div className="text-center py-8">
                          <div className="w-full h-16 bg-blue-50 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-500">Loading...</span>
                      </div>
                      </div>
                      ) : dashboardData.upcoming_deliveries.length > 0 ? (
                        dashboardData.upcoming_deliveries.map((delivery) => (
                          <div key={delivery.order_id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{delivery.customer_name}</p>
                                <p className="text-xs text-gray-500">{delivery.delivery_address}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(delivery.delivery_datetime).toLocaleDateString()} at{' '}
                                  {new Date(delivery.delivery_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                    </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">₱{delivery.total_amount}</p>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  delivery.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  delivery.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {delivery.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-full h-16 bg-blue-50 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-500">No upcoming deliveries</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Views */}
            {activeView === 'orders' && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders</h1>
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-gray-500">Order management coming soon...</p>
                </div>
              </div>
            )}


            {/* Add Product View */}
            {activeView === 'add-product' && (
              <div>
                <div className="mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <button
                      onClick={() => setActiveView('products')}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Back to Products</span>
                    </button>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Product</h1>
                  <p className="text-gray-600">Add a new ice cream product to your store.</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Vanilla Delight"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Flavor *
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="">Select a flavor</option>
                          <option value="vanilla">Vanilla</option>
                          <option value="chocolate">Chocolate</option>
                          <option value="strawberry">Strawberry</option>
                          <option value="mango">Mango</option>
                          <option value="pistachio">Pistachio</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your ice cream product..."
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Container Size *
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="">Select size</option>
                          <option value="small">Small (1 gallon)</option>
                          <option value="medium">Medium (2 gallons)</option>
                          <option value="large">Large (5 gallons)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (₱) *
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Image *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          <button type="button" className="font-medium text-blue-600 hover:text-blue-500">
                            Upload a file
                          </button>
                          {' '}or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setActiveView('products')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeView === 'inventory' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
                  <p className="text-gray-600">Manage your ice cream products and inventory.</p>
                </div>

                {/* Add Product Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setActiveView('add-product')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">All Flavors</option>
                      <option value="strawberry">Strawberry</option>
                      <option value="chocolate">Chocolate</option>
                      <option value="vanilla">Vanilla</option>
                      <option value="ube">Ube</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">All Sizes</option>
                      <option value="small">Small (3 gal)</option>
                      <option value="medium">Medium (5 gal)</option>
                      <option value="large">Large (8 gal)</option>
                    </select>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Add New Product Card */}
                  <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                    <div className="text-center p-8">
                      <div className="text-4xl mb-4 text-gray-400">➕</div>
                      <p className="text-gray-500 font-medium">Add New Product</p>
                      <p className="text-gray-400 text-sm">Click to create a new product</p>
                    </div>
                  </div>
                </div>

                {/* Inventory Summary */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                      </div>
                      <div className="text-2xl">📦</div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">In Stock</p>
                        <p className="text-2xl font-bold text-green-600">8</p>
                      </div>
                      <div className="text-2xl">✅</div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Low Stock</p>
                        <p className="text-2xl font-bold text-yellow-600">3</p>
                      </div>
                      <div className="text-2xl">⚠️</div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Out of Stock</p>
                        <p className="text-2xl font-bold text-red-600">1</p>
                      </div>
                      <div className="text-2xl">❌</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'addCustomerOrders' && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Customer Orders</h1>
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-gray-500">Add customer orders coming soon...</p>
                </div>
              </div>
            )}

            {activeView === 'payments' && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Payments</h1>
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                  <div className="text-4xl mb-4">💳</div>
                  <p className="text-gray-500">Payment management coming soon...</p>
                </div>
              </div>
            )}


            {activeView === 'analytics' && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                  <div className="text-4xl mb-4">📈</div>
                  <p className="text-gray-500">Analytics dashboard coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Vendor;


