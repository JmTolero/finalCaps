import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { NavWithLogo } from "../../components/shared/nav";
import AddressForm from '../../components/shared/AddressForm';
import StarRating from '../../components/shared/StarRating';
import { useCart } from '../../contexts/CartContext';
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
  const { totalItems } = useCart();
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
  
  // Orders data
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [drumReturnLoading, setDrumReturnLoading] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // Fetch notifications for customer
  const fetchNotifications = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      setNotificationsLoading(true);
      
      const response = await axios.get(`${apiBase}/api/notifications/customer/${user.id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
        console.log('📬 Fetched notifications:', response.data.notifications.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/notifications/customer/${user.id}/unread-count`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Check URL parameters for view
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'settings') {
      setActiveView('settings');
    } else if (view === 'orders') {
      setActiveView('orders');
    }
    // Removed cart view handling - now using dedicated /cart route
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
    
    if (activeView === 'orders') {
      fetchCustomerOrders();
    }
    
    // Fetch notifications and unread count
    fetchNotifications();
    fetchUnreadCount();
  }, [activeView, fetchNotifications, fetchUnreadCount]);

  // Auto-refresh orders every 1:30 minutes when on orders view to track status changes
  useEffect(() => {
    let interval;
    
    if (activeView === 'orders') {
      // Set up auto-refresh every 1:30 minutes for order tracking
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing customer orders for status tracking...');
        fetchCustomerOrders();
      }, 90000); // 1:30 minutes (90 seconds) for better network efficiency
    }
    
    // Cleanup interval on component unmount or view change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeView]);

  // Auto-refresh customer dashboard every 1:30 minutes when on dashboard view
  useEffect(() => {
    let interval;
    
    if (activeView === 'dashboard') {
      // Initial fetch
      fetchAllFlavors();
      
      // Set up auto-refresh every 1:30 minutes
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing customer dashboard products...');
        fetchAllFlavors(false); // Don't show loading spinner for auto-refresh
      }, 90000); // 1:30 minutes (90 seconds) for better network efficiency
    }
    
    // Cleanup interval on component unmount or view change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeView]);

  // Reset customer data helper function
  const resetCustomerData = useCallback(() => {
    setAddresses([]);
    setAllFlavors([]);
    setVendorStatus(null);
  }, []);

  // Track current user ID to detect changes
  const [currentUserId, setCurrentUserId] = useState(null);

  // Listen for user changes to refresh data
  useEffect(() => {
    const handleUserChange = () => {
      const userRaw = sessionStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const isDifferentUser = currentUserId !== user.id;
        
        if (isDifferentUser) {
          console.log('Customer component - user changed:', { 
            currentUserId, 
            newUserId: user.id 
          });
          setCurrentUserId(user.id);
          
          // Update customer data
          setCustomerData({
            fname: user.firstName || user.fname || '',
            lname: user.lastName || user.lname || '',
            email: user.email || '',
            contact_no: user.contact_no || '',
            role: user.role || 'customer'
          });
          
          // Reset other data
          resetCustomerData();
          
          // Check vendor status if user is a vendor
          if (user.role === 'vendor') {
            checkVendorStatus(user.id);
          }
          
          // Reload data for current view
          if (activeView === 'dashboard') {
            fetchAllFlavors();
          }
          if (activeView === 'settings') {
            fetchCustomerData();
            fetchAddresses();
          }
        }
      } else {
        setCurrentUserId(null);
        resetCustomerData();
      }
    };

    window.addEventListener('userChanged', handleUserChange);
    return () => {
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, [activeView, resetCustomerData, currentUserId]);


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

  const fetchAllFlavors = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Fetch all published flavors from all vendors
      const response = await axios.get(`${apiBase}/api/flavors/all-published`);
      if (response.data.success) {
        setAllFlavors(response.data.flavors);
        console.log('🔄 Customer dashboard - flavors refreshed:', response.data.flavors.length);
      }
    } catch (error) {
      console.error('Error fetching flavors:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      setOrdersLoading(true);
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        console.error('No user session found');
        setOrders([]);
        return;
      }
      
      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/orders/customer/${user.id}`);
      
      if (response.data.success) {
        setOrders(response.data.orders);
        console.log('📦 Customer orders fetched:', response.data.orders.length);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handlePayment = (order) => {
    console.log('💳 Payment button clicked for order:', order.order_id);
    
    // Navigate to dedicated payment page
    navigate(`/customer/payment/${order.order_id}`);
  };


  const updateOrderPaymentStatus = async (orderId, paymentStatus) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Update payment status in database
      const response = await axios.put(`${apiBase}/api/orders/${orderId}/payment-status`, {
        payment_status: paymentStatus
      });
      
      if (response.data.success) {
        console.log('Payment status updated successfully for order:', orderId);
        
        // Refresh orders to show updated status
        fetchCustomerOrders();
        
        alert('Payment successful! The vendor has been notified and will start preparing your ice cream. You can track the progress in your orders.');
      } else {
        throw new Error(response.data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Payment completed, but failed to update status. Please contact support.');
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      await axios.put(`${apiBase}/api/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log(`📖 Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDrumReturn = async (order) => {
    if (!window.confirm('Are you sure you want to request drum return for this order? The vendor will be notified to pick up the drum.')) {
      return;
    }

    setDrumReturnLoading(order.order_id);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.post(`${apiBase}/api/orders/${order.order_id}/drum-return`, {
        drum_status: 'return_requested',
        return_requested_at: new Date().toISOString()
      });
      
      if (response.data.success) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.order_id === order.order_id 
              ? { ...o, drum_status: 'return_requested', return_requested_at: new Date().toISOString() }
              : o
          )
        );
        alert('Drum return requested successfully! The vendor will be notified to pick up the drum.');
      } else {
        alert('Failed to request drum return. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting drum return:', error);
      alert('Failed to request drum return. Please try again.');
    } finally {
      setDrumReturnLoading(null);
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
      
      const response = await axios.get(`${apiBase}/api/addresses/user/${userId}/addresses`);
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
        await axios.put(`${apiBase}/api/addresses/address/${editingAddress.address_id}`, addressPayload);
        setStatus({ type: 'success', message: 'Address updated successfully!' });
      } else {
        // Create new address
        await axios.post(`${apiBase}/api/addresses/user/${userId}/address`, addressPayload);
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
      await axios.delete(`${apiBase}/api/addresses/address/${addressId}`);
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
      
      await axios.put(`${apiBase}/api/addresses/user/${userId}/address/${addressId}/default`);
      setStatus({ type: 'success', message: 'Default address updated!' });
      fetchAddresses();
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to set default address' 
      });
    }
  };

  const setPrimaryAddress = async (addressId) => {
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
      
      await axios.put(`${apiBase}/api/addresses/user/${userId}/primary-address/${addressId}`);
      setStatus({ type: 'success', message: 'Primary address updated!' });
      fetchAddresses();
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to set primary address' 
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

  if (activeView === 'orders') {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                  <p className="text-gray-600 mt-2">Track your order status and history</p>
                </div>
                <button
                  onClick={() => {
                    setActiveView('dashboard');
                    navigate('/customer');
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
              
              {/* Order Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Orders', count: orders.length },
                  { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
                  { value: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
                  { value: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
                  { value: 'out_for_delivery', label: 'Out for Delivery', count: orders.filter(o => o.status === 'out_for_delivery').length },
                  { value: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
                  { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setOrderFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      orderFilter === filter.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label} {filter.count > 0 && `(${filter.count})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow-sm">
              {(() => {
                const filteredOrders = orderFilter === 'all' 
                  ? orders 
                  : orders.filter(order => order.status === orderFilter);

                // Show filter results summary
                if (!ordersLoading && orders.length > 0) {
                  const filterLabel = orderFilter === 'all' ? 'orders' : `${orderFilter.replace('_', ' ')} orders`;
                  console.log(`Showing ${filteredOrders.length} ${filterLabel} out of ${orders.length} total orders`);
                }
                
                return ordersLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                  <button
                    onClick={() => {
                      setActiveView('dashboard');
                      navigate('/customer');
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No {orderFilter === 'all' ? 'orders' : orderFilter} orders</h3>
                    <p className="text-gray-600">
                      {orderFilter === 'all' 
                        ? "You haven't placed any orders yet." 
                        : `No orders with status "${orderFilter.replace('_', ' ')}" found.`
                      }
                    </p>
                  </div>
                ) : (
                <div className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <div key={order.order_id} className="p-6">
                      {/* Condensed Order Summary */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Order #{order.order_id}
                              </h3>
                                    <p className="text-sm text-gray-600">
                                      {order.vendor_name} • {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      🕒 Delivery: {order.delivery_datetime ? (() => {
                                        const deliveryDate = new Date(order.delivery_datetime);
                                        console.log('🕒 Customer order display:', {
                                          orderId: order.order_id,
                                          rawDatetime: order.delivery_datetime,
                                          parsedDate: deliveryDate,
                                          formatted: deliveryDate.toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                          })
                                        });
                                        return deliveryDate.toLocaleString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        });
                                      })() : 'Not scheduled'}
                                    </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                            order.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : order.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'preparing'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'out_for_delivery'
                              ? 'bg-purple-100 text-purple-800'
                              : order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => setExpandedOrderId(expandedOrderId === order.order_id ? null : order.order_id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            {expandedOrderId === order.order_id ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Order Details */}
                      {expandedOrderId === order.order_id && (
                        <div className="border-t pt-4 space-y-6">
                          {/* Order Status Progression */}
                          {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered') && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3">Order Progress</h4>
                          <div className="flex items-center justify-between">
                            {/* Step 1: Confirmed */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered'
                                  ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                ✓
                              </div>
                              <span className="text-xs mt-1 text-center">Confirmed</span>
                            </div>
                            
                            {/* Progress Line 1 */}
                            <div className={`flex-1 h-1 mx-2 ${
                              order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered'
                                ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            
                            {/* Step 2: Preparing */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered'
                                  ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                {order.status === 'preparing' ? '🍦' : '✓'}
                              </div>
                              <span className="text-xs mt-1 text-center">Preparing</span>
                            </div>
                            
                            {/* Progress Line 2 */}
                            <div className={`flex-1 h-1 mx-2 ${
                              order.status === 'out_for_delivery' || order.status === 'delivered'
                                ? 'bg-purple-500' : 'bg-gray-300'
                            }`}></div>
                            
                            {/* Step 3: Out for Delivery */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                order.status === 'out_for_delivery' || order.status === 'delivered'
                                  ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                {order.status === 'out_for_delivery' ? '🚚' : '✓'}
                              </div>
                              <span className="text-xs mt-1 text-center">Out for Delivery</span>
                            </div>
                            
                            {/* Progress Line 3 */}
                            <div className={`flex-1 h-1 mx-2 ${
                              order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            
                            {/* Step 4: Delivered */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                order.status === 'delivered'
                                  ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                {order.status === 'delivered' ? '🎉' : '✓'}
                              </div>
                              <span className="text-xs mt-1 text-center">Delivered</span>
                            </div>
                          </div>
                          
                          {/* Current Status Message */}
                          <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">
                              {order.status === 'confirmed' && 'Order confirmed! Waiting for payment to start preparation.'}
                              {order.status === 'preparing' && '🍦 Your ice cream is being prepared!'}
                              {order.status === 'out_for_delivery' && '🚚 Your order is on the way!'}
                              {order.status === 'delivered' && '🎉 Order delivered successfully!'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Vendor</h4>
                          <p className="text-gray-600">{order.vendor_name || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Total Amount</h4>
                          <p className="text-lg font-semibold text-green-600">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Order Items Details */}
                      {order.order_items_details && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                          <div className="bg-pink-50 rounded-lg p-4">
                            <p className="text-gray-800 font-medium">{order.order_items_details}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Delivery Details</h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Address:</span>
                            <p className="text-gray-900">{order.delivery_address || 'No address specified'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Scheduled Date & Time:</span>
                            <p className="text-gray-900">
                              {order.delivery_datetime ? 
                                new Date(order.delivery_datetime).toLocaleString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'No delivery time specified'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Payment</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Method:</span>
                          <span className="font-medium">{order.payment_method?.toUpperCase() || 'N/A'}</span>
                          {order.payment_type && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">
                                {order.payment_type === 'downpayment' ? '50% Down Payment' : 'Full Payment'}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${
                            order.payment_status === 'unpaid' ? 'text-yellow-600' : 
                            order.payment_status === 'paid' ? 'text-green-600' : 
                            order.payment_status === 'partial' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {order.status === 'confirmed' && order.payment_status === 'unpaid' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-800 font-medium mb-2">Order Approved! Payment Required</p>
                          <p className="text-green-700 text-sm mb-3">
                            Your order has been approved by the vendor. Please proceed with payment to start ice cream production.
                          </p>
                          <button 
                            onClick={() => handlePayment(order)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            💳 Pay Now via GCash
                          </button>
                        </div>
                      )}

                      {order.status === 'delivered' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-blue-800 font-medium mb-1">🎉 Order Delivered Successfully!</p>
                              <p className="text-blue-700 text-sm">Your ice cream order has been delivered. Enjoy!</p>
                            </div>
                            {order.drum_status === 'return_requested' ? (
                              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                                📦 Return Requested
                              </span>
                            ) : order.drum_status === 'returned' ? (
                              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                ✅ Container Returned
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleDrumReturn(order)}
                                disabled={drumReturnLoading === order.order_id}
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              >
                                {drumReturnLoading === order.order_id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Requesting...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>📦</span>
                                    <span>Return Container</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          {order.drum_status === 'return_requested' && (
                            <p className="text-blue-600 text-sm">
                              The vendor has been notified to pick up the container. They will contact you to schedule the pickup.
                            </p>
                          )}
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-red-800 font-medium mb-1">❌ Order Declined</p>
                              <p className="text-red-700 text-sm">This order has been declined by the vendor.</p>
                              {order.decline_reason && (
                                <div className="mt-2 p-3 bg-red-100 rounded-lg">
                                  <p className="text-red-800 text-sm font-medium mb-1">Reason for decline:</p>
                                  <p className="text-red-700 text-sm">{order.decline_reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                );
              })()}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (activeView === 'settings') {
    
    return (
      <>
        <NavWithLogo />
        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-6 lg:py-8 mt-16">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-end mb-3 sm:mb-4 lg:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base">
                  Find nearby Vendors
                </Link>
                
                {/* Navigation Icons */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                  {/* Products/Flavors Icon */}
                  <button 
                    onClick={() => {
                      console.log('Products icon clicked - navigating to customer dashboard');
                      setActiveView('dashboard');
                      navigate('/customer');
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2"
                    title="Browse Products"
                  >
                    <img src={productsIcon} alt="Products" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {/* Shops Icon */}
                  <Link to="/all-vendor-stores" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2">
                    <img src={shopsIcon} alt="Shops" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                  
                  {/* Notification Bell */}
                  <button 
                    onClick={() => navigate('/customer/notifications')}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative sm:p-2"
                  >
                    <img src={notifIcon} alt="Notifications" className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold sm:w-5 sm:h-5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Cart Icon */}
                  <button 
                    onClick={() => navigate('/cart')}
                    className={`p-1.5 rounded-lg transition-all duration-200 relative sm:p-2 ${
                      totalItems > 0 
                        ? 'bg-orange-100 hover:bg-orange-200 shadow-sm' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                  >
                    <img 
                      src={cartIcon} 
                      alt="Cart" 
                      className={`w-4 h-4 transition-transform duration-200 sm:w-5 sm:h-5 ${
                        totalItems > 0 ? 'scale-110' : ''
                      }`} 
                    />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse sm:w-5 sm:h-5">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </button>
                  
                  
                  {/* Feedback Icon */}
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2">
                    <img src={feedbackIcon} alt="Feedback" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-6 lg:py-8" key={`settings-${settingsKey}`}>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">

            {/* Status Messages */}
            {status.type && (
              <div className={`p-4 rounded-lg mb-6 ${
                status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {status.message}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  <nav className="space-y-1 sm:space-y-2">
                    {settingsTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-2 sm:mr-3">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Profile Information</h2>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={customerData.fname || ''}
                              onChange={(e) => setCustomerData({...customerData, fname: e.target.value})}
                              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                              placeholder="Your first name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={customerData.lname || ''}
                              onChange={(e) => setCustomerData({...customerData, lname: e.target.value})}
                              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                              placeholder="Your last name"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={customerData.email || ''}
                              onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                              placeholder="your@email.com"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                              Contact Number
                            </label>
                            <input
                              type="text"
                              value={customerData.contact_no || ''}
                              onChange={(e) => setCustomerData({...customerData, contact_no: e.target.value})}
                              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                              placeholder="09123456789"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={saveProfile}
                            className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
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
                                    {address.is_primary && (
                                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                        Primary
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
                                    onClick={() => setPrimaryAddress(address.address_id)}
                                    className="text-purple-600 hover:text-purple-800 text-sm"
                                  >
                                    Set as Primary
                                  </button>
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
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-6 lg:py-8 mt-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-3 sm:gap-4 lg:gap-6">
            <div className="w-full sm:flex-1 sm:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ice cream flavors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2.5 pl-8 pr-3 text-sm text-gray-700 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4 sm:py-3 sm:pl-10 sm:text-base"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none sm:pl-3">
                  <svg className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base">
                Find nearby Vendors
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                {/* Products/Flavors Icon - Navigate to customer main dashboard */}
                <button 
                  onClick={() => navigate('/customer')}
                  className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors sm:p-2"
                  title="Browse Products"
                >
                  <img src={productsIcon} alt="Products" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                {/* Shops Icon */}
                <Link to="/all-vendor-stores" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2">
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                
                {/* Notification Bell */}
                <button 
                  onClick={() => navigate('/customer/notifications')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative sm:p-2"
                >
                  <img src={notifIcon} alt="Notifications" className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold sm:w-5 sm:h-5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Cart Icon */}
                <button 
                  onClick={() => navigate('/cart')}
                  className={`p-1.5 rounded-lg transition-all duration-200 relative sm:p-2 ${
                    totalItems > 0 
                      ? 'bg-orange-100 hover:bg-orange-200 shadow-sm' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Cart" 
                    className={`w-4 h-4 transition-transform duration-200 sm:w-5 sm:h-5 ${
                      totalItems > 0 ? 'scale-110' : ''
                    }`} 
                  />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse sm:w-5 sm:h-5">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </button>
                
                
                {/* Feedback Icon */}
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2">
                  <img src={feedbackIcon} alt="Feedback" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">DISCOVER FLAVORS</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">Explore delicious ice cream from local vendors</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading flavors...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
                <div 
                  key={`${flavor.vendor_id}-${flavor.flavor_id}`} 
                  className="bg-sky-100 rounded-lg p-3 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/flavor/${flavor.flavor_id}`)}
                >
                  {/* Flavor Image */}
                  <div className="mb-2">
                    {imageUrls.length > 0 ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                        alt={flavor.flavor_name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl mb-1">🍦</div>
                          <div className="text-xs text-gray-500">No Image</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flavor Info */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900 text-left line-clamp-1">
                      {flavor.flavor_name}
                    </h3>

                    <p className="text-gray-700 text-left text-xs line-clamp-2">
                      {flavor.flavor_description}
                    </p>

                    {/* Price Range */}
                    <div className="text-left">
                      <span className="text-sm font-bold text-gray-900">
                        {(() => {
                          const smallPrice = parseFloat(flavor.small_price || 0);
                          const largePrice = parseFloat(flavor.large_price || 0);
                          
                          if (smallPrice > 0 && largePrice > 0 && smallPrice !== largePrice) {
                            return `₱${smallPrice} - ₱${largePrice}`;
                          } else if (smallPrice > 0) {
                            return `₱${smallPrice}`;
                          } else if (largePrice > 0) {
                            return `₱${largePrice}`;
                          } else {
                            return 'Price not available';
                          }
                        })()}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="text-left">
                      <span className="text-xs text-gray-600">
                        {flavor.location && flavor.location !== 'Location not specified' 
                          ? flavor.location 
                          : 'Location not specified'
                        }
                      </span>
                    </div>

                    {/* Rating and Sold Count */}
                    <div className="flex justify-between items-center">
                      <StarRating 
                        rating={parseFloat(flavor.average_rating) || 0}
                        size="xs"
                        showCount={true}
                        totalRatings={flavor.total_ratings || 0}
                      />
                      <span className="text-xs text-gray-600 font-medium">
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
