import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { NavWithLogo } from "../../components/shared/nav";
import AddressForm from '../../components/shared/AddressForm';
import StarRating from '../../components/shared/StarRating';
import FeedbackModal from '../../components/shared/FeedbackModal';
import { useCart } from '../../contexts/CartContext';
import { getImageUrl } from '../../utils/imageUtils';
import axios from 'axios';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';
import findNearbyIcon from '../../assets/images/vendordashboardicon/findnearby.png';
import locationIcon from '../../assets/images/vendordashboardicon/location.png';

export const Customer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [orderFilter, setOrderFilter] = useState('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drumReturnLoading, setDrumReturnLoading] = useState(null);
  const [showDrumReturnModal, setShowDrumReturnModal] = useState(false);
  const [showDrumReturnSuccessModal, setShowDrumReturnSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [orderReviews, setOrderReviews] = useState({}); // Store reviews by order_id
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalType, setInfoModalType] = useState('success'); // 'success' or 'error'
  
  // Delete address confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Feedback dropdown state
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);
  
  // Handle feedback dropdown actions
  const handleFeedbackAction = (action) => {
    setShowFeedbackDropdown(false);
    if (action === 'submit') {
      setShowFeedbackModal(true);
    } else if (action === 'view') {
      navigate('/customer/my-feedback');
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFeedbackDropdown && !event.target.closest('.feedback-dropdown')) {
        setShowFeedbackDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFeedbackDropdown]);
  
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

  // Fetch customer's reviews
  const fetchMyReviews = useCallback(async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');
      
      if (!token) return;
      
      const response = await axios.get(`${apiBase}/api/reviews/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Store reviews by order_id for quick lookup
        const reviewsMap = {};
        response.data.reviews.forEach(review => {
          reviewsMap[review.order_id] = review;
        });
        setOrderReviews(reviewsMap);
        console.log('📝 Loaded my reviews:', response.data.reviews.length);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, []);

  // Submit review
  const submitReview = async () => {
    // Prevent multiple submissions
    if (submittingReview) {
      console.log('⚠️ Review submission already in progress');
      return;
    }
    
    if (reviewRating === 0) {
      setInfoModalTitle('Rating Required');
      setInfoModalMessage('Please select a rating before submitting your review.');
      setInfoModalType('error');
      setShowInfoModal(true);
      return;
    }
    
    if (!selectedOrderForReview) return;
    
    try {
      setSubmittingReview(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');
      
      const response = await axios.post(
        `${apiBase}/api/reviews`,
        {
          order_id: selectedOrderForReview.order_id,
          vendor_id: selectedOrderForReview.vendor_id,
          rating: reviewRating,
          comment: reviewComment.trim() || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        // Show success modal
        setInfoModalTitle('Review Submitted! ⭐');
        setInfoModalMessage('Thank you for your feedback! Your review has been submitted successfully.');
        setInfoModalType('success');
        setShowInfoModal(true);
        
        // Update local state
        setOrderReviews(prev => ({
          ...prev,
          [selectedOrderForReview.order_id]: {
            rating: reviewRating,
            comment: reviewComment
          }
        }));
        
        // Close modal and reset
        setShowReviewModal(false);
        setSelectedOrderForReview(null);
        setReviewRating(0);
        setReviewComment('');
        
        // Refresh reviews
        fetchMyReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMsg = error.response?.data?.error || 'Failed to submit review';
      
      setInfoModalTitle('Review Error');
      setInfoModalMessage(errorMsg);
      setInfoModalType('error');
      setShowInfoModal(true);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Render star rating
  const renderStarRating = (isEditable = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isEditable}
            onClick={() => isEditable && setReviewRating(star)}
            onMouseEnter={() => isEditable && setHoveredStar(star)}
            onMouseLeave={() => isEditable && setHoveredStar(0)}
            className={`text-3xl transition-all ${
              isEditable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${
              star <= (hoveredStar || reviewRating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // Check URL parameters for view
  useEffect(() => {
    const view = searchParams.get('view');
    const tab = searchParams.get('tab');
    
    if (view === 'settings') {
      setActiveView('settings');
      if (tab === 'addresses') {
        setActiveTab('addresses');
      }
    } else if (view === 'orders') {
      setActiveView('orders');
    }
    // Removed cart view handling - now using dedicated /cart route
  }, [searchParams]);

  // Reset modal states when component mounts or view changes
  useEffect(() => {
    setShowDrumReturnModal(false);
    setShowDrumReturnSuccessModal(false);
    setShowErrorModal(false);
    setSelectedOrderForReturn(null);
    setShowReviewModal(false);
    setShowInfoModal(false);
    setSelectedOrderForReview(null);
  }, [activeView]);

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

  // Fetch reviews when orders view is active
  useEffect(() => {
    if (activeView === 'orders') {
      fetchMyReviews();
    }
  }, [activeView, fetchMyReviews]);

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

  // Refresh orders when filter changes to get latest data
  useEffect(() => {
    if (activeView === 'orders' && orderFilter) {
      console.log('🔄 Refreshing orders due to filter change:', orderFilter);
      fetchCustomerOrders();
    }
  }, [orderFilter, activeView]);

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

  // Auto-scroll to status message and auto-hide success messages
  useEffect(() => {
    if (status.type) {
      // Scroll to status message
      setTimeout(() => {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
          statusElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);

      // Auto-hide success messages after 3 seconds
      if (status.type === 'success') {
        const timer = setTimeout(() => {
          setStatus({ type: null, message: '' });
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [status.type, status.message]);

  // Auto-scroll to address form when it opens
  useEffect(() => {
    if (showAddressForm) {
      setTimeout(() => {
        const addressForm = document.querySelector('[data-address-form]');
        if (addressForm) {
          addressForm.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  }, [showAddressForm]);


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

  // Handle cancel order
  const handleCancelOrder = async (orderId) => {
    console.log('🚫 Cancel order button clicked for order:', orderId);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      console.log('🚫 Making API call to:', `${apiBase}/api/orders/${orderId}/status`);
      
      const response = await axios.put(`${apiBase}/api/orders/${orderId}/status`, {
        status: 'cancelled'
      });
      
      console.log('🚫 API response:', response.data);
      
      if (response.data.success) {
        console.log('Order cancelled successfully:', orderId);
        
        // Refresh orders to show updated status
        fetchCustomerOrders();
        
        setStatus({ type: 'success', message: 'Order cancelled successfully!' });
      } else {
        throw new Error(response.data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      console.error('Error details:', error.response?.data);
      setStatus({ type: 'error', message: `Failed to cancel order: ${error.response?.data?.error || error.message}` });
    }
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
        
        console.log('Payment successful! The vendor has been notified and will start preparing your ice cream.');
      } else {
        throw new Error(response.data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      showError('Payment completed, but failed to update status. Please contact support.');
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

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleDrumReturn = (order) => {
    setSelectedOrderForReturn(order);
    setShowDrumReturnModal(true);
  };

  const confirmDrumReturn = async () => {
    if (!selectedOrderForReturn) return;

    setDrumReturnLoading(selectedOrderForReturn.order_id);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.post(`${apiBase}/api/orders/${selectedOrderForReturn.order_id}/drum-return`, {
        drum_status: 'return_requested',
        return_requested_at: new Date().toISOString()
      });
      
      if (response.data.success) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.order_id === selectedOrderForReturn.order_id 
              ? { ...o, drum_status: 'return_requested', return_requested_at: new Date().toISOString() }
              : o
          )
        );
        setShowDrumReturnSuccessModal(true);
      } else {
        showError('Failed to request drum return. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting drum return:', error);
      showError('Failed to request drum return. Please try again.');
    } finally {
      setDrumReturnLoading(null);
      setShowDrumReturnModal(false);
      // Don't reset selectedOrderForReturn here - keep it for the success modal
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
    setAddressToDelete(addressId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;   
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      await axios.delete(`${apiBase}/api/addresses/address/${addressToDelete}`);
      setStatus({ type: 'success', message: 'Address deleted successfully!' });
      fetchAddresses();
      setShowDeleteModal(false);
      setAddressToDelete(null);
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to delete address' 
      });
      setShowDeleteModal(false);
      setAddressToDelete(null);
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
    { id: 'gcash', label: 'QR Payments', icon: '📱' }
  ];

  const addressLabels = ['Home', 'Work', 'Office', 'Other'];

  // Save customer profile
  const saveProfile = async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        showError('User not found. Please log in again.');
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
        
        // Show success message
        setStatus({ type: 'success', message: response.data.message || 'Profile updated successfully!' });
        
        // Auto-scroll to top and auto-dismiss after 3 seconds
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          setStatus({ type: null, message: '' });
        }, 3000);
        
        console.log('Profile updated successfully!');
      } else {
        showError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      if (error.response?.data?.error) {
        showError(`Error: ${error.response.data.error}`);
      } else {
        showError('Failed to update profile. Please try again.');
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
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
                  {/* Back Button - Right corner */}
                  <button
                    onClick={() => {
                      setActiveView('dashboard');
                      navigate('/customer');
                    }}
                    className="bg-gray-100 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                    title="Back to Home"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline">Back to Home</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base text-gray-600">Track your order status and history</p>
              </div>
              
              {/* Order Filters */}
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-2 min-w-max">
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
                      onClick={() => {
                        console.log('🔍 Filter button clicked:', filter.value);
                        setOrderFilter(filter.value);
                      }}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
                    <div key={order.order_id} className="p-3 sm:p-6">
                      {/* Condensed Order Summary */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                Order #{order.order_id}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600">
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
                            <div className="text-left sm:text-right">
                              <p className="text-base sm:text-lg font-bold text-green-600">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full w-fit ${
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
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors w-full sm:w-auto"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Drum Return Confirmation Modal */}
        {showDrumReturnModal && selectedOrderForReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Request Drum Return
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to request drum return for Order #{selectedOrderForReturn.order_id}? 
                  The vendor will be notified to pick up the drum.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDrumReturnModal(false);
                      setSelectedOrderForReturn(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDrumReturn}
                    disabled={drumReturnLoading === selectedOrderForReturn.order_id}
                    className="flex-1 bg-orange-300 hover:bg-orange-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {drumReturnLoading === selectedOrderForReturn.order_id ? 'Processing...' : 'Confirm Return'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drum Return Success Modal */}
        {showDrumReturnSuccessModal && selectedOrderForReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drum Return Requested Successfully! ✅
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Your drum return request for Order #{selectedOrderForReturn.order_id} has been submitted. 
                  The vendor will be notified to pick up the drum and will contact you to schedule the pickup.
                </p>
                
                <button
                  onClick={() => {
                    setShowDrumReturnSuccessModal(false);
                    setSelectedOrderForReturn(null);
                    // Refresh orders to ensure UI is up to date
                    fetchCustomerOrders();
                  }}
                  className="w-full bg-orange-300 hover:bg-orange-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
         )}

        {/* Review Modal */}
        {showReviewModal && selectedOrderForReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Leave a Review
                  </h3>
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedOrderForReview(null);
                      setReviewRating(0);
                      setReviewComment('');
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Shop Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">You're reviewing</p>
                    <p className="font-semibold text-gray-900">{selectedOrderForReview.vendor_name}</p>
                    <p className="text-xs text-gray-500">Order #{selectedOrderForReview.order_id}</p>
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Rate your experience <span className="text-red-500">*</span>
                    </label>
                    {renderStarRating(true)}
                    {reviewRating > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        {reviewRating === 1 && '⭐ Poor'}
                        {reviewRating === 2 && '⭐⭐ Fair'}
                        {reviewRating === 3 && '⭐⭐⭐ Good'}
                        {reviewRating === 4 && '⭐⭐⭐⭐ Very Good'}
                        {reviewRating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Share your thoughts (Optional)
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tell us about your experience with this shop..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {reviewComment.length}/500 characters
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedOrderForReview(null);
                        setReviewRating(0);
                        setReviewComment('');
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                      disabled={submittingReview}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitReview}
                      disabled={submittingReview || reviewRating === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </span>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {errorMessage}
                </p>
                
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Modal (Success/Error for Reviews) - Orders View */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                  infoModalType === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {infoModalType === 'success' ? (
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {infoModalTitle}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {infoModalMessage}
                </p>
                
                <button
                  onClick={() => setShowInfoModal(false)}
                  className={`w-full font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${
                    infoModalType === 'success' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowOrderModal(false);
                setSelectedOrder(null);
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
              <div className="p-3 sm:p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 pr-2">
                    Order #{selectedOrder.order_id} Details
                  </h2>
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      setSelectedOrder(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Order Status Progression */}
                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered') && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Order Progress</h4>
                    <div className="flex items-center justify-between">
                      {/* Step 1: Confirmed */}
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                            ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <span className="text-xs sm:text-sm">✓</span>
                        </div>
                        <span className="text-xs mt-1 text-center">Confirmed</span>
                      </div>
                      
                      {/* Progress Line 1 */}
                      <div className={`flex-1 h-1 mx-1 sm:mx-2 ${
                        selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                          ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      
                      {/* Step 2: Preparing */}
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                            ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <span className="text-xs sm:text-sm">{selectedOrder.status === 'preparing' ? '🍦' : '✓'}</span>
                        </div>
                        <span className="text-xs mt-1 text-center">Preparing</span>
                      </div>
                      
                      {/* Progress Line 2 */}
                      <div className={`flex-1 h-1 mx-1 sm:mx-2 ${
                        selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                          ? 'bg-purple-500' : 'bg-gray-300'
                      }`}></div>
                      
                      {/* Step 3: Out for Delivery */}
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                            ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <span className="text-xs sm:text-sm">{selectedOrder.status === 'out_for_delivery' ? '🚚' : '✓'}</span>
                        </div>
                        <span className="text-xs mt-1 text-center">Out for Delivery</span>
                      </div>
                      
                      {/* Progress Line 3 */}
                      <div className={`flex-1 h-1 mx-1 sm:mx-2 ${
                        selectedOrder.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      
                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          selectedOrder.status === 'delivered'
                            ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <span className="text-xs sm:text-sm">{selectedOrder.status === 'delivered' ? '🎉' : '✓'}</span>
                        </div>
                        <span className="text-xs mt-1 text-center">Delivered</span>
                      </div>
                    </div>
                    
                    {/* Current Status Message */}
                    <div className="mt-3 sm:mt-4 text-center">
                      <p className="text-xs sm:text-sm text-gray-600 px-2">
                        {selectedOrder.status === 'confirmed' && 'Order confirmed! Waiting for payment to start preparation.'}
                        {selectedOrder.status === 'preparing' && '🍦 Your ice cream is being prepared!'}
                        {selectedOrder.status === 'out_for_delivery' && '🚚 Your order is on the way!'}
                        {selectedOrder.status === 'delivered' && '🎉 Order delivered successfully!'}
                      </p>
                    </div>
                  </div>
                )}
                      
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Vendor</h4>
                    <p className="text-gray-600 text-sm sm:text-base">{selectedOrder.vendor_name || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Total Amount</h4>
                    <p className="text-base sm:text-lg font-semibold text-green-600">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
                  </div>
                </div>
                      
                {/* Order Items Details */}
                {selectedOrder.order_items_details && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Order Items</h4>
                    <div className="bg-pink-50 rounded-lg p-3 sm:p-4">
                      <p className="text-gray-800 font-medium text-sm sm:text-base break-words">{selectedOrder.order_items_details}</p>
                    </div>
                  </div>
                )}
                      
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Delivery Details</h4>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Address:</span>
                      <p className="text-gray-900 text-sm sm:text-base break-words">{selectedOrder.delivery_address || 'No address specified'}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Scheduled Date & Time:</span>
                      <p className="text-gray-900 text-sm sm:text-base">
                        {selectedOrder.delivery_datetime ? 
                          new Date(selectedOrder.delivery_datetime).toLocaleString('en-US', {
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
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Payment</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 text-sm sm:text-base">Method:</span>
                      <span className="font-medium text-sm sm:text-base">{selectedOrder.payment_method?.toLowerCase() === 'gcash' || selectedOrder.payment_method?.toLowerCase() === 'gcaash' ? 'GCash' : selectedOrder.payment_method?.toUpperCase() || 'N/A'}</span>
                    </div>
                    {selectedOrder.payment_type && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {selectedOrder.payment_type === 'downpayment' ? '50% Down Payment' : 'Full Payment'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-gray-600 text-sm sm:text-base">Status:</span>
                    <span className={`font-medium text-sm sm:text-base ${
                      selectedOrder.payment_status === 'unpaid' ? 'text-yellow-600' : 
                      selectedOrder.payment_status === 'paid' ? 'text-green-600' : 
                      selectedOrder.payment_status === 'partial' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {selectedOrder.payment_status?.charAt(0).toUpperCase() + selectedOrder.payment_status?.slice(1) || 'N/A'}
                    </span>
                  </div>
                </div>
                      
                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'awaiting_payment') && selectedOrder.payment_status === 'unpaid' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <p className="text-green-800 font-medium mb-2 text-sm sm:text-base">Order Approved! Payment Required</p>
                    <p className="text-green-700 text-xs sm:text-sm mb-3">
                      Your order has been approved by the vendor. Please proceed with payment to start ice cream production.
                    </p>
                    <button 
                      onClick={() => handlePayment(selectedOrder)}
                      className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                    >
                      💳 Pay Now via GCash
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <p className="text-yellow-800 font-medium mb-1 text-sm sm:text-base">⏳ Order Pending Approval</p>
                        <p className="text-yellow-700 text-xs sm:text-sm">
                          Your order is waiting for vendor approval. You can cancel it if needed.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          console.log('🚫 Cancel button clicked for order:', selectedOrder.order_id);
                          handleCancelOrder(selectedOrder.order_id);
                        }}
                        className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
                      >
                        <span>❌</span>
                        <span>Cancel Order</span>
                      </button>
                    </div>
                    <p className="text-yellow-600 text-xs sm:text-sm">
                      The vendor will review your order and notify you once it's approved or if any changes are needed.
                    </p>
                  </div>
                )}

                {selectedOrder.status === 'delivered' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <p className="text-blue-800 font-medium mb-1 text-sm sm:text-base">🎉 Order Delivered Successfully!</p>
                        <p className="text-blue-700 text-xs sm:text-sm">Your ice cream order has been delivered. Enjoy!</p>
                      </div>
                      {selectedOrder.drum_status === 'return_requested' ? (
                        <span className="inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 w-full sm:w-auto justify-center">
                          📦 Return Requested
                        </span>
                      ) : selectedOrder.drum_status === 'returned' ? (
                        <span className="inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-green-100 text-green-800 w-full sm:w-auto justify-center">
                          ✅ Container Returned
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleDrumReturn(selectedOrder)}
                          disabled={drumReturnLoading === selectedOrder.order_id}
                          className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
                        >
                          {drumReturnLoading === selectedOrder.order_id ? (
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
                    {selectedOrder.drum_status === 'return_requested' && (
                      <p className="text-blue-600 text-xs sm:text-sm">
                        The vendor has been notified to pick up the container. They will contact you to schedule the pickup.
                      </p>
                    )}
                  </div>
                )}

                {/* Review Section - Only for delivered orders */}
                {selectedOrder.status === 'delivered' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4">
                    {orderReviews[selectedOrder.order_id] ? (
                      <div>
                        <p className="text-blue-800 font-medium mb-2 text-sm sm:text-base">⭐ Your Review</p>
                        <div className="flex items-center space-x-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg sm:text-xl ${
                                star <= orderReviews[selectedOrder.order_id].rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="text-xs sm:text-sm text-gray-600 ml-2">
                            {orderReviews[selectedOrder.order_id].rating}.0 / 5.0
                          </span>
                        </div>
                        {orderReviews[selectedOrder.order_id].comment && (
                          <p className="text-gray-700 text-xs sm:text-sm italic break-words">
                            "{orderReviews[selectedOrder.order_id].comment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <p className="text-blue-800 font-medium mb-1 text-sm sm:text-base">
                            ⭐ How was your experience?
                          </p>
                          <p className="text-blue-700 text-xs sm:text-sm">
                            Share your feedback about this shop
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrderForReview(selectedOrder);
                            setReviewRating(0);
                            setReviewComment('');
                            setShowReviewModal(true);
                          }}
                          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
                        >
                          <span>⭐</span>
                          <span>Leave Review</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedOrder.status === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        {selectedOrder.decline_reason ? (
                          <>
                            <p className="text-red-800 font-medium mb-1 text-sm sm:text-base">❌ Order Declined by Vendor</p>
                            <p className="text-red-700 text-xs sm:text-sm">This order has been declined by the vendor.</p>
                            <div className="mt-2 p-2 sm:p-3 bg-red-100 rounded-lg">
                              <p className="text-red-800 text-xs sm:text-sm font-medium mb-1">Reason for decline:</p>
                              <p className="text-red-700 text-xs sm:text-sm break-words">{selectedOrder.decline_reason}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-red-800 font-medium mb-1 text-sm sm:text-base">❌ Order Cancelled</p>
                            <p className="text-red-700 text-xs sm:text-sm">This order has been cancelled.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      setSelectedOrder(null);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
            {/* Mobile Layout - Stacked */}
            <div className="flex flex-col gap-3 sm:hidden mb-3">
              {/* Top Row: Find nearby Vendors + Icons */}
              <div className="flex items-center justify-between">
                <Link
                  to="/find-vendors"
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm"
                >
                  <img src={findNearbyIcon} alt="Find nearby Vendors" className="w-5 h-5" />
                </Link>
                
                {/* Navigation Icons */}
                <div className="flex items-center space-x-1.5 bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
                  {/* Products/Flavors Icon */}
                  <button
                    onClick={() => {
                      console.log('Products icon clicked - navigating to customer dashboard');
                      setActiveView('dashboard');
                      navigate('/customer');
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      location.pathname === '/customer' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <img src={productsIcon} alt="Products" className="w-4 h-4" />
                  </button>

                  {/* Shops Icon */}
                  <Link 
                    to="/all-vendor-stores" 
                    className={`p-1.5 rounded-lg transition-colors ${
                      location.pathname === '/all-vendor-stores' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <img src={shopsIcon} alt="Shops" className="w-4 h-4" />
                  </Link>

                  {/* Notification Bell */}
                  <button 
                    onClick={() => navigate('/customer/notifications')}
                    className={`p-1.5 rounded-lg transition-colors relative ${
                      location.pathname === '/customer/notifications' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <img src={notifIcon} alt="Notifications" className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Cart Icon */}
                  <button 
                    onClick={() => navigate('/cart')}
                    className={`p-1.5 rounded-lg transition-colors relative ${
                      location.pathname === '/cart' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                  >
                    <img src={cartIcon} alt="Cart" className="w-4 h-4" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </button>
                  
                  {/* Feedback Icon */}
                  <button 
                    onClick={() => navigate('/customer/feedback')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      location.pathname === '/customer/feedback' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <img src={feedbackIcon} alt="Feedback" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-end mb-3 sm:mb-4 lg:mb-6">
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
                    className={`p-1.5 rounded-lg transition-colors sm:p-2 ${
                      location.pathname === '/customer' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                    title="Browse Products"
                  >
                    <img src={productsIcon} alt="Products" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {/* Shops Icon */}
                  <Link 
                    to="/all-vendor-stores" 
                    className={`p-1.5 rounded-lg transition-colors sm:p-2 ${
                      location.pathname === '/all-vendor-stores' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <img src={shopsIcon} alt="Shops" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                  
                  {/* Notification Bell */}
                  <button 
                    onClick={() => navigate('/customer/notifications')}
                    className={`p-1.5 rounded-lg transition-colors relative sm:p-2 ${
                      location.pathname === '/customer/notifications' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
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
                    className={`p-1.5 rounded-lg transition-colors relative sm:p-2 ${
                      location.pathname === '/cart' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                  >
                    <img 
                      src={cartIcon} 
                      alt="Cart" 
                      className={`w-4 h-4 transition-transform duration-200 sm:w-5 sm:h-5`} 
                    />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold sm:w-5 sm:h-5">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </button>
                  
                  
                  {/* Feedback Icon with Dropdown */}
                  <div className="relative feedback-dropdown">
                    <button 
                      onClick={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
                      className={`p-1.5 rounded-lg transition-colors sm:p-2 ${
                        location.pathname === '/customer/feedback' 
                          ? 'bg-blue-100 hover:bg-blue-200' 
                          : 'hover:bg-gray-100'
                      }`}
                      title="Feedback Options"
                    >
                      <img src={feedbackIcon} alt="Feedback" className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showFeedbackDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]">
                        <button
                          onClick={() => handleFeedbackAction('submit')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Submit Feedback
                        </button>
                        <button
                          onClick={() => handleFeedbackAction('view')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          My Feedback
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-6 lg:py-8" key={`settings-${settingsKey}`}>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">

            {/* Status Messages */}
            {status.type && (
              <div 
                id="status-message"
                className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base ${
                  status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                  'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  {/* Mobile: Horizontal Layout */}
                  <nav className="flex flex-wrap gap-1 sm:space-y-2 sm:flex-col sm:flex-nowrap">
                    {settingsTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 sm:w-full text-center sm:text-left px-2 py-2 sm:px-4 sm:py-3 rounded-lg transition-colors text-xs sm:text-base ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-center sm:items-start">
                          <span className="mb-1 sm:mb-0 sm:mr-3">{tab.icon}</span>
                          <span className="text-xs sm:text-sm leading-tight">{tab.label}</span>
                        </div>
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
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
                        <h2 className="text-xl sm:text-2xl font-semibold">Delivery Addresses</h2>
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
                          className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                        >
                          + Add Address
                        </button>
                      </div>

                      {/* Address List */}
                      <div className="space-y-4 mb-6">
                        {addresses.length === 0 ? (
                          <div className="text-center py-6 sm:py-8 text-gray-500">
                            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🏠</div>
                            <p className="text-base sm:text-lg">No delivery addresses yet</p>
                            <p className="text-xs sm:text-sm">Add an address for faster checkout</p>
                          </div>
                        ) : (
                          addresses.map((address, index) => (
                            <div key={index} className={`border rounded-lg p-3 sm:p-4 ${
                              address.is_default ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-base sm:text-lg">{address.address_label}</h3>
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                      {address.is_default && (
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-gray-600 text-sm sm:text-base break-words">
                                    {address.unit_number && `${address.unit_number}, `}
                                    {address.street_name}, {address.barangay}, {address.cityVillage}, {address.province}
                                    {address.postal_code && ` ${address.postal_code}`}
                                  </p>
                                  {address.landmark && (
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                                      Landmark: {address.landmark}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 sm:flex-col sm:space-y-2 sm:gap-0">
                                  <button
                                    onClick={() => editAddress(address)}
                                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm px-2 py-1 sm:px-0 sm:py-0 rounded sm:rounded-none hover:bg-blue-50 sm:hover:bg-transparent"
                                  >
                                    Edit
                                  </button>
                                  {!address.is_default && (
                                    <button
                                      onClick={() => setDefaultAddress(address.address_id)}
                                      className="text-green-600 hover:text-green-800 text-xs sm:text-sm px-2 py-1 sm:px-0 sm:py-0 rounded sm:rounded-none hover:bg-green-50 sm:hover:bg-transparent"
                                    >
                                      Set Default
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteAddress(address.address_id)}
                                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm px-2 py-1 sm:px-0 sm:py-0 rounded sm:rounded-none hover:bg-red-50 sm:hover:bg-transparent"
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
                        <div className="border-t pt-6" data-address-form>
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
                          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0 mt-6">
                            <button
                              onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddress(null);
                              }}
                              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveAddress}
                              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                            >
                              {editingAddress ? 'Update Address' : 'Save Address'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR Payments Tab */}
                  {activeTab === 'gcash' && (
                    <div>
                      <div className="mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-semibold">QR Payment System</h2>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                        <div className="flex items-center mb-3 sm:mb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                            <span className="text-xl sm:text-2xl">📱</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Direct QR Payments</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Pay vendors directly using GCash QR codes</p>
                          </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200">
                            <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">💡 How it works:</h4>
                            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                              <li>• Scan vendor's GCash QR code during checkout</li>
                              <li>• Pay directly to vendor - no platform fees</li>
                              <li>• Vendor receives 100% of payment</li>
                              <li>• Faster and more secure payment process</li>
                            </ul>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                            <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">📱 Payment Process:</h4>
                            <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
                              <li>1. Place your order and proceed to checkout</li>
                              <li>2. Scan the vendor's GCash QR code</li>
                              <li>3. Pay the exact amount in your GCash app</li>
                              <li>4. Upload payment confirmation screenshot</li>
                              <li>5. Order is confirmed and vendor is notified</li>
                            </ol>
                          </div>

                          <div className="flex justify-center">
                            <div className="text-center">
                              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Ready to pay with QR codes?</p>
                              <p className="text-xs text-gray-500">QR payment option will appear during checkout</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Address Confirmation Modal - Settings View Only */}
        {showDeleteModal && addressToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Address
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete this address? This action cannot be undone.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setAddressToDelete(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteAddress}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col gap-3 sm:hidden mb-3">
            {/* Top Row: Find nearby Vendors + Icons */}
            <div className="flex items-center justify-between">
              <Link to="/find-vendors" className="p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm">
                <img src={findNearbyIcon} alt="Find nearby Vendors" className="w-5 h-5" />
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
                {/* Products/Flavors Icon - Navigate to customer main dashboard */}
                <button 
                  onClick={() => navigate('/customer')}
                  className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                  title="Browse Products"
                >
                  <img src={productsIcon} alt="Products" className="w-4 h-4" />
                </button>
                
                {/* Shops Icon */}
                <Link to="/all-vendor-stores" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4" />
                </Link>
                
                {/* Notification Bell */}
                <button 
                  onClick={() => navigate('/customer/notifications')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <img src={notifIcon} alt="Notifications" className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Cart Icon */}
                <button 
                  onClick={() => navigate('/cart')}
                  className="p-1.5 rounded-lg transition-all duration-200 relative hover:bg-gray-100"
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Cart" 
                    className={`w-4 h-4 transition-transform duration-200`} 
                  />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </button>
                
                {/* Feedback Icon with Dropdown */}
                <div className="relative feedback-dropdown">
                  <button 
                    onClick={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Feedback Options"
                  >
                    <img src={feedbackIcon} alt="Feedback" className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showFeedbackDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]">
                      <button
                        onClick={() => handleFeedbackAction('submit')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Submit Feedback
                      </button>
                      <button
                        onClick={() => handleFeedbackAction('view')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        My Feedback
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Bottom Row: Search Bar */}
            <div className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ice cream flavors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2.5 pl-8 pr-3 text-sm text-gray-700 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden sm:flex flex-row items-center justify-between mb-4 lg:mb-6 gap-4 lg:gap-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ice cream flavors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 pr-4 text-base text-gray-700 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 lg:space-x-6">
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium text-sm sm:text-base whitespace-nowrap ml-3">
                Find nearby Vendors
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                {/* Products/Flavors Icon - Navigate to customer main dashboard */}
                <button 
                  onClick={() => navigate('/customer')}
                  className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors sm:p-2"
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
                  className="p-1.5 rounded-lg transition-all duration-200 relative sm:p-2 hover:bg-gray-100"
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Cart" 
                    className={`w-4 h-4 transition-transform duration-200 sm:w-5 sm:h-5 `} 
                  />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold sm:w-5 sm:h-5">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </button>
                
                
                {/* Feedback Icon with Dropdown */}
                <div className="relative feedback-dropdown">
                  <button 
                    onClick={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2"
                    title="Feedback Options"
                  >
                    <img src={feedbackIcon} alt="Feedback" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showFeedbackDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => handleFeedbackAction('submit')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Submit Feedback
                      </button>
                      <button
                        onClick={() => handleFeedbackAction('view')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        My Feedback
                      </button>
                    </div>
                  )}
                </div>
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
                        src={getImageUrl(imageUrls[0], process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                        alt={flavor.flavor_name}
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                        }}
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
                      <div className="flex items-center space-x-1">
                        <img 
                          src={locationIcon} 
                          alt="Location" 
                          className="w-3 h-3 flex-shrink-0" 
                        />
                        <span className="text-xs text-gray-600 truncate" title={flavor.location && flavor.location !== 'Location not specified' ? flavor.location : 'Location not specified'}>
                          {flavor.location && flavor.location !== 'Location not specified' 
                            ? flavor.location 
                            : 'Location not specified'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Rating and Sold Count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <StarRating 
                          rating={parseFloat(flavor.average_rating) || 0}
                          size="xs"
                          showCount={false}
                          totalRatings={0}
                          showRating={true}
                          singleStarMode={true}
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600">
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

      {/* Drum Return Confirmation Modal */}
      {showDrumReturnModal && selectedOrderForReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Request Drum Return
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to request drum return for Order #{selectedOrderForReturn.order_id}? 
                The vendor will be notified to pick up the drum.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDrumReturnModal(false);
                    setSelectedOrderForReturn(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDrumReturn}
                  disabled={drumReturnLoading === selectedOrderForReturn.order_id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {drumReturnLoading === selectedOrderForReturn.order_id ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal (Success/Error for Reviews) */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                infoModalType === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {infoModalType === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {infoModalTitle}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {infoModalMessage}
              </p>
              
              <button
                onClick={() => setShowInfoModal(false)}
                className={`w-full font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${
                  infoModalType === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userRole="customer"
      />

    </>
  );
};

export default Customer;
