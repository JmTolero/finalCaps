import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const PAYMENT_DEADLINE_THRESHOLD_HOURS = 24;

const getReservationExpiry = (deliveryDatetime) => {
  if (!deliveryDatetime) return null;
  const deliveryDate = new Date(deliveryDatetime);
  const expiryDate = new Date(deliveryDate);
  expiryDate.setHours(expiryDate.getHours() - 24);
  return expiryDate;
};

const PaymentCountdownTimer = React.memo(({ order }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!order?.delivery_datetime) return;

    const calculateTimeRemaining = () => {
      const expiryTime = order.reservation_expires_at
        ? new Date(order.reservation_expires_at)
        : getReservationExpiry(order.delivery_datetime);

      if (!expiryTime) return;

      const now = new Date();
      const diff = expiryTime.getTime() - now.getTime();
      const hoursRemaining = diff / (1000 * 60 * 60);

      setShouldShow(hoursRemaining <= PAYMENT_DEADLINE_THRESHOLD_HOURS);

      if (hoursRemaining > PAYMENT_DEADLINE_THRESHOLD_HOURS) {
        return;
      }

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setIsExpired(false);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [order?.delivery_datetime, order?.reservation_expires_at]);

  if (!shouldShow) return null;
  if (!timeRemaining && !isExpired) return null;

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-lg sm:text-xl">⏰</span>
          <div className="flex-1">
            <p className="text-red-800 font-semibold text-xs sm:text-sm">Payment Deadline Expired</p>
            <p className="text-red-700 text-[10px] sm:text-xs">Order will be auto-cancelled soon</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3">
      <div className="flex items-center gap-2">
        <span className="text-orange-600 text-base sm:text-lg">⏰</span>
        <div className="flex-1 min-w-0">
          <p className="text-orange-800 font-semibold text-xs sm:text-sm mb-0.5">
            Payment Deadline: {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
          </p>
          <p className="text-orange-700 text-[10px] sm:text-xs">
            Pay within {timeRemaining.hours}h {timeRemaining.minutes}m or order will be auto-cancelled
          </p>
        </div>
      </div>
    </div>
  );
});

PaymentCountdownTimer.displayName = 'PaymentCountdownTimer';

