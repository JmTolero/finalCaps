import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav';
import { useCart } from '../../contexts/CartContext';
import FeedbackModal from '../../components/shared/FeedbackModal';
import axios from 'axios';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';
import findNearbyIcon from '../../assets/images/vendordashboardicon/findnearby.png';

// Payment deadline constants and helper functions
const PAYMENT_DEADLINE_THRESHOLD_HOURS = 24;

const getReservationExpiry = (deliveryDatetime) => {
  if (!deliveryDatetime) return null;
  const deliveryDate = new Date(deliveryDatetime);
  const expiryDate = new Date(deliveryDate);
  expiryDate.setHours(expiryDate.getHours() - 24);
  return expiryDate;
};

const PaymentCountdownTimer = React.memo(({ order, onExpired }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const hasTriggeredExpiryRef = useRef(false);
  const lastOrderIdRef = useRef(null);

  useEffect(() => {
    if (!order?.delivery_datetime || !order?.order_id) return;

    if (lastOrderIdRef.current !== order.order_id) {
      lastOrderIdRef.current = order.order_id;
      hasTriggeredExpiryRef.current = false;
    }

    const calculateTimeRemaining = () => {
      let expiryTime = order.reservation_expires_at
        ? new Date(order.reservation_expires_at)
        : null;

      const expectedExpiry = getReservationExpiry(order.delivery_datetime);

      if (!expiryTime && expectedExpiry) {
        expiryTime = expectedExpiry;
      } else if (expiryTime && expectedExpiry) {
        const diffMs = Math.abs(expiryTime.getTime() - expectedExpiry.getTime());
        const toleranceMs = 60 * 1000;
        if (diffMs > toleranceMs) {
          expiryTime = expectedExpiry;
        }
      }

      if (!expiryTime) return;

      const now = new Date();
      const diff = expiryTime.getTime() - now.getTime();
      const hoursRemaining = diff / (1000 * 60 * 60);

      setShouldShow(hoursRemaining <= PAYMENT_DEADLINE_THRESHOLD_HOURS);

      if (hoursRemaining > PAYMENT_DEADLINE_THRESHOLD_HOURS) {
        if (hasTriggeredExpiryRef.current) {
          hasTriggeredExpiryRef.current = false;
        }
        return;
      }

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });

        if (!hasTriggeredExpiryRef.current) {
          hasTriggeredExpiryRef.current = true;
          if (typeof onExpired === 'function') {
            onExpired(order);
          }
        }
        return;
      }

      setIsExpired(false);
      if (hasTriggeredExpiryRef.current) {
        hasTriggeredExpiryRef.current = false;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [order, order?.delivery_datetime, order?.reservation_expires_at, order?.order_id, onExpired]);

  if (!shouldShow) return null;
  if (!timeRemaining && !isExpired) return null;

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-3">
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

  const formatTimeUnit = (value) => String(value).padStart(2, '0');

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3 mb-3">
      <div className="flex items-center gap-2">
        <span className="text-orange-600 text-base sm:text-lg">⏰</span>
        <div className="flex-1 min-w-0">
          <p className="text-orange-800 font-semibold text-xs sm:text-sm mb-0.5">
            Payment Deadline: {formatTimeUnit(timeRemaining.hours)}h {formatTimeUnit(timeRemaining.minutes)}m {formatTimeUnit(timeRemaining.seconds)}s
          </p>
          <p className="text-orange-700 text-[10px] sm:text-xs">
            Pay within {formatTimeUnit(timeRemaining.hours)}h {formatTimeUnit(timeRemaining.minutes)}m {formatTimeUnit(timeRemaining.seconds)}s or order will be auto-cancelled
          </p>
        </div>
      </div>
    </div>
  );
});

PaymentCountdownTimer.displayName = 'PaymentCountdownTimer';

