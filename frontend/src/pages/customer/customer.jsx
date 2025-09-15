import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { NavWithLogo } from "../../components/shared/nav";
import AddressForm from '../../components/shared/AddressForm';
import axios from 'axios';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';

export const Customer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('profile');
  const [settingsKey, setSettingsKey] = useState(0);
  const [customerData, setCustomerData] = useState({
    fname: '',
    lname: '',
    email: '',
    contact_no: '',
    role: 'customer'
  });
  const [vendorStatus, setVendorStatus] = useState(null);
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
    address_type: 'residential'
  });
  const [addressLabel, setAddressLabel] = useState('Home');
  const [status, setStatus] = useState({ type: null, message: '' });
  
  // Marketplace data
  const [allFlavors, setAllFlavors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Check URL parameters for view
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'settings') {
      setActiveView('settings');
    }
  }, [searchParams]);

  // Force data refresh when settings view becomes active
  useEffect(() => {
    if (activeView === 'settings') {
      // Ensure customer data is loaded
      const userRaw = sessionStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const mappedData = {
          fname: user.firstName || user.fname || '',
          lname: user.lastName || user.lname || '',
          email: user.email || '',
          contact_no: user.contact_no || '',
          role: user.role || 'customer'
        };
        console.log('Mapping user data for settings:', user, '->', mappedData);
        setCustomerData(mappedData);
        setSettingsKey(prev => prev + 1); // Force re-render
      }
    }
  }, [activeView]);

  useEffect(() => {
    // Load user data from session
    const userRaw = sessionStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      setCustomerData({
        fname: user.firstName || user.fname || '',
        lname: user.lastName || user.lname || '',
        email: user.email || '',
        contact_no: user.contact_no || '',
        role: user.role || 'customer'
      });
      
      // Check vendor status if user is a vendor
      if (user.role === 'vendor') {
        checkVendorStatus(user.id);
      }
    }
    
    // Load marketplace data
    if (activeView === 'dashboard') {
      fetchAllFlavors();
    }
    
    if (activeView === 'settings') {
      fetchCustomerData();
      fetchAddresses();
    }
  }, [activeView]);


  const fetchCustomerData = async () => {
    try {
      // Load user data from session storage
      const userRaw = sessionStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        console.log('Loading customer data:', user);
        setCustomerData({
        fname: user.firstName || user.fname || '',
        lname: user.lastName || user.lname || '',
        email: user.email || '',
        contact_no: user.contact_no || '',
        role: user.role || 'customer'
      });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const checkVendorStatus = async (userId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/users/${userId}`);
      
      if (response.data.success) {
        const userData = response.data.user;
        setVendorStatus({
          status: userData.vendor_status,
          vendor_id: userData.vendor_id,
          setup_complete: userData.vendor_status === 'approved' // We'll check this more thoroughly if needed
        });
      }
    } catch (error) {
      console.error('Error checking vendor status:', error);
    }
  };

  const fetchAllFlavors = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Fetch all published flavors from all vendors
      const response = await axios.get(`${apiBase}/api/flavors/all-published`);
      if (response.data.success) {
        setAllFlavors(response.data.flavors);
      }
    } catch (error) {
      console.error('Error fetching flavors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Get user ID from sessionStorage
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        console.error('No user session found');
        setAddresses([]);
        return;
      }
      const user = JSON.parse(userRaw);
      const userId = user.id;
      
      const response = await axios.get(`${apiBase}/api/user/${userId}/addresses`);
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    }
  };

  const handleAddressChange = (addressData) => {
    setNewAddress(addressData);
  };

  const saveAddress = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Get user ID from sessionStorage
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        setStatus({ type: 'error', message: 'No user session found. Please log in again.' });
        return;
      }
      const user = JSON.parse(userRaw);
      const userId = user.id;
      
      const addressPayload = {
        ...newAddress,
        address_label: addressLabel
      };
      
      if (editingAddress) {
        // Update existing address
        await axios.put(`${apiBase}/api/address/${editingAddress.address_id}`, addressPayload);
        setStatus({ type: 'success', message: 'Address updated successfully!' });
      } else {
        // Create new address
        await axios.post(`${apiBase}/api/user/${userId}/address`, addressPayload);
        setStatus({ type: 'success', message: 'Address added successfully!' });
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
        address_type: 'residential'
      });
      setAddressLabel('Home');
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to save address' 
      });
    }
  };

  const editAddress = (address) => {
    setEditingAddress(address);
    setNewAddress(address);
    setAddressLabel(address.address_label || 'Home');
    setShowAddressForm(true);
  };

  const deleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      await axios.delete(`${apiBase}/api/address/${addressId}`);
      setStatus({ type: 'success', message: 'Address deleted successfully!' });
      fetchAddresses();
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to delete address' 
      });
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Get user ID from sessionStorage
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        setStatus({ type: 'error', message: 'No user session found. Please log in again.' });
        return;
      }
      const user = JSON.parse(userRaw);
      const userId = user.id;
      
      await axios.put(`${apiBase}/api/user/${userId}/address/${addressId}/default`);
      setStatus({ type: 'success', message: 'Default address updated!' });
      fetchAddresses();
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to set default address' 
      });
    }
  };


  const filteredFlavors = allFlavors.filter(flavor => 
    flavor.flavor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flavor.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (flavor.location && flavor.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'addresses', label: 'Delivery Addresses', icon: '📍' },
    { id: 'orders', label: 'Order History', icon: '📦' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  const addressLabels = ['Home', 'Work', 'Office', 'Other'];

  // Save customer profile
  const saveProfile = async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        alert('User not found. Please log in again.');
        return;
      }

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      console.log('Saving profile for user:', user);
      
      const response = await axios.put(`${apiBase}/api/customer/profile/${user.id}`, {
        fname: customerData.fname,
        lname: customerData.lname,
        email: customerData.email,
        contact_no: customerData.contact_no
      });

      if (response.data.success) {
        // Update sessionStorage with new data, mapping database fields to session fields
        const updatedUser = { 
          ...user, 
          firstName: response.data.user.fname,
          lastName: response.data.user.lname,
          email: response.data.user.email,
          contact_no: response.data.user.contact_no
        };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('userChanged'));
        
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Failed to update profile. Please try again.');
      }
    }
  };

  if (activeView === 'settings') {
    
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16" key={`settings-${settingsKey}`}>
          <div className="max-w-6xl mx-auto px-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                  <p className="text-gray-600 mt-2">Manage your profile and delivery preferences</p>
                </div>
                <button
                  onClick={() => {
                    setActiveView('dashboard');
                    setSettingsKey(0); // Reset settings key
                    // Navigate to clean URL
                    navigate('/customer');
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ← Back to Home
                </button>
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Navigation */}
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

              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div>
                      <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={customerData.fname || ''}
                              onChange={(e) => setCustomerData({...customerData, fname: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Your first name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={customerData.lname || ''}
                              onChange={(e) => setCustomerData({...customerData, lname: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Your last name"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={customerData.email || ''}
                              onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
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
                              value={customerData.contact_no || ''}
                              onChange={(e) => setCustomerData({...customerData, contact_no: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="09123456789"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={saveProfile}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
                        <h2 className="text-2xl font-semibold">Delivery Addresses</h2>
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
                              address_type: 'residential'
                            });
                            setAddressLabel('Home');
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          + Add Address
                        </button>
                      </div>

                      {/* Address List */}
                      <div className="space-y-4 mb-6">
                        {addresses.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-4">🏠</div>
                            <p className="text-lg">No delivery addresses yet</p>
                            <p className="text-sm">Add an address for faster checkout</p>
                          </div>
                        ) : (
                          addresses.map((address, index) => (
                            <div key={index} className={`border rounded-lg p-4 ${
                              address.is_default ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">{address.address_label}</h3>
                                    {address.is_default && (
                                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600">
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
                                <div className="flex flex-col space-y-2">
                                  <button
                                    onClick={() => editAddress(address)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  {!address.is_default && (
                                    <button
                                      onClick={() => setDefaultAddress(address.address_id)}
                                      className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                      Set Default
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteAddress(address.address_id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
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
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                          </h3>
                          
                          {/* Address Label */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Label
                            </label>
                            <select
                              value={addressLabel}
                              onChange={(e) => setAddressLabel(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {addressLabels.map(label => (
                                <option key={label} value={label}>{label}</option>
                              ))}
                            </select>
                          </div>
                          
                          <AddressForm
                            addressData={newAddress}
                            onAddressChange={handleAddressChange}
                            showAddressType={true}
                            addressType="residential"
                            required={true}
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

                  {/* Orders Tab */}
                  {activeTab === 'orders' && (
                    <div>
                      <h2 className="text-2xl font-semibold mb-6">Order History</h2>
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">📦</div>
                        <p>Order history coming soon...</p>
                      </div>
                    </div>
                  )}

                  {/* Preferences Tab */}
                  {activeTab === 'preferences' && (
                    <div>
                      <h2 className="text-2xl font-semibold mb-6">Preferences</h2>
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">⚙️</div>
                        <p>Preference settings coming soon...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Dashboard View - Marketplace Style
  return (
    <>
      <NavWithLogo />
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ice cream flavors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 pr-4 text-gray-700 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 ml-6">
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium">
                Find nearby Vendors
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 shadow-sm">
                {/* Products/Flavors Icon - Active on main customer page */}
                <button className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors">
                  <img src={productsIcon} alt="Products" className="w-5 h-5" />
                </button>
                
                {/* Shops Icon */}
                <Link to="/find-vendors" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={shopsIcon} alt="Shops" className="w-5 h-5" />
                </Link>
                
                {/* Notification Bell */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                  <img src={notifIcon} alt="Notifications" className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
                
                {/* Cart Icon */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={cartIcon} alt="Cart" className="w-5 h-5" />
                </button>
                
                {/* Feedback Icon */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={feedbackIcon} alt="Feedback" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DISCOVER FLAVORS</h1>
          <p className="text-gray-600">Explore delicious ice cream from local vendors</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading flavors...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFlavors.map((flavor) => {
              // Parse image URLs (stored as JSON array)
              let imageUrls = [];
              try {
                imageUrls = JSON.parse(flavor.image_url || '[]');
              } catch (e) {
                if (flavor.image_url) {
                  imageUrls = [flavor.image_url];
                }
              }
              
              return (
                <div key={`${flavor.vendor_id}-${flavor.flavor_id}`} className="bg-sky-100 rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
                  {/* Flavor Image */}
                  <div className="mb-4">
                    {imageUrls.length > 0 ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                        alt={flavor.flavor_name}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-48 bg-white rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🍦</div>
                          <div className="text-sm text-gray-600">No Image</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flavor Info */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 text-left">
                      {flavor.flavor_name}
                    </h3>

                    <p className="text-gray-700 text-left text-sm line-clamp-2">
                      {flavor.flavor_description}
                    </p>

                    {/* Price Range */}
                    <div className="text-left">
                      <span className="text-lg font-bold text-gray-900">
                        {flavor.small_price && flavor.large_price 
                          ? `₱${parseInt(flavor.small_price)} - ₱${parseInt(flavor.large_price)}`
                          : flavor.small_price 
                            ? `₱${parseInt(flavor.small_price)}`
                            : 'Price not available'
                        }
                      </span>
                    </div>

                    {/* Location */}
                    <div className="text-left">
                      <span className="text-sm text-gray-600">
                        {flavor.location || 'Location not specified'}
                      </span>
                    </div>

                    {/* Rating and Sold Count */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-4 h-4" fill={i < 3 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {flavor.sold_count || 0} sold
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredFlavors.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🍦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No flavors found</h3>
            <p className="text-gray-600">Try adjusting your search or check back later for new flavors!</p>
          </div>
        )}
      </main>
    </>
  );
};

export default Customer;