export const Customer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  // Optimized navigation function to prevent back button refreshing
  const navigateOptimized = useCallback((path, options = {}) => {
    // Use replace for internal navigation to prevent back button issues
    const shouldReplace = options.replace !== false && (
      path === '/customer' || 
      path.startsWith('/customer/') ||
      path === '/cart' ||
      path === '/find-vendors' ||
      path === '/all-vendor-stores'
    );
    
    navigate(path, { 
      replace: shouldReplace,
      ...options 
    });
  }, [navigate]);
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
  const [searchInput, setSearchInput] = useState(''); // Separate input state for non-refreshing input
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
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
  
  // Cancel order confirmation modal state
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  
  // Cash on Delivery confirmation modal state
  const [showCODModal, setShowCODModal] = useState(false);
  const [codAmount, setCodAmount] = useState(null);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Feedback dropdown state
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);
  
  // Handle search button click
  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput);
  }, [searchInput]);

  // Handle Enter key press in search input
  const handleSearchKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
  }, []);
  
  // Handle feedback dropdown actions
  const handleFeedbackAction = (action) => {
    setShowFeedbackDropdown(false);
    if (action === 'submit') {
      setShowFeedbackModal(true);
    } else if (action === 'view') {
      navigateOptimized('/customer/my-feedback');
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
      <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isEditable}
            onClick={() => isEditable && setReviewRating(star)}
            onMouseEnter={() => isEditable && setHoveredStar(star)}
            onMouseLeave={() => isEditable && setHoveredStar(0)}
            className={`text-2xl sm:text-3xl md:text-4xl transition-all ${
              isEditable ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
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

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      setLocationError('Location services are not supported by your browser');
      setLocationPermissionGranted(false);
      return;
    }

    console.log('📍 Requesting user location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userPos);
        setLocationPermissionGranted(true);
        setLocationError(null); // Clear any previous errors
        console.log('✅ User location obtained:', userPos);
      },
      (error) => {
        console.error('Error getting user location:', error);
        setLocationPermissionGranted(false);
        // Set specific error messages for better UX
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Enable location to see nearest vendors.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'Unable to get your location';
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache location for 5 minutes
      }
    );
  }, []);

  // Calculate distance between two coordinates (in kilometers)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Get user location on component mount for nearest vendor sorting
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

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

  // Track if data has been loaded to prevent unnecessary refetching on back navigation
  const [dataLoaded, setDataLoaded] = useState({
    dashboard: false,
    settings: false,
    orders: false,
    notifications: false
  });

  useEffect(() => {
    // Load user data from session (only once)
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
      
      // Check vendor status if user is a vendor (only once)
      if (user.role === 'vendor') {
        checkVendorStatus(user.id);
      }
    }
    
    // Load data only if not already loaded (prevents refetching on back navigation)
    if (activeView === 'dashboard' && !dataLoaded.dashboard) {
      fetchAllFlavors();
      setDataLoaded(prev => ({ ...prev, dashboard: true }));
    }
    
    if (activeView === 'settings' && !dataLoaded.settings) {
      fetchCustomerData();
      fetchAddresses();
      setDataLoaded(prev => ({ ...prev, settings: true }));
    }
    
    if (activeView === 'orders' && !dataLoaded.orders) {
      fetchCustomerOrders();
      setDataLoaded(prev => ({ ...prev, orders: true }));
    }
    
    // Fetch notifications only if not already loaded
    if (!dataLoaded.notifications) {
      fetchUnreadCount();
      setDataLoaded(prev => ({ ...prev, notifications: true }));
    }
  }, [activeView, fetchUnreadCount, dataLoaded]);

  // Auto-refresh orders every 5 minutes when on orders view (reduced frequency to prevent navigation interference)
  useEffect(() => {
    let interval;
    
    if (activeView === 'orders' && dataLoaded.orders) {
      // Set up auto-refresh every 5 minutes for order tracking (less aggressive)
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing customer orders for status tracking...');
        fetchCustomerOrders();
      }, 300000); // 5 minutes (300 seconds) - less aggressive to prevent navigation issues
    }
    
    // Cleanup interval on component unmount or view change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeView, dataLoaded.orders]);

  // Refresh orders when filter changes to get latest data
  useEffect(() => {
    if (activeView === 'orders' && orderFilter) {
      console.log('🔄 Refreshing orders due to filter change:', orderFilter);
      fetchCustomerOrders();
    }
  }, [orderFilter, activeView]);

  // Auto-refresh customer dashboard every 5 minutes when on dashboard view (reduced frequency)
  useEffect(() => {
    let interval;
    
    if (activeView === 'dashboard' && dataLoaded.dashboard) {
      // Set up auto-refresh every 5 minutes (less aggressive)
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing customer dashboard products...');
        fetchAllFlavors(false); // Don't show loading spinner for auto-refresh
      }, 300000); // 5 minutes (300 seconds) - less aggressive to prevent navigation issues
    }
    
    // Cleanup interval on component unmount or view change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeView, dataLoaded.dashboard]);

  // Reset customer data helper function
  const resetCustomerData = useCallback(() => {
    setAddresses([]);
    setAllFlavors([]);
    setVendorStatus(null);
    // Reset data loaded state to allow fresh data loading
    setDataLoaded({
      dashboard: false,
      settings: false,
      orders: false,
      notifications: false
    });
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
        return [];
      }
      
      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/orders/customer/${user.id}`);
      
      if (response.data.success) {
        setOrders(response.data.orders);
        console.log('📦 Customer orders fetched:', response.data.orders.length);
        return response.data.orders;
      } else {
        setOrders([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setOrders([]);
      return [];
    } finally {
      setOrdersLoading(false);
    }
  };

  const handlePayment = (order) => {
    console.log('💳 Payment button clicked for order:', order.order_id);
    
    // Navigate to GCash payment page
    navigateOptimized(`/customer/gcash-account/${order.order_id}`);
  };

  // Handle selecting payment method for remaining balance (GCash or COD)
  const handleSelectRemainingPaymentMethod = async (orderId, paymentMethod) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.post(`${apiBase}/api/orders/${orderId}/select-remaining-payment-method`, {
        payment_method: paymentMethod
      });

      if (response.data.success) {
        // Update selectedOrder immediately if it's the same order
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            remaining_payment_method: paymentMethod,
            remaining_balance: response.data.remaining_balance || selectedOrder.remaining_balance
          });
        }
        
        // Refresh orders to show updated payment method
        await fetchCustomerOrders();
        
        // If GCash selected, navigate to payment page
        if (paymentMethod === 'gcash') {
          // Close modal and navigate to GCash payment for remaining balance
          setShowOrderModal(false);
          navigateOptimized(`/customer/gcash-account/${orderId}?remaining=true`);
        } else {
          // Show custom modal for COD
          setCodAmount(response.data.remaining_balance);
          setShowCODModal(true);
        }
      } else {
        // Show error info modal
        setInfoModalTitle('Payment Method Selection Failed');
        setInfoModalMessage(response.data.error || 'Failed to select payment method');
        setInfoModalType('error');
        setShowInfoModal(true);
      }
    } catch (error) {
      console.error('Error selecting payment method:', error);
      // Show error info modal
      setInfoModalTitle('Payment Method Selection Failed');
      setInfoModalMessage(error.response?.data?.error || 'Failed to select payment method. Please try again.');
      setInfoModalType('error');
      setShowInfoModal(true);
    }
  };

  // Handle paying remaining balance via GCash
  const handlePayRemainingBalance = (order) => {
    navigateOptimized(`/customer/gcash-account/${order.order_id}?remaining=true`);
  };

  // Handle cancel order button click - show confirmation modal
  const handleCancelOrderClick = (orderId) => {
    console.log('🚫 Cancel order button clicked for order:', orderId);
    setOrderToCancel(orderId);
    setShowCancelOrderModal(true);
  };

  // Handle cancel order confirmation
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setIsCancellingOrder(true);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      console.log('🚫 Making API call to:', `${apiBase}/api/orders/${orderToCancel}/status`);
      
      const response = await axios.put(`${apiBase}/api/orders/${orderToCancel}/status`, {
        status: 'cancelled'
      });
      
      console.log('🚫 API response:', response.data);
      
      if (response.data.success) {
        console.log('Order cancelled successfully:', orderToCancel);
        
        // Update selectedOrder immediately to reflect cancelled status in modal
        if (selectedOrder && selectedOrder.order_id === orderToCancel) {
          setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
        }
        
        // Refresh orders to show updated status in the list
        await fetchCustomerOrders();
        
        // Close confirmation modal
        setShowCancelOrderModal(false);
        setOrderToCancel(null);
        
        // Show success message
        setStatus({ type: 'success', message: 'Order cancelled successfully!' });
        
        // Show success info modal
        setInfoModalTitle('Order Cancelled');
        setInfoModalMessage('Your order has been cancelled successfully. The order status has been updated.');
        setInfoModalType('success');
        setShowInfoModal(true);
      } else {
        throw new Error(response.data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      console.error('Error details:', error.response?.data);
      setStatus({ type: 'error', message: `Failed to cancel order: ${error.response?.data?.error || error.message}` });
      
      // Show error info modal
      setInfoModalTitle('Cancellation Failed');
      setInfoModalMessage(error.response?.data?.error || error.message || 'Failed to cancel order. Please try again.');
      setInfoModalType('error');
      setShowInfoModal(true);
    } finally {
      setIsCancellingOrder(false);
    }
  };

  
  // const markNotificationAsRead = async (notificationId) => {
  //   try {
  //     const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
  //     await axios.put(`${apiBase}/api/notifications/${notificationId}/read`, {}, {
  //       headers: {
  //         Authorization: `Bearer ${sessionStorage.getItem('token')}`
  //       }
  //     });

  //     // // Update local state
  //     // setNotifications(prev => prev.map(n => 
  //     //   n.id === notificationId ? { ...n, is_read: true } : n
  //     // ));
      
  //     // Update unread count
  //     setUnreadCount(prev => Math.max(0, prev - 1));
      
  //     console.log(`📖 Marked notification ${notificationId} as read`);
  //   } catch (error) {
  //     console.error('Error marking notification as read:', error);
  //   }
  // };

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
        const updatedOrder = {
          ...selectedOrderForReturn,
          drum_status: 'return_requested',
          return_requested_at: new Date().toISOString()
        };
        
        // Update local state - orders list
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.order_id === selectedOrderForReturn.order_id 
              ? updatedOrder
              : o
          )
        );
        
        // Update selectedOrder if it's the same order currently being viewed
        if (selectedOrder && selectedOrder.order_id === selectedOrderForReturn.order_id) {
          setSelectedOrder(updatedOrder);
        }
        
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

  // Calculate distance for each flavor and sort by nearest vendors
  const filteredFlavors = useMemo(() => {
    let filtered = allFlavors.filter(flavor => 
      !searchTerm || (
    flavor.flavor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flavor.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (flavor.location && flavor.location.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );

    // If user location is available, calculate distances and sort by nearest
    if (userLocation && locationPermissionGranted) {
      const MAX_DISTANCE = 20; // 20km radius
      
      filtered = filtered.map(flavor => {
        const vendorLat = parseFloat(flavor.vendor_latitude);
        const vendorLng = parseFloat(flavor.vendor_longitude);
        
        if (!isNaN(vendorLat) && !isNaN(vendorLng)) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            vendorLat,
            vendorLng
          );
          return { ...flavor, distance };
        }
        return { ...flavor, distance: null };
      })
      .filter(flavor => {
        // Filter out flavors beyond 20km or without valid coordinates
        if (flavor.distance === null) return false; // Hide flavors without coordinates
        return flavor.distance <= MAX_DISTANCE; // Only show within 20km
      })
      .sort((a, b) => {
        // Sort by distance: nearest first
        return a.distance - b.distance;
      });
    }

    return filtered;
  }, [allFlavors, searchTerm, userLocation, locationPermissionGranted, calculateDistance]);

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

  useEffect(() => {
    if (vendorStatus) {
      console.log('Current vendor status:', vendorStatus);
    }
  }, [vendorStatus]);

  if (activeView === 'orders') {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-3 sm:py-4 lg:py-8 mt-16">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Orders</h1>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">Track your order status and history</p>
                  </div>
                  {/* Back Button - Right corner */}
                  <button
                    onClick={() => {
                      setActiveView('dashboard');
                      navigate('/customer');
                    }}
                    className="bg-gray-100 text-gray-700 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center gap-1 sm:gap-1.5 lg:gap-2 text-xs sm:text-sm flex-shrink-0 ml-2"
                    title="Back to Home"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline">Back</span>
                  </button>
                </div>
              </div>
              
              {/* Order Filters */}
              <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
                <div className="flex gap-1.5 sm:gap-2 pb-1 sm:pb-2 min-w-max">
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
                      className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 active:scale-95 ${
                        orderFilter === filter.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="hidden sm:inline">{filter.label}</span>
                      <span className="sm:hidden">
                        {filter.value === 'all' ? 'All' : 
                         filter.value === 'pending' ? 'Pending' :
                         filter.value === 'confirmed' ? 'Confirmed' :
                         filter.value === 'preparing' ? 'Prep' :
                         filter.value === 'out_for_delivery' ? 'Out' :
                         filter.value === 'delivered' ? 'Delivered' :
                         'Cancel'}
                      </span>
                      {filter.count > 0 && <span className="ml-1">({filter.count})</span>}
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
                  <div className="p-6 sm:p-8 lg:p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-sm sm:text-base text-gray-600">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                <div className="p-6 sm:p-8 lg:p-12 text-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">You haven't placed any orders yet.</p>
                  <button
                    onClick={() => {
                      setActiveView('dashboard');
                      navigate('/customer');
                    }}
                    className="bg-blue-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base active:scale-95"
                  >
                    Start Shopping
                  </button>
                </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-6 sm:p-8 lg:p-12 text-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 mb-2">No {orderFilter === 'all' ? 'orders' : orderFilter} orders</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {orderFilter === 'all' 
                        ? "You haven't placed any orders yet." 
                        : `No orders with status "${orderFilter.replace('_', ' ')}" found.`
                      }
                    </p>
                  </div>
                ) : (
                <div className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <div key={order.order_id} className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors active:bg-gray-100">
                      {/* Condensed Order Summary */}
                      <div className="flex flex-col space-y-3 sm:space-y-4">
                        {/* Payment Countdown Timer - Show for pending/confirmed orders with unpaid status */}
                        {((order.status === 'pending' || order.status === 'confirmed') && 
                          order.payment_status === 'unpaid' && 
                          order.delivery_datetime) && (
                          <PaymentCountdownTimer order={order} />
                        )}

                        {/* Top Row: Order ID, Status, Price */}
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                                Order #{order.order_id}
                              </h3>
                              <span className={`inline-flex px-2 sm:px-2.5 lg:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs lg:text-sm font-medium rounded-full flex-shrink-0 ${
                                order.status === 'pending' 
                                  ? 'bg-green-100 text-green-800' 
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
                                {order.status === 'pending' ? 'Confirmed' : (order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' '))}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 truncate mb-1">
                              {order.vendor_name} • {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500">
                              🕒 Delivery: {order.delivery_datetime ? (() => {
                                const deliveryDate = new Date(order.delivery_datetime);
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
                          <div className="text-right flex-shrink-0">
                            <p className="text-base sm:text-lg lg:text-xl font-bold text-green-600">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        {/* Bottom Row: Action Button */}
                        <div className="flex gap-2 sm:gap-3">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-3 lg:px-4 py-2 sm:py-1.5 lg:py-2 rounded-lg text-xs sm:text-sm transition-colors active:scale-95"
                          >
                            View Details
                          </button>
                          {((order.status === 'pending' || order.status === 'confirmed') && order.payment_status === 'unpaid') && (
                            <button
                              onClick={() => handlePayment(order)}
                              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 sm:px-3 lg:px-4 py-2 sm:py-1.5 lg:py-2 rounded-lg text-xs sm:text-sm transition-colors active:scale-95"
                            >
                              💳 Pay Now
                            </button>
                          )}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-2 sm:p-4">
            <div className="bg-white rounded-lg sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full mx-2 sm:mx-4 shadow-2xl max-h-[95vh] overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 pr-2">
                    Leave a Review
                  </h3>
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedOrderForReview(null);
                      setReviewRating(0);
                      setReviewComment('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-xl sm:text-2xl flex-shrink-0"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Shop Info */}
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">You're reviewing</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{selectedOrderForReview.vendor_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Order #{selectedOrderForReview.order_id}</p>
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                      Rate your experience <span className="text-red-500">*</span>
                    </label>
                    {renderStarRating(true)}
                    {reviewRating > 0 && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center sm:text-left">
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
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Share your thoughts (Optional)
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tell us about your experience with this shop..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {reviewComment.length}/500 characters
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedOrderForReview(null);
                        setReviewRating(0);
                        setReviewComment('');
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submittingReview}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitReview}
                      disabled={submittingReview || reviewRating === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center"
                    >
                      {submittingReview ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                          <span className="text-xs sm:text-base">Submitting...</span>
                        </>
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

        {/* Cancel Order Confirmation Modal */}
        {showCancelOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Cancel Order?
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Are you sure you want to cancel this order?
                </p>
                <p className="text-sm text-red-600 font-medium mb-6">
                  This action cannot be undone.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowCancelOrderModal(false);
                      setOrderToCancel(null);
                    }}
                    disabled={isCancellingOrder}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    No, Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancellingOrder}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCancellingOrder ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash on Delivery Confirmation Modal */}
        {showCODModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Payment Method Selected
                </h3>
                <p className="text-sm text-gray-700 mb-2 font-medium">
                  Cash on Delivery
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Please prepare <span className="font-bold text-blue-600">₱{codAmount ? parseFloat(codAmount).toFixed(2) : '0.00'}</span> cash when your order arrives.
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  The delivery person will collect the payment upon delivery.
                </p>
                
                <button
                  onClick={async () => {
                    setShowCODModal(false);
                    setCodAmount(null);
                    
                    // Refresh orders and update selectedOrder immediately
                    const updatedOrders = await fetchCustomerOrders();
                    
                    // Update selectedOrder if modal is still open with the latest order data
                    if (selectedOrder && showOrderModal && updatedOrders.length > 0) {
                      const updatedOrder = updatedOrders.find(o => o.order_id === selectedOrder.order_id);
                      if (updatedOrder) {
                        setSelectedOrder(updatedOrder);
                      }
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Modal (Success/Error for Reviews) - Orders View */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-3 lg:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowOrderModal(false);
                setSelectedOrder(null);
              }
            }}
          >
            <div className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] lg:max-h-[90vh] overflow-y-auto mx-2 sm:mx-3 lg:mx-4">
              <div className="p-3 sm:p-4 lg:p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-3 sm:mb-4 lg:mb-6 gap-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 break-words">
                      Order #{selectedOrder.order_id} Details
                    </h2>
                    {selectedOrder.status === 'cancelled' && (
                      <div className="mt-2 inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-100 border border-red-300">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-semibold text-red-800">Order Cancelled</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      setSelectedOrder(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors flex-shrink-0 p-1 -mr-1 active:scale-95"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Order Status Progression */}
                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered') && (
                  <div className="mb-3 sm:mb-4 lg:mb-6">
                    <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">Order Progress</h4>
                    <div className="flex items-center justify-between">
                      {/* Step 1: Confirmed */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                            ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <span className="text-[10px] sm:text-xs lg:text-sm">✓</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 text-center leading-tight">Confirmed</span>
                      </div>
                      
                      {/* Progress Line 1 */}
                      <div className={`flex-1 h-0.5 sm:h-1 mx-0.5 sm:mx-1 lg:mx-2 ${
                        selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                          ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      
                      {/* Step 2: Preparing */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                            ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <span className="text-[10px] sm:text-xs lg:text-sm">{selectedOrder.status === 'preparing' ? '🍦' : '✓'}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 text-center leading-tight">Preparing</span>
                      </div>
                      
                      {/* Progress Line 2 */}
                      <div className={`flex-1 h-0.5 sm:h-1 mx-0.5 sm:mx-1 lg:mx-2 ${
                        selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                          ? 'bg-purple-500' : 'bg-gray-300'
                      }`}></div>
                      
                      {/* Step 3: Out for Delivery */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered'
                            ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <span className="text-[10px] sm:text-xs lg:text-sm">{selectedOrder.status === 'out_for_delivery' ? '🚚' : '✓'}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 text-center leading-tight hidden sm:inline">Out for Delivery</span>
                        <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 text-center leading-tight sm:hidden">Out</span>
                      </div>
                      
                      {/* Progress Line 3 */}
                      <div className={`flex-1 h-0.5 sm:h-1 mx-0.5 sm:mx-1 lg:mx-2 ${
                        selectedOrder.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      
                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedOrder.status === 'delivered'
                            ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <span className="text-[10px] sm:text-xs lg:text-sm">{selectedOrder.status === 'delivered' ? '🎉' : '✓'}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 text-center leading-tight">Delivered</span>
                      </div>
                    </div>
                    
                    {/* Current Status Message */}
                    <div className="mt-2 sm:mt-3 lg:mt-4 text-center">
                      <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 px-1 sm:px-2">
                        {selectedOrder.status === 'confirmed' && 'Order confirmed! Waiting for payment to start preparation.'}
                        {selectedOrder.status === 'preparing' && '🍦 Your ice cream is being prepared!'}
                        {selectedOrder.status === 'out_for_delivery' && '🚚 Your order is on the way!'}
                        {selectedOrder.status === 'delivered' && '🎉 Order delivered successfully!'}
                      </p>
                    </div>
                  </div>
                )}
                      
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">Vendor</h4>
                    <p className="text-gray-600 text-xs sm:text-sm lg:text-base break-words">{selectedOrder.vendor_name || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">Total Amount</h4>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-green-600">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
                  </div>
                </div>
                      
                {/* Order Items Details */}
                {selectedOrder.order_items_details && (
                  <div className="mb-3 sm:mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 text-xs sm:text-sm lg:text-base">Order Items</h4>
                    <div className="bg-pink-50 rounded-lg p-3 sm:p-4">
                      <p className="text-gray-800 font-medium text-xs sm:text-sm lg:text-base break-words">{selectedOrder.order_items_details}</p>
                    </div>
                  </div>
                )}
                      
                <div className="mb-3 sm:mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-xs sm:text-sm lg:text-base">Delivery Details</h4>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">Address:</span>
                      <p className="text-gray-900 text-xs sm:text-sm lg:text-base break-words">{selectedOrder.delivery_address || 'No address specified'}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">Scheduled Date & Time:</span>
                      <p className="text-gray-900 text-xs sm:text-sm lg:text-base break-words">
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
                      
                <div className="mb-3 sm:mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-xs sm:text-sm lg:text-base">Payment</h4>
                  <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 lg:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 sm:gap-2">
                        <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Initial Payment Method:</span>
                        <span className="font-medium text-xs sm:text-sm lg:text-base">
                          {selectedOrder.payment_method?.toLowerCase() === 'gcash' || selectedOrder.payment_method?.toLowerCase() === 'gcaash' || selectedOrder.payment_method?.toLowerCase() === 'gcash_qr'
                            ? 'GCash' 
                            : selectedOrder.payment_method?.toUpperCase() || 'GCash'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 sm:gap-2">
                        <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Status:</span>
                        <span className={`font-medium text-xs sm:text-sm lg:text-base ${
                          selectedOrder.payment_status === 'unpaid' ? 'text-yellow-600' : 
                          selectedOrder.payment_status === 'paid' ? 'text-green-600' : 
                          selectedOrder.payment_status === 'partial' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {selectedOrder.payment_status?.charAt(0).toUpperCase() + selectedOrder.payment_status?.slice(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                    {/* Only show "Amount Paid" if payment_status is 'partial' or 'paid' (meaning payment was actually received) */}
                    {(selectedOrder.payment_status === 'partial' || selectedOrder.payment_status === 'paid') && 
                     selectedOrder.payment_amount && 
                     parseFloat(selectedOrder.payment_amount) > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600 text-sm sm:text-base">
                            {selectedOrder.payment_status === 'partial' ? 'Amount Paid (50%):' : 'Amount Paid:'}
                          </span>
                          <span className="font-medium text-green-600 text-sm sm:text-base">₱{parseFloat(selectedOrder.payment_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Show remaining balance if partial payment */}
                  {selectedOrder.payment_status === 'partial' && selectedOrder.remaining_balance > 0 && (
                    <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                        <span className="text-orange-800 font-medium text-xs sm:text-sm md:text-base">Remaining Balance:</span>
                        <span className="text-orange-900 font-bold text-lg sm:text-xl md:text-2xl">₱{parseFloat(selectedOrder.remaining_balance).toFixed(2)}</span>
                      </div>
                      <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-orange-700 text-xs sm:text-sm font-medium">Remaining Payment Method:</span>
                        <span className="text-orange-800 text-xs sm:text-sm md:text-base font-semibold">
                          {selectedOrder.remaining_payment_method 
                            ? selectedOrder.remaining_payment_method.toUpperCase() 
                            : 'Not Selected'}
                        </span>
                      </div>
                      {selectedOrder.status === 'delivered' && !selectedOrder.remaining_payment_method && (
                        <p className="text-xs sm:text-sm text-orange-700 mt-2 sm:mt-3 italic">
                          Payment method was not selected. If you haven't paid yet, please contact the vendor.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                      
                {/* Payment Method Selection for Remaining Balance */}
                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery') && 
                 selectedOrder.payment_status === 'partial' && 
                 selectedOrder.remaining_balance > 0 && 
                 !selectedOrder.remaining_payment_method && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 md:p-5 mb-4">
                    <p className="text-blue-800 font-medium mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">Choose Payment Method for Remaining Balance</p>
                    <p className="text-blue-700 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 leading-relaxed">
                      {selectedOrder.status === 'out_for_delivery' 
                        ? `Your order is on the way! Choose how you'd like to pay the remaining balance of ₱${parseFloat(selectedOrder.remaining_balance).toFixed(2)}:`
                        : `Choose how you'd like to pay the remaining balance of ₱${parseFloat(selectedOrder.remaining_balance).toFixed(2)} when your order is delivered:`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
                      <button 
                        onClick={() => handleSelectRemainingPaymentMethod(selectedOrder.order_id, 'gcash')}
                        className="bg-green-600 text-white px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm sm:text-base flex flex-col items-center justify-center space-y-1.5 sm:space-y-1 min-h-[60px] sm:min-h-0"
                      >
                        <span className="font-semibold">Pay via GCash</span>
                        <span className="text-xs opacity-90">Pay Now</span>
                      </button>
                      <button 
                        onClick={() => handleSelectRemainingPaymentMethod(selectedOrder.order_id, 'cod')}
                        className="bg-blue-600 text-white px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base flex flex-col items-center justify-center space-y-1.5 sm:space-y-1 min-h-[60px] sm:min-h-0"
                      >
                        <span className="font-semibold">Cash on Delivery</span>
                        <span className="text-xs opacity-90">Pay when arrives</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Remaining Balance Payment Actions (If payment method already selected) */}
                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery') && 
                 selectedOrder.payment_status === 'partial' && 
                 selectedOrder.remaining_balance > 0 && 
                 selectedOrder.remaining_payment_method === 'gcash' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 md:p-5 mb-4">
                    <p className="text-green-800 font-medium mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">Remaining Balance Due</p>
                    <div className="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2">
                      <p className="text-green-700 text-xs sm:text-sm md:text-base">
                        <span className="font-medium">Payment method:</span> GCash
                      </p>
                      <p className="text-green-700 text-xs sm:text-sm md:text-base">
                        <span className="font-medium">Amount:</span> <span className="font-bold text-base sm:text-lg md:text-xl">₱{parseFloat(selectedOrder.remaining_balance).toFixed(2)}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handlePayRemainingBalance(selectedOrder)}
                      className="bg-green-600 text-white px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm sm:text-base md:text-lg font-semibold w-full sm:w-auto flex items-center justify-center space-x-2 min-h-[48px] sm:min-h-0"
                    >
                      <span className="text-lg sm:text-xl">💳</span>
                      <span>Pay Remaining Balance via GCash</span>
                    </button>
                  </div>
                )}

                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery') && 
                 selectedOrder.payment_status === 'partial' && 
                 selectedOrder.remaining_balance > 0 && 
                 selectedOrder.remaining_payment_method === 'cod' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 md:p-5 mb-4">
                    <p className="text-blue-800 font-medium mb-2 sm:mb-3 text-sm sm:text-base md:text-lg flex items-center space-x-2">
                      <span>💰</span>
                      <span>Cash on Delivery Selected</span>
                    </p>
                    <p className="text-blue-700 text-xs sm:text-sm md:text-base leading-relaxed">
                      You've selected Cash on Delivery. Please prepare <span className="font-bold text-base sm:text-lg">₱{parseFloat(selectedOrder.remaining_balance).toFixed(2)}</span> cash when your order arrives. The delivery person will collect the payment.
                    </p>
                  </div>
                )}

                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'awaiting_payment') && selectedOrder.payment_status === 'unpaid' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 md:p-5">
                    <p className="text-green-800 font-medium mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">Payment Required</p>
                    <p className="text-green-700 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 leading-relaxed">
                      Please proceed with payment via GCash to confirm your order. The vendor will start preparing your ice cream once payment is received.
                    </p>
                    <button 
                      onClick={() => handlePayment(selectedOrder)}
                      className="bg-green-600 text-white px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm sm:text-base md:text-lg font-semibold w-full sm:w-auto flex items-center justify-center space-x-2 min-h-[48px] sm:min-h-0"
                    >
                      <span className="text-lg sm:text-xl">💳</span>
                      <span>Pay Now via GCash</span>
                    </button>
                  </div>
                )}

                {/* Show generic "Order Confirmed" for pending orders only if payment_amount is NOT set (full payment orders) */}
                {/* If payment_amount is set, the more specific section below will handle it */}
                {selectedOrder.status === 'pending' && 
                 (!selectedOrder.payment_amount || parseFloat(selectedOrder.payment_amount || 0) === 0 || parseFloat(selectedOrder.payment_amount) >= parseFloat(selectedOrder.total_amount)) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 md:p-5">
                    <div className="flex flex-col mb-3 sm:mb-4 space-y-3">
                      <div className="flex-1">
                        <p className="text-green-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base md:text-lg">✅ Order Confirmed</p>
                        <p className="text-green-700 text-xs sm:text-sm md:text-base leading-relaxed">
                          Your order has been confirmed! {selectedOrder.payment_status === 'partial' && selectedOrder.remaining_balance > 0
                            ? 'Please pay the remaining balance now to start preparation.'
                            : 'Please pay now to start preparation.'}
                        </p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 w-full">
                        {(selectedOrder.payment_status === 'unpaid' || 
                          (selectedOrder.payment_status === 'partial' && selectedOrder.remaining_balance > 0)) && (
                          <button 
                            onClick={() => {
                              if (selectedOrder.payment_status === 'partial' && selectedOrder.remaining_balance > 0) {
                                // If partial payment and remaining balance exists, check if payment method is selected
                                if (selectedOrder.remaining_payment_method === 'gcash') {
                                  handlePayRemainingBalance(selectedOrder);
                                } else {
                                  handleSelectRemainingPaymentMethod(selectedOrder.order_id, 'gcash');
                                }
                              } else {
                                handlePayment(selectedOrder);
                              }
                            }}
                            className="bg-green-600 text-white px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base md:text-lg font-semibold w-full md:flex-1 min-h-[48px] sm:min-h-0"
                          >
                            <span className="text-lg sm:text-xl">💳</span>
                            <span>{selectedOrder.payment_status === 'partial' ? 'Pay Now via GCash' : 'Pay via GCash'}</span>
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            console.log('🚫 Cancel button clicked for order:', selectedOrder.order_id);
                            handleCancelOrderClick(selectedOrder.order_id);
                          }}
                          className="bg-red-600 text-white px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base md:text-lg font-semibold w-full md:flex-1 min-h-[48px] sm:min-h-0"
                        >
                          <span className="text-lg sm:text-xl">❌</span>
                          <span>Cancel Order</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-green-600 text-xs sm:text-sm md:text-base leading-relaxed">
                      {selectedOrder.payment_status === 'partial' && selectedOrder.remaining_balance > 0
                        ? `Remaining balance: ₱${parseFloat(selectedOrder.remaining_balance).toFixed(2)}. Pay now to proceed.`
                        : 'Order was automatically confirmed because drums were available. Pay now to proceed.'}
                    </p>
                  </div>
                )}

                {/* Pay Now button for orders with payment_amount set (50% option) but payment_status is 'unpaid' (clicked Pay Later) */}
                {/* This means 50% payment option was selected but no payment was made yet */}
                {/* Payment Countdown Timer in Modal */}
                {((selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && 
                  selectedOrder.payment_status === 'unpaid' && 
                  selectedOrder.delivery_datetime) && (
                  <div className="mb-3 sm:mb-4">
                    <PaymentCountdownTimer order={selectedOrder} />
                  </div>
                )}

                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'pending') && 
                 selectedOrder.payment_status === 'unpaid' && 
                 selectedOrder.payment_amount && 
                 parseFloat(selectedOrder.payment_amount) > 0 &&
                 parseFloat(selectedOrder.payment_amount) < parseFloat(selectedOrder.total_amount) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 lg:p-5 mb-3 sm:mb-4">
                    {/* Payment Method and Status Header */}
                    <div className="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-gray-700">Initial Payment Method:</span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">
                            {selectedOrder.payment_method?.toLowerCase() === 'gcash' || selectedOrder.payment_method?.toLowerCase() === 'gcaash' || selectedOrder.payment_method?.toLowerCase() === 'gcash_qr'
                              ? 'GCash' 
                              : selectedOrder.payment_method?.toUpperCase() || 'GCash'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-gray-700">Status:</span>
                          <span className="text-xs sm:text-sm font-semibold text-orange-600">Unpaid</span>
                        </div>
                      </div>
                    </div>

                    {/* Warning Section */}
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <span className="text-lg sm:text-xl lg:text-2xl flex-shrink-0">⏳</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-yellow-800 font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Order Not Yet Confirmed</p>
                          <p className="text-yellow-700 text-xs sm:text-sm lg:text-base leading-relaxed">
                            Your order has not yet been confirmed! Please pay the initial 50% payment now to be confirmed by vendor.
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                        <button 
                          onClick={() => handlePayment(selectedOrder)}
                          className="flex-1 bg-green-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-semibold min-h-[44px] sm:min-h-[48px] active:scale-95"
                        >
                          <span className="text-base sm:text-lg lg:text-xl">💳</span>
                          <span>Pay Now via GCash</span>
                        </button>
                        <button 
                          onClick={() => {
                            console.log('🚫 Cancel button clicked for order:', selectedOrder.order_id);
                            handleCancelOrderClick(selectedOrder.order_id);
                          }}
                          className="flex-1 bg-red-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-semibold min-h-[44px] sm:min-h-[48px] active:scale-95"
                        >
                          <span className="text-base sm:text-lg lg:text-xl">❌</span>
                          <span>Cancel Order</span>
                        </button>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3 lg:p-4">
                      <p className="text-green-700 text-xs sm:text-sm lg:text-base leading-relaxed">
                        Initial payment (50%): <span className="font-bold text-green-800">₱{parseFloat(selectedOrder.total_amount * 0.5).toFixed(2)}</span>. Pay now to proceed. Remaining balance will be collected on delivery.
                      </p>
                    </div>
                  </div>
                )}


                {selectedOrder.status === 'delivered' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 md:p-5">
                    <div className="flex flex-col mb-3 sm:mb-4 space-y-3">
                      <div className="flex-1">
                        <p className="text-blue-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base md:text-lg">🎉 Order Delivered Successfully!</p>
                        <p className="text-blue-700 text-xs sm:text-sm md:text-base leading-relaxed">Your ice cream order has been delivered. Enjoy!</p>
                      </div>
                      {selectedOrder.drum_status === 'return_requested' ? (
                        <span className="inline-flex px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base font-medium rounded-full bg-yellow-100 text-yellow-800 w-full sm:w-auto justify-center">
                          📦 Return Requested
                        </span>
                      ) : selectedOrder.drum_status === 'returned' ? (
                        <span className="inline-flex px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base font-medium rounded-full bg-green-100 text-green-800 w-full sm:w-auto justify-center">
                          ✅ Container Returned
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleDrumReturn(selectedOrder)}
                          disabled={drumReturnLoading === selectedOrder.order_id}
                          className="bg-orange-600 text-white px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg hover:bg-orange-700 active:bg-orange-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base md:text-lg font-semibold w-full sm:w-auto min-h-[48px] sm:min-h-0"
                        >
                          {drumReturnLoading === selectedOrder.order_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                              <span>Requesting...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-lg sm:text-xl">📦</span>
                              <span>Return Container</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {selectedOrder.drum_status === 'return_requested' && (
                      <p className="text-blue-600 text-xs sm:text-sm md:text-base leading-relaxed">
                        The vendor has been notified to pick up the container. They will contact you to schedule the pickup.
                      </p>
                    )}
                  </div>
                )}

                {/* Review Section - Only for delivered orders */}
                {selectedOrder.status === 'delivered' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 md:p-5 mt-4">
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
                      <div className="flex flex-col mb-3 sm:mb-4 space-y-3">
                        <div className="flex-1">
                          <p className="text-blue-800 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base md:text-lg">
                            ⭐ How was your experience?
                          </p>
                          <p className="text-blue-700 text-xs sm:text-sm md:text-base leading-relaxed">
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
                          className="bg-blue-600 text-white px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base md:text-lg font-semibold w-full sm:w-auto min-h-[48px] sm:min-h-0"
                        >
                          <span className="text-lg sm:text-xl">⭐</span>
                          <span>Leave Review</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedOrder.status === 'cancelled' && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 sm:p-4 lg:p-5 mb-3 sm:mb-4">
                    <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        {selectedOrder.decline_reason ? (
                          <>
                            <p className="text-red-900 font-bold text-sm sm:text-base lg:text-lg mb-1.5 sm:mb-2">❌ Order Declined by Vendor</p>
                            <p className="text-red-800 text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 leading-relaxed">This order has been declined by the vendor and cannot be processed.</p>
                            <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 lg:p-4 bg-red-100 border border-red-200 rounded-lg">
                              <p className="text-red-900 text-xs sm:text-sm lg:text-base font-semibold mb-1.5 sm:mb-2">Reason for decline:</p>
                              <p className="text-red-800 text-xs sm:text-sm lg:text-base break-words leading-relaxed">{selectedOrder.decline_reason}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-red-900 font-bold text-sm sm:text-base lg:text-lg mb-1.5 sm:mb-2">❌ Order Cancelled</p>
                            <p className="text-red-800 text-xs sm:text-sm lg:text-base mb-2 leading-relaxed">This order has been cancelled successfully.</p>
                            <p className="text-red-700 text-[10px] sm:text-xs lg:text-sm italic leading-relaxed">
                              The order was cancelled on {selectedOrder.updated_at ? new Date(selectedOrder.updated_at).toLocaleString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'recently'}.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-red-200">
                      <p className="text-red-700 text-[10px] sm:text-xs lg:text-sm leading-relaxed">
                        💡 <strong>Note:</strong> If you made a payment, please contact support for refund processing.
                      </p>
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
                    className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto min-h-[44px] sm:min-h-0 active:scale-95"
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
                  title="Find nearby Vendors"
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
                      navigateOptimized('/customer');
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      location.pathname === '/customer' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                    title="Products & Flavors"
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
                    title="All Vendor Stores"
                  >
                    <img src={shopsIcon} alt="Shops" className="w-4 h-4" />
                  </Link>

                  {/* Notification Bell */}
                  <button 
                    onClick={() => navigateOptimized('/customer/notifications')}
                    className={`p-1.5 rounded-lg transition-colors relative ${
                      location.pathname === '/customer/notifications' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                    title="Notifications"
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
                    onClick={() => navigateOptimized('/cart')}
                    className={`p-1.5 rounded-lg transition-colors relative ${
                      location.pathname === '/cart' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in favorites`}
                  >
                    <img src={cartIcon} alt="Favorites" className="w-4 h-4" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </button>
                  
                  {/* Feedback Icon with Dropdown */}
                  <div className="relative feedback-dropdown">
                    <button 
                      onClick={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        location.pathname === '/customer/feedback' 
                          ? 'bg-blue-100 hover:bg-blue-200' 
                          : 'hover:bg-gray-100'
                      }`}
                      title="Feedback Options"
                    >
                      <img src={feedbackIcon} alt="Feedback" className="w-4 h-4" />
                    </button>
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

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-end mb-3 sm:mb-4 lg:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base" title="Find nearby Vendors">
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
                    title="All Vendor Stores"
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
                    title="Notifications"
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
                    title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in favorites`}
                  >
                    <img 
                      src={cartIcon} 
                      alt="Favorites" 
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

        <FeedbackModal 
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          userRole="customer"
        />
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
              <Link to="/find-vendors" className="p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm" title="Find nearby Vendors">
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
                <Link to="/all-vendor-stores" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="All Vendor Stores">
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4" />
                </Link>
                
                {/* Notification Bell */}
                <button 
                  onClick={() => navigate('/customer/notifications')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative"
                  title="Notifications"
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
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in favorites`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Favorites" 
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
              <div className="relative flex">
                <input
                  type="text"
                  placeholder="Search ice cream flavors..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="flex-1 px-3 py-2.5 pl-8 pr-3 text-sm text-gray-700 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-r-0"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Search"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="ml-2 px-3 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    title="Clear Search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden sm:flex flex-row items-center justify-between mb-4 lg:mb-6 gap-4 lg:gap-6">
            <div className="flex-1 max-w-md">
              <div className="relative flex">
                <input
                  type="text"
                  placeholder="Search ice cream flavors..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="flex-1 px-4 py-3 pl-10 pr-4 text-base text-gray-700 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-r-0"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="ml-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    title="Clear Search"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 lg:space-x-6">
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium text-sm sm:text-base whitespace-nowrap ml-3" title="Find nearby Vendors">
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
                <Link to="/all-vendor-stores" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2" title="All Vendor Stores">
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                
                {/* Notification Bell */}
                <button 
                  onClick={() => navigate('/customer/notifications')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative sm:p-2"
                  title="Notifications"
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
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in favorites`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Favorites" 
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
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">DISCOVER FLAVORS</h1>
            {userLocation && locationPermissionGranted && (
              <span className="text-xs sm:text-sm text-blue-600 font-medium flex items-center gap-1">
                <img src={locationIcon} alt="Location" className="w-4 h-4" />
                Sorted by nearest
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
            {userLocation && locationPermissionGranted 
              ? "Explore delicious ice cream from nearest vendors" 
              : "Explore delicious ice cream from local vendors"}
          </p>
          {/* Show helpful message if location is not available */}
          {!userLocation && locationError && (
            <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-blue-600">📍</span>
                <span className="text-xs text-blue-700">{locationError}</span>
              </div>
              <button
                onClick={() => {
                  setLocationError(null);
                  getUserLocation();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Try again
              </button>
            </div>
          )}
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

                    {/* Location and Distance */}
                    <div className="text-left space-y-1">
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
                      {/* Distance display */}
                      {flavor.distance !== null && flavor.distance !== undefined && userLocation && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-semibold text-blue-600">
                            {flavor.distance < 1 
                              ? `${Math.round(flavor.distance * 1000)}m away` 
                              : `${flavor.distance.toFixed(1)}km away`}
                          </span>
                        </div>
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
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