export const Notifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const [customerData, setCustomerData] = useState({
    fname: '',
    lname: '',
    email: '',
    contact_no: '',
    role: 'customer'
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('notifications'); // 'notifications' or 'orders'
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [drumReturnLoading, setDrumReturnLoading] = useState(null);
  const [showDrumReturnModal, setShowDrumReturnModal] = useState(false);
  const [showDrumReturnSuccessModal, setShowDrumReturnSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  
  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalType, setInfoModalType] = useState('success'); // 'success' or 'error'
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Feedback dropdown state
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);

  // Cancel order modal state
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

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

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        setNotifications([]);
        return;
      }
      
      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/notifications/customer/${user.id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const transformedNotifications = response.data.notifications.map(notification => ({
          id: notification.id,
          type: getNotificationType(notification.notification_type),
          title: notification.title,
          description: notification.message,
          timestamp: new Date(notification.created_at),
          isRead: notification.is_read,
          image: getNotificationIcon(notification.notification_type),
          related_order_id: notification.related_order_id,
          vendor_name: notification.vendor_name,
          customer_name: notification.customer_name
        }));
        
        setNotifications(transformedNotifications);
        console.log('📬 Fetched real notifications:', transformedNotifications.length);
      } else {
        console.error('Failed to fetch notifications:', response.data.error);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
    }
    
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset modal states when component mounts or unmounts
  useEffect(() => {
    setShowDrumReturnModal(false);
    setShowDrumReturnSuccessModal(false);
    setShowErrorModal(false);
    setSelectedOrderForReturn(null);
    setShowReviewModal(false);
    setShowInfoModal(false);
    setSelectedOrder(null);
    
    // Cleanup function when component unmounts
    return () => {
      setShowReviewModal(false);
      setShowInfoModal(false);
      setShowOrderDetails(false);
    };
  }, []);
  
  // Reset modals when switching between views
  useEffect(() => {
    setShowReviewModal(false);
    setShowInfoModal(false);
  }, [activeView]);


  // Helper function to map notification types
  const getNotificationType = (notificationType) => {
    const typeMap = {
      'order_placed': 'order',
      'order_accepted': 'order',
      'order_rejected': 'order',
      'order_preparing': 'order',
      'order_ready': 'delivery',
      'order_delivered': 'delivery',
      'order_cancelled': 'order',
      'payment_confirmed': 'payment',
      'payment_failed': 'payment',
      'drum_return_requested': 'drum',
      'drum_picked_up': 'drum',
      'system_announcement': 'promotion'
    };
    return typeMap[notificationType] || 'order';
  };

  // Helper function to get notification icons
  const getNotificationIcon = (notificationType) => {
    const iconMap = {
      'order_placed': '📦',
      'order_accepted': '✅',
      'order_rejected': '❌',
      'order_preparing': '👨‍🍳',
      'order_ready': '🚚',
      'order_delivered': '🎉',
      'order_cancelled': '❌',
      'payment_confirmed': '💳',
      'payment_failed': '❌',
      'drum_return_requested': '🥁',
      'drum_picked_up': '✅',
      'system_announcement': '📢'
    };
    return iconMap[notificationType] || '📦';
  };

  const markAllAsRead = async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.put(`${apiBase}/api/notifications/customer/${user.id}/mark-all-read`, {}, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        console.log('📖 Marked all notifications as read');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Mark individual notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.put(`${apiBase}/api/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Update local state to mark this notification as read
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        console.log('📖 Marked notification as read:', notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    console.log('🔔 Notification clicked:', notification);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.related_order_id) {
      // Switch to orders view
      setActiveView('orders');
      
      // Fetch fresh orders and find the specific one
      const fetchedOrders = await fetchOrders();
      
      // Find the specific order
      const order = fetchedOrders.find(o => o.order_id === notification.related_order_id);
      
      if (order) {
        console.log('📦 Opening order details for order:', notification.related_order_id);
        // Small delay to ensure view transition is complete
        setTimeout(() => {
          setSelectedOrder(order);
          setShowOrderDetails(true);
        }, 100);
      } else {
        console.warn('Order not found:', notification.related_order_id);
      }
    } else if (notification.type === 'order') {
      // Generic order notification without specific order_id
      handleViewOrder();
    } else if (notification.type === 'profile') {
      handleViewProfile();
    }
  };

  const fetchOrders = async () => {
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
        console.log('📦 Orders fetched:', response.data.orders.length);
        return response.data.orders;
      } else {
        setOrders([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      return [];
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleViewOrder = () => {
    setActiveView('orders');
    fetchOrders();
  };

  const handleViewProfile = () => {
    navigate('/customer?view=settings');
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  // Submit shop review
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
    
    if (!selectedOrder) return;
    
    try {
      setSubmittingReview(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');
      
      const response = await axios.post(
        `${apiBase}/api/reviews`,
        {
          order_id: selectedOrder.order_id,
          vendor_id: selectedOrder.vendor_id,
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
        
        // Close modals and reset
        setShowReviewModal(false);
        setShowOrderDetails(false);
        setReviewRating(0);
        setReviewComment('');
        setSelectedOrder(null);
        
        // Refresh orders
        fetchOrders();
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

  const handlePayment = (order) => {
    console.log('💳 Payment button clicked for order:', order.order_id);
    
    // Check if this is for remaining balance payment
    const isRemainingPayment = order.payment_status === 'partial' && 
                                order.remaining_balance > 0 && 
                                order.remaining_payment_method?.toLowerCase() === 'gcash';
    
    // Navigate to integrated GCash payment page with remaining=true if paying remaining balance
    if (isRemainingPayment) {
      navigate(`/customer/integrated-gcash-payment/${order.order_id}?remaining=true`);
    } else {
      navigate(`/customer/integrated-gcash-payment/${order.order_id}`);
    }
  };

  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setShowCancelOrderModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    setIsCancellingOrder(true);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(
        `${apiBase}/api/orders/${orderToCancel.order_id}/status`,
        { 
          status: 'cancelled',
          decline_reason: 'Cancelled by customer'
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Close cancel modal
        setShowCancelOrderModal(false);
        setOrderToCancel(null);
        
        // Show success message
        setInfoModalTitle('Order Cancelled ✅');
        setInfoModalMessage(`Order #${orderToCancel.order_id} has been cancelled successfully. Your reserved items have been released.`);
        setInfoModalType('success');
        setShowInfoModal(true);
        
        // Close order details modal
        setShowOrderDetails(false);
        setSelectedOrder(null);
        
        // Refresh orders list
        fetchOrders();
      } else {
        throw new Error(response.data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setShowCancelOrderModal(false);
      setInfoModalTitle('Cancellation Failed');
      setInfoModalMessage(error.response?.data?.error || error.message || 'Failed to cancel order. Please try again.');
      setInfoModalType('error');
      setShowInfoModal(true);
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    // For older notifications, show the actual date in Philippine timezone
    try {
      return time.toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return `${diffInDays} days ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <NavWithLogo />
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-6 lg:py-8 mt-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-end mb-3 sm:mb-4 lg:mb-6 relative">
            {/* Mobile: Find nearby Vendors icon in absolute top-left corner */}
            <Link 
              to="/find-vendors" 
              className="absolute left-0 top-0 p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm sm:hidden z-10"
              title="Find nearby Vendors"
            >
              <img 
                src={findNearbyIcon} 
                alt="Find nearby Vendors" 
                className="w-5 h-5" 
              />
            </Link>
            
            {/* Desktop: Find nearby Vendors text grouped with navigation icons */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Desktop: Find nearby Vendors text */}
              <Link 
                to="/find-vendors" 
                className="hidden sm:inline text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base"
                title="Find nearby Vendors"
              >
                Find nearby Vendors
              </Link>
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                {/* Products/Flavors Icon */}
                <button 
                  onClick={() => navigate('/customer')}
                  className={`p-1.5 rounded-lg transition-colors sm:p-2 ${
                    location.pathname === '/customer' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Products & Flavors"
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
                
                {/* Notification Bell - Active on notifications page */}
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
                  className={`p-1.5 rounded-lg transition-all duration-200 relative sm:p-2 ${
                    location.pathname === '/cart'
                      ? 'bg-blue-100 hover:bg-blue-200 shadow-sm' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Favorites" 
                    className="w-4 h-4 transition-transform duration-200 sm:w-5 sm:h-5" 
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

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-3 sm:py-4 lg:py-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {/* Left Sidebar - User Profile and Navigation */}
            <div className="lg:col-span-1">
              {/* Mobile: Horizontal Navigation Tabs */}
              <div className="lg:hidden mb-3 sm:mb-4">
                <div className="bg-white rounded-lg shadow-sm p-2 sm:p-3">
                  {/* User Profile - Mobile */}
                  <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-200">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{customerData.fname} {customerData.lname}</h3>
                      <button
                        onClick={handleViewProfile}
                        className="text-blue-600 hover:text-blue-800 text-xs mt-0.5"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                  
                  {/* Mobile Navigation Tabs */}
                  <div className="flex space-x-2 overflow-x-auto">
                    <button 
                      onClick={handleViewProfile}
                      className="flex-shrink-0 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors text-xs sm:text-sm border border-blue-200"
                    >
                      My Account
                    </button>
                    <button
                      onClick={handleViewOrder}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                        activeView === 'orders' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' 
                      }`}
                    >
                      My Order
                    </button>
                    <button 
                      onClick={() => setActiveView('notifications')}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                        activeView === 'notifications' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      Notifications
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop: Vertical Sidebar */}
              <div className="hidden lg:block">
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-20 sm:top-24">
                  {/* User Profile Section */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{customerData.fname} {customerData.lname}</h3>
                    <button
                      onClick={handleViewProfile}
                      className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm mt-1"
                    >
                      Edit Profile
                    </button>
                  </div>

                  {/* Navigation Menu */}
                  <div className="space-y-1 sm:space-y-2">
                    <button 
                      onClick={handleViewProfile}
                      className="w-full text-left px-3 py-2 sm:px-4 sm:py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm sm:text-base border-2 border-blue-200"
                    >
                      My Account
                    </button>
                    <button
                      onClick={handleViewOrder}
                      className={`w-full text-left px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        activeView === 'orders' 
                          ? 'bg-blue-600 text-white border-2 border-blue-600' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200' 
                      }`}
                    >
                      My Order
                    </button>
                    <button 
                      onClick={() => setActiveView('notifications')}
                      className={`w-full text-left px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        activeView === 'notifications' 
                          ? 'bg-blue-600 text-white border-2 border-blue-600' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200'
                      }`}
                    >
                      Notifications
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm">
                {/* Header */}
                <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                      {activeView === 'notifications' 
                        ? (
                          <span>
                            Your Notifications 
                            {unreadCount > 0 && (
                              <span className="text-sm sm:text-base"> ({unreadCount} unread)</span>
                            )}
                          </span>
                        )
                        : 'My Orders'
                      }
                    </h2>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {activeView === 'orders' && (
                        <button
                          onClick={() => navigate('/customer?view=orders')}
                          className="px-3 py-1.5 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors active:scale-95"
                        >
                          View More
                        </button>
                      )}
                      {activeView === 'notifications' && unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium active:scale-95"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content List */}
                <div className="divide-y divide-gray-200 max-h-[calc(100vh-280px)] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
                  {activeView === 'notifications' ? (
                    // Notifications Content
                    loading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-4xl mb-4">🔔</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                        <p className="text-gray-600">You'll see updates about your orders and account here</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`group p-3 sm:p-4 lg:p-6 hover:bg-blue-100 hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${
                            !notification.isRead 
                              ? 'bg-blue-50 border-blue-500' 
                              : 'border-transparent hover:border-blue-300'
                          }`}
                          title="Click to view order details"
                        >
                          <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                            {/* Notification Image */}
                            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                              <span className="text-lg sm:text-xl lg:text-2xl">{notification.image}</span>
                            </div>
                            
                            {/* Notification Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                                    {notification.title}
                                  </h3>
                                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-2 sm:mb-3 lg:mb-4 line-clamp-2">
                                    {notification.description}
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering parent onClick
                                        if (notification.type === 'order') {
                                          handleViewOrder();
                                        } else if (notification.type === 'profile') {
                                          handleViewProfile();
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium underline"
                                    >
                                      view details
                                    </button>
                                    <span className="text-xs sm:text-sm text-gray-500">
                                      {formatTimeAgo(notification.timestamp)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Unread Indicator & Click Arrow */}
                                <div className="flex flex-col items-end gap-2">
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                  )}
                                  <svg 
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    // Orders Content
                    ordersLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading orders...</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-4xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-600">You haven't placed any orders yet.</p>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div
                          key={order.order_id}
                          className="p-3 sm:p-4 lg:p-5 hover:bg-gray-50 transition-colors active:bg-gray-100"
                        >
                          <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                            {/* Order Icon */}
                            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-lg sm:text-xl lg:text-2xl">📦</span>
                            </div>
                            
                            {/* Order Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                                      Order #{order.order_id}
                                    </h3>
                                    <span className="text-xs sm:text-sm text-gray-500 ml-2 flex-shrink-0">
                                      {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-2 sm:mb-3 truncate">
                                    {order.vendor_name} • ₱{parseFloat(order.total_amount).toFixed(2)}
                                  </p>
                                  
                                  {/* Order Status & Tracking */}
                                  <div className="mb-2 sm:mb-3">
                                    <span className={`inline-flex px-2.5 py-1 text-xs sm:text-sm font-medium rounded-full mb-2 ${
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
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                                    </span>
                                    
                                    {/* Tracking Progress Bar */}
                                    <div className="mt-2 sm:mt-3">
                                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] lg:text-xs text-gray-500 mb-1.5 sm:mb-2">
                                        <span className={`${order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''} truncate`}>
                                          Placed
                                        </span>
                                        <span className={`${order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''} truncate`}>
                                          Confirmed
                                        </span>
                                        <span className={`${order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''} truncate hidden sm:inline`}>
                                          Preparing
                                        </span>
                                        <span className={`${order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''} truncate sm:hidden`}>
                                          Prep
                                        </span>
                                        <span className={`${order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''} truncate hidden sm:inline`}>
                                          Out for Delivery
                                        </span>
                                        <span className={`${order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''} truncate sm:hidden`}>
                                          Out
                                        </span>
                                        <span className={`${order.status === 'delivered' ? 'text-blue-600 font-medium' : ''} truncate`}>
                                          Delivered
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                        <div 
                                          className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                          style={{
                                            width: order.status === 'pending' ? '20%' :
                                                   order.status === 'confirmed' ? '40%' :
                                                   order.status === 'preparing' ? '60%' :
                                                   order.status === 'out_for_delivery' ? '80%' :
                                                   order.status === 'delivered' ? '100%' : '0%'
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Delivery Information */}
                                  {order.delivery_address && (
                                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                                      <div className="flex items-start space-x-2">
                                        <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs sm:text-sm font-medium text-gray-700">Delivery Address</p>
                                          <p className="text-xs sm:text-sm text-gray-600 break-words">{order.delivery_address}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Drum Return Section for Delivered Orders */}
                                  {order.status === 'delivered' && (
                                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                        <div className="flex-1">
                                          <p className="text-xs sm:text-sm font-medium text-blue-800">📦 Container Return</p>
                                          {order.drum_status === 'return_requested' && (
                                            <p className="text-[10px] sm:text-xs text-blue-600">Return requested - vendor notified</p>
                                          )}
                                          {order.drum_status === 'returned' && (
                                            <p className="text-[10px] sm:text-xs text-green-600">Container successfully returned</p>
                                          )}
                                          {!order.drum_status && (
                                            <p className="text-[10px] sm:text-xs text-gray-600">Click to request container pickup</p>
                                          )}
                                        </div>
                                        {order.drum_status === 'return_requested' ? (
                                          <span className="inline-flex px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 self-start">
                                            Requested
                                          </span>
                                        ) : order.drum_status === 'returned' ? (
                                          <span className="inline-flex px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full bg-green-100 text-green-800 self-start">
                                            Returned
                                          </span>
                                        ) : (
                                          <button 
                                            onClick={() => handleDrumReturn(order)}
                                            disabled={drumReturnLoading === order.order_id}
                                            className="bg-orange-600 text-white px-2 sm:px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center space-x-1 self-start"
                                          >
                                            {drumReturnLoading === order.order_id ? (
                                              <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span className="text-[10px] sm:text-xs">Requesting...</span>
                                              </>
                                            ) : (
                                              <>
                                                <span>📦</span>
                                                <span className="text-[10px] sm:text-xs">Return</span>
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Order Actions */}
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mt-3 sm:mt-2">
                                    <button 
                                      onClick={() => handleViewOrderDetails(order)}
                                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors active:scale-95 text-center"
                                    >
                                      View Details
                                    </button>
                                    {order.status === 'confirmed' && order.payment_status === 'unpaid' && (
                                      <button 
                                        onClick={() => handlePayment(order)}
                                        className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors active:scale-95 text-center"
                                      >
                                        💳 Pay Now
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 lg:p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={closeOrderDetails}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Information */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* Order ID and Status */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Order #{selectedOrder.order_id}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full self-start ${
                      selectedOrder.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : selectedOrder.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : selectedOrder.status === 'preparing'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedOrder.status === 'out_for_delivery'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedOrder.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3 sm:mt-4">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">
                      <span className={selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                        Order Placed
                      </span>
                      <span className={selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                        Confirmed
                      </span>
                      <span className={`hidden sm:inline ${selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}`}>
                        Preparing
                      </span>
                      <span className={`sm:hidden ${selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}`}>
                        Prep
                      </span>
                      <span className={`hidden sm:inline ${selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}`}>
                        Out for Delivery
                      </span>
                      <span className={`sm:hidden ${selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}`}>
                        Out
                      </span>
                      <span className={selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                        Delivered
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 sm:h-2">
                      <div 
                        className="bg-blue-600 h-1 sm:h-2 rounded-full transition-all duration-300"
                        style={{
                          width: selectedOrder.status === 'pending' ? '20%' :
                                 selectedOrder.status === 'confirmed' ? '40%' :
                                 selectedOrder.status === 'preparing' ? '60%' :
                                 selectedOrder.status === 'out_for_delivery' ? '80%' :
                                 selectedOrder.status === 'delivered' ? '100%' : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Vendor Information */}
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Vendor Information</h3>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">{selectedOrder.vendor_name || 'Vendor Name'}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Ice Cream Vendor</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Order Items</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {/* Show detailed order items if available, otherwise show basic info */}
                    {selectedOrder.order_items_details ? (
                      <div className="bg-pink-50 rounded-lg p-2 sm:p-3 border border-pink-200">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedOrder.order_items_details}</p>
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Order ID: #{selectedOrder.order_id}</p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Ice Cream Order</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">Order ID: #{selectedOrder.order_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Delivery Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Delivery Address</p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">{selectedOrder.delivery_address || 'No address provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Delivery Date & Time</p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          {selectedOrder.delivery_datetime 
                            ? new Date(selectedOrder.delivery_datetime).toLocaleString()
                            : 'No delivery time set'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Deadline Timer - Show for pending/confirmed unpaid orders */}
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && 
                 selectedOrder.payment_status === 'unpaid' && (
                  <PaymentCountdownTimer 
                    order={selectedOrder} 
                    onExpired={() => {
                      console.log('Payment deadline expired for order:', selectedOrder.order_id);
                    }} 
                  />
                )}

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Payment</h3>
                  <div className="space-y-2">
                    {/* Show Initial Payment for Partial Payments */}
                    {selectedOrder.payment_status === 'partial' && selectedOrder.initial_payment_method && (
                      <>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                          <span className="text-xs sm:text-sm text-gray-600">Initial Payment Method:</span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">
                            {selectedOrder.initial_payment_method}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">Payment Status:</span>
                          <span className="text-xs sm:text-sm font-medium text-orange-600">
                            Partial
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">Amount Paid (50%):</span>
                          <span className="text-base sm:text-lg font-bold text-green-600">
                            ₱{(parseFloat(selectedOrder.total_amount) / 2).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {/* Show Payment Status for Non-Partial Orders */}
                    {selectedOrder.payment_status !== 'partial' && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Payment Status:</span>
                        <span className={`text-xs sm:text-sm font-medium ${
                          selectedOrder.payment_status === 'paid' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Total Amount:</span>
                      <span className="text-base sm:text-lg font-bold">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Remaining Balance - Show for Partial Payments */}
                {selectedOrder.payment_status === 'partial' && (
                  <div className="bg-orange-50 border border-orange-300 rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-semibold text-orange-900">Remaining Balance:</span>
                      <span className="text-base sm:text-lg font-bold text-orange-600">
                        ₱{(parseFloat(selectedOrder.total_amount) / 2).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] sm:text-xs">
                      <span className="text-orange-800">Remaining Payment Method:</span>
                      <span className="font-medium text-red-600">
                        {selectedOrder.remaining_payment_method || 'Not Selected'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Button for Remaining Balance (GCash only) */}
                {selectedOrder.payment_status === 'partial' && selectedOrder.remaining_payment_method === 'GCash' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                    <h3 className="text-sm sm:text-base font-semibold text-green-900 mb-1.5 sm:mb-2">
                      Complete Your Payment
                    </h3>
                    <p className="text-[10px] sm:text-xs text-green-800 mb-2 sm:mb-3">
                      You selected to pay the remaining balance via GCash. Click below to complete your payment:
                    </p>
                    
                    <button 
                      onClick={() => handlePayment(selectedOrder)}
                      className="w-full bg-green-600 text-white px-3 py-3 sm:px-4 sm:py-4 rounded-lg hover:bg-green-700 transition-all hover:shadow-lg text-center"
                    >
                      <div className="text-xs sm:text-sm font-bold mb-0.5">💳 Pay Remaining Balance via GCash</div>
                      <div className="text-[9px] sm:text-xs opacity-90">₱{parseFloat(selectedOrder.remaining_balance || (selectedOrder.total_amount - selectedOrder.payment_amount)).toFixed(2)}</div>
                    </button>
                  </div>
                )}
                
                {/* Cash on Delivery Info */}
                {selectedOrder.payment_status === 'partial' && selectedOrder.remaining_payment_method === 'Cash on Delivery' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                    <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-1.5 sm:mb-2">
                      💵 Cash on Delivery
                    </h3>
                    <p className="text-[10px] sm:text-xs text-blue-800">
                      You will pay the remaining balance of ₱{(parseFloat(selectedOrder.total_amount) / 2).toFixed(2)} in cash when your order arrives. Please prepare the exact amount.
                    </p>
                  </div>
                )}

                {/* Payment Button for Unpaid Orders (both pending and confirmed) */}
                {((selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && 
                  selectedOrder.payment_status === 'unpaid') && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-sm sm:text-base text-green-800 font-medium mb-2">💳 Payment Required</p>
                    <p className="text-xs sm:text-sm text-green-700 mb-3">
                      Please proceed with payment via GCash. {selectedOrder.status === 'confirmed' ? 'The vendor will start preparing your ice cream once payment is received.' : 'Complete your payment to confirm your order.'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button 
                        onClick={() => handlePayment(selectedOrder)}
                        className="w-full bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium"
                      >
                        💳 Pay Now via GCash
                      </button>
                      <button 
                        onClick={() => handleCancelOrder(selectedOrder)}
                        className="w-full bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-medium"
                      >
                        ❌ Cancel Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    onClick={closeOrderDetails}
                    className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                  >
                    Close
                  </button>
                  {selectedOrder.status === 'delivered' && (
                    <button 
                      onClick={() => {
                        setShowReviewModal(true);
                        setReviewRating(0);
                        setReviewComment('');
                      }}
                      className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                    >
                      Rate Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full mx-2 sm:mx-4 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 pr-2">
                  Leave a Review
                </h3>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
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
                  <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{selectedOrder.vendor_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Order #{selectedOrder.order_id}</p>
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
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg border-2 border-blue-200 transition-colors duration-200 disabled:opacity-50"
                >
                  {drumReturnLoading === selectedOrderForReturn.order_id ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelOrderModal && orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Cancel Order #{orderToCancel.order_id}?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to cancel this order? Your reserved items will be released and made available to other customers. This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCancelOrderModal(false);
                    setOrderToCancel(null);
                  }}
                  disabled={isCancellingOrder}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={isCancellingOrder}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {isCancellingOrder ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelling...
                    </div>
                  ) : (
                    'Yes, Cancel Order'
                  )}
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
                    fetchOrders();
                  }}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg border-2 border-blue-200 transition-colors duration-200"
                >
                  OK
                </button>
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

export default Notifications;
