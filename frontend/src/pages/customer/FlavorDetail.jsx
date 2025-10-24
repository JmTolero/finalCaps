import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';
import StarRating from '../../components/shared/StarRating';
import { useCart } from '../../contexts/CartContext';
import { getImageUrl } from '../../utils/imageUtils';
import FeedbackModal from '../../components/shared/FeedbackModal';
import ContactNumberModal from '../../components/shared/ContactNumberModal';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';
import findNearbyIcon from '../../assets/images/vendordashboardicon/findnearby.png';

export const FlavorDetail = () => {
  const { flavorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, totalItems } = useCart();
  const [flavor, setFlavor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('large');
  const [quantity, setQuantity] = useState(1);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  
  // Rating state
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Contact number modal state
  const [showContactNumberModal, setShowContactNumberModal] = useState(false);
  
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

  // Handle contact number modal actions
  const handleContactNumberModalClose = () => {
    setShowContactNumberModal(false);
  };

  const handleGoToSettings = () => {
    setShowContactNumberModal(false);
    navigate('/customer?view=settings&tab=profile');
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

  useEffect(() => {
    fetchFlavorDetails();
    fetchRatings();
    fetchUserRating();
  }, [flavorId]);

  // Fetch notifications for customer
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        console.log('🔔 FlavorDetail: No user found in sessionStorage');
        return;
      }

      const user = JSON.parse(userRaw);
      console.log('🔔 FlavorDetail: Fetching notifications for user:', user.id);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/notifications/customer/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        console.log('📬 FlavorDetail: Fetched notifications:', response.data.notifications?.length || 0);
        console.log('📬 FlavorDetail: Total notifications:', response.data.notifications?.length || 0);
      } else {
        console.log('🔔 FlavorDetail: API returned unsuccessful response:', response.data);
      }
    } catch (error) {
      console.error('🔔 FlavorDetail: Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        console.log('🔔 FlavorDetail: No user found for unread count');
        return;
      }

      const user = JSON.parse(userRaw);
      console.log('🔔 FlavorDetail: Fetching unread count for user:', user.id);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/notifications/customer/${user.id}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
        console.log('🔔 FlavorDetail: Unread count:', response.data.unread_count || 0);
      } else {
        console.log('🔔 FlavorDetail: Unread count API returned unsuccessful response:', response.data);
      }
    } catch (error) {
      console.error('🔔 FlavorDetail: Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    console.log('🔔 FlavorDetail: Fetching notifications...');
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const fetchFlavorDetails = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/flavors/${flavorId}`);
      
      if (response.data.success) {
        console.log('🔍 API Response flavor:', response.data.flavor);
        console.log('🔍 flavor_name from API:', response.data.flavor.flavor_name);
        setFlavor(response.data.flavor);
        
        // Parse and set images
        console.log('🔍 flavor.image_url from API:', response.data.flavor.image_url);
        if (response.data.flavor.image_url) {
          try {
            const images = JSON.parse(response.data.flavor.image_url);
            console.log('🔍 Parsed images:', images);
            setSelectedImages(Array.isArray(images) ? images : [images]);
          } catch (e) {
            console.log('🔍 Failed to parse images, using raw image_url:', response.data.flavor.image_url);
            setSelectedImages([response.data.flavor.image_url]);
          }
        } else {
          console.log('🔍 No image_url found in flavor data');
          setSelectedImages([]);
        }
      } else {
        setError('Flavor not found');
      }
    } catch (err) {
      console.error('Error fetching flavor details:', err);
      setError('Failed to load flavor details');
    } finally {
      setLoading(false);
    }
  };

  // Rating functions
  const fetchRatings = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/ratings/flavors/${flavorId}/ratings`);
      
      if (response.data.success) {
        setRatings(response.data.ratings);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchUserRating = async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const token = sessionStorage.getItem('token');
      
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/ratings/flavors/${flavorId}/my-rating`, {
        headers: { Authorization: `Bearer ${token || userRaw}` }
      });
      
      if (response.data.success) {
        setUserRating(response.data.rating);
        if (response.data.rating) {
          setNewRating(response.data.rating.rating);
          setReviewText(response.data.rating.review_text || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleRateFlavor = async () => {
    if (newRating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setRatingLoading(true);
      const userRaw = sessionStorage.getItem('user');
      const user = JSON.parse(userRaw);
      const token = sessionStorage.getItem('token');
      
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.post(`${apiBase}/api/ratings/flavors/${flavorId}/rate`, {
        rating: newRating,
        review_text: reviewText
      }, {
        headers: { Authorization: `Bearer ${token || userRaw}` }
      });
      
      if (response.data.success) {
        // Refresh ratings and flavor details
        await fetchRatings();
        await fetchUserRating();
        await fetchFlavorDetails();
        setShowRatingModal(false);
        alert('Rating submitted successfully!');
      }
    } catch (error) {
      console.error('Error rating flavor:', error);
      alert('Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    const maxAvailable = getAvailableDrums();
    if (newQuantity >= 1 && newQuantity <= maxAvailable) {
      setQuantity(newQuantity);
    }
  };

  const handleBookNow = () => {
    if (!flavor) return;
    
    // Check if user has contact number
    const userRaw = sessionStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (!user.contact_no || user.contact_no.trim() === '') {
        setShowContactNumberModal(true);
        return;
      }
    }
    
    // Validate required fields
    if (!deliveryDate && !deliveryTime) {
      setValidationMessage('Please select both delivery date and time to proceed with booking.');
      setShowValidationModal(true);
      return;
    }
    
    if (!deliveryDate) {
      setValidationMessage('Please select a delivery date to proceed with booking.');
      setShowValidationModal(true);
      return;
    }
    
    if (!deliveryTime) {
      setValidationMessage('Please select a delivery time to proceed with booking.');
      setShowValidationModal(true);
      return;
    }
    
    const orderData = {
      flavorId: flavor.flavor_id,
      flavorName: flavor.flavor_name,
      size: selectedSize,
      quantity: quantity,
      totalPrice: getPrice().replace('₱', ''),
      vendorId: flavor.vendor_id,
      vendorName: flavor.store_name,
      deliveryDate: deliveryDate,
      deliveryTime: deliveryTime,
      items: [
        {
          flavor_id: flavor.flavor_id,
          name: flavor.flavor_name,
          size: selectedSize,
          quantity: quantity,
          price: parseFloat(getPrice().replace('₱', ''))
        }
      ]
    };
    
    navigate('/checkout', { state: orderData });
  };

  const handleReserve = async () => {
    if (!flavor) return;

    console.log('🔍 Debug flavor object:', flavor);
    console.log('🔍 flavor.flavor_name:', flavor.flavor_name);
    console.log('🔍 flavor.store_name:', flavor.store_name);
    console.log('🔍 selectedImages:', selectedImages);
    console.log('🔍 selectedImages[0]:', selectedImages[0]);

    const cartItem = {
      flavor_id: flavor.flavor_id,
      name: flavor.flavor_name,
      size: selectedSize,
      quantity: quantity,
      price: parseFloat(getPrice().replace('₱', '')),
      vendor_id: flavor.vendor_id,
      vendor_name: flavor.store_name,
      image_url: selectedImages[0] || null,
      location: flavor.location
    };

    console.log('🔍 Cart item created:', cartItem);
    console.log('🔍 Flavor data vendor_id:', flavor.vendor_id);
    console.log('🔍 Flavor data store_name:', flavor.store_name);
    
    // Validate vendor_id before adding to cart
    if (!flavor.vendor_id || flavor.vendor_id === null || flavor.vendor_id === undefined) {
      console.error('❌ Flavor has no vendor_id:', flavor);
      alert('This product has missing vendor information and cannot be added to cart. Please contact support.');
      return;
    }

    await addToCart(cartItem);
    setShowReserveModal(true);
  };

  const getPrice = () => {
    if (!flavor) return 'Price not available';
    
    switch (selectedSize) {
      case 'small':
        return flavor.small_price ? `₱${parseInt(flavor.small_price)}` : 'Not available';
      case 'medium':
        return flavor.medium_price ? `₱${parseInt(flavor.medium_price)}` : 'Not available';
      case 'large':
        return flavor.large_price ? `₱${parseInt(flavor.large_price)}` : 'Not available';
      default:
        return 'Price not available';
    }
  };

  const getAvailableDrums = () => {
    if (!flavor || !flavor.drum_availability) {
      return 0;
    }
    
    // Get availability for the selected size - handle case sensitivity
    let availability = flavor.drum_availability[selectedSize];
    
    // Fallback: try with different cases if not found
    if (availability === undefined || availability === null) {
      const lowerCase = selectedSize.toLowerCase();
      const upperCase = selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1);
      availability = flavor.drum_availability[lowerCase] || flavor.drum_availability[upperCase];
    }
    
    return availability || 0;
  };

  if (loading) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-700">Loading flavor details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !flavor) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Flavor not found'}</p>
            <button 
              onClick={() => navigate('/customer')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Flavors
            </button>
          </div>
        </div>
      </>
    );
  }

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
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigate("/customer")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={productsIcon} alt="Products" className="w-4 h-4" />
                </button>

                {/* Shops Icon */}
                <button 
                  onClick={() => navigate('/all-vendor-stores')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4" />
                </button>

                {/* Notification Bell */}
                <button
                  onClick={() => navigate("/customer/notifications")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <img
                    src={notifIcon}
                    alt="Notifications"
                    className="w-4 h-4"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Cart Icon */}
                <button 
                  onClick={() => navigate("/cart")}
                  className="p-1.5 rounded-lg transition-all duration-200 relative hover:bg-gray-100"
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Cart" 
                    className="w-4 h-4 transition-transform duration-200"
                  />
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
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden sm:flex items-center justify-end mb-3 sm:mb-4 lg:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base">
                Find nearby Vendors
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                {/* Products/Flavors Icon - Navigate back to customer dashboard */}
                <button 
                  onClick={() => navigate('/customer')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    location.pathname === '/customer' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img src={productsIcon} alt="Products" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                {/* Shops Icon */}
                <Link 
                  to="/all-vendor-stores" 
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    location.pathname === '/all-vendor-stores' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                
                {/* Notification Bell */}
                <button 
                  onClick={() => {
                    console.log('🔔 FlavorDetail: Notification button clicked');
                    navigate('/customer/notifications');
                  }}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors relative ${
                    location.pathname === '/customer/notifications' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img src={notifIcon} alt="Notifications" className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Cart Icon */}
                <button 
                  onClick={() => {
                    console.log('🛒 FlavorDetail: Cart button clicked');
                    navigate('/cart');
                  }}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 relative ${
                    location.pathname === '/cart'
                      ? 'bg-blue-100 hover:bg-blue-200 shadow-sm'
                      : 'hover:bg-gray-100'
                  }`}
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Cart" 
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200"
                  />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </button>
                
                {/* Feedback Icon with Dropdown */}
                <div className="relative feedback-dropdown">
                  <button 
                    onClick={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
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

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          {/* Main Product Card */}
          <div className="bg-sky-100 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row">
              {/* Product Images */}
              <div className="lg:w-1/2 p-3 sm:p-4 md:p-6">
                 <div className="space-y-2 sm:space-y-3">
                   {/* Main Image */}
                   <div className="aspect-square bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden relative max-w-xs sm:max-w-sm mx-auto lg:max-w-none">
                     {selectedImages[currentImageIndex] ? (
                       <img 
                         src={getImageUrl(selectedImages[currentImageIndex], process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${selectedImages[currentImageIndex]}`}
                         alt={flavor.flavor_name}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                         }}
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400">
                         No Image Available
                       </div>
                     )}
                     
                     {/* Navigation arrows for multiple images */}
                     {selectedImages.length > 1 && (
                       <>
                         <button
                           onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : selectedImages.length - 1)}
                           className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full hover:bg-opacity-70 transition-all"
                         >
                           <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                           </svg>
                         </button>
                         <button
                           onClick={() => setCurrentImageIndex(prev => prev < selectedImages.length - 1 ? prev + 1 : 0)}
                           className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full hover:bg-opacity-70 transition-all"
                         >
                           <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                         </button>
                       </>
                     )}
                   </div>
                   
                   {/* Thumbnail Images */}
                   {selectedImages.length > 1 && (
                     <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-2 justify-center lg:justify-start">
                       {selectedImages.map((image, index) => (
                         <button
                           key={index}
                           onClick={() => setCurrentImageIndex(index)}
                           className={`w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                             currentImageIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                           }`}
                         >
                           <img 
                             src={getImageUrl(image, process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${image}`}
                             alt={`${flavor.flavor_name} ${index + 1}`}
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                             }}
                           />
                         </button>
                       ))}
                     </div>
                   )}
                   
                   {/* Image counter */}
                   {selectedImages.length > 1 && (
                     <div className="text-center text-xs sm:text-sm text-gray-500">
                       {currentImageIndex + 1} of {selectedImages.length}
                     </div>
                   )}
                 </div>
              </div>

              {/* Product Details */}
              <div className="lg:w-1/2 p-4 sm:p-6 md:p-8">
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                   {/* Product Title */}
                   <div>
                     <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                       {flavor.flavor_name}
                     </h1>
                     <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                       <StarRating 
                         rating={parseFloat(flavor.average_rating) || 0}
                         size="md"
                         showCount={true}
                         totalRatings={flavor.total_ratings || 0}
                       />
                     </div>
                     {/* Flavor Description */}
                     {flavor.flavor_description && (
                       <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                         {flavor.flavor_description}
                       </p>
                     )}
                   </div>

                   {/* Price */}
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {getPrice()}
                  </div>

                   {/* Quantity Selector */}
                   <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                     <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 self-start sm:self-auto">
                       <button 
                         onClick={() => handleQuantityChange(-1)}
                         disabled={quantity <= 1}
                         className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base ${
                           quantity <= 1 
                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                             : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                         }`}
                       >
                         -
                       </button>
                       <span className="text-base sm:text-lg font-medium w-7 sm:w-8 text-center">{quantity}</span>
                       <button 
                         onClick={() => handleQuantityChange(1)}
                         disabled={quantity >= getAvailableDrums()}
                         className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base ${
                           quantity >= getAvailableDrums()
                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                             : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                         }`}
                       >
                         +
                       </button>
                     </div>
                     <span className="text-sm sm:text-base text-gray-600">{getAvailableDrums()} drums available</span>
                   </div>

                  {/* Size Selection */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Select Size</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {flavor.available_sizes.map((size) => (
                         <button
                           key={size}
                           onClick={() => handleSizeChange(size)}
                           className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium transition-colors text-sm sm:text-base ${
                             selectedSize === size
                               ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                               : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                           }`}
                         >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                   {/* Schedule Delivery */}
                   <div className="space-y-2 sm:space-y-3">
                     <div className="flex items-center space-x-2 text-gray-600">
                       <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                       </svg>
                       <span className="text-sm sm:text-base">Schedule to Deliver <span className="text-red-500">*</span></span>
                     </div>
                     <div className="flex space-x-2 sm:space-x-3">
                       <div className="flex-1">
                         <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                           Date <span className="text-red-500">*</span>
                         </label>
                         <input
                           type="date"
                           value={deliveryDate}
                           onChange={(e) => setDeliveryDate(e.target.value)}
                           className={`w-full px-2 py-2 text-xs sm:px-3 sm:text-base bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                             !deliveryDate ? 'border-red-300' : 'border-gray-300'
                           }`}
                           min={new Date().toISOString().split('T')[0]}
                           required
                         />
                       </div>
                       <div className="flex-1">
                         <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                           Time <span className="text-red-500">*</span>
                         </label>
                         <input
                           type="time"
                           value={deliveryTime}
                           onChange={(e) => setDeliveryTime(e.target.value)}
                           className={`w-full px-2 py-2 text-xs sm:px-3 sm:text-base bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                             !deliveryTime ? 'border-red-300' : 'border-gray-300'
                           }`}
                           required
                         />
                       </div>
                     </div>
                     {(!deliveryDate || !deliveryTime) && (
                       <p className="text-xs sm:text-sm text-red-600">
                         Please select both date and time to proceed with booking
                       </p>
                     )}
                   </div>

                   {/* Action Buttons */}
                   <div className="flex justify-end space-x-3 sm:space-x-4 pt-8 sm:pt-12 lg:pt-16">
                     <button 
                       onClick={handleReserve}
                         className="px-4 py-2 sm:px-8 sm:py-3 border-2 border-gray-400 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                     >
                       Reserve
                     </button>
                     <button 
                       onClick={handleBookNow}
                       className="px-4 py-2 sm:px-8 sm:py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                     >
                       Book now
                     </button>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Information Card */}
          <div className="bg-sky-100 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {flavor.profile_image_url ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/vendor-documents/${flavor.profile_image_url}`}
                      alt={flavor.store_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate">{flavor.store_name}</h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500 text-sm sm:text-base">★★★★★</span>
                    <span className="text-gray-600 text-sm sm:text-base">5.0</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                <button 
                  onClick={() => navigate(`/vendor/${flavor.vendor_id}/store`)}
                  className="flex-1 sm:flex-initial px-3 py-2 sm:px-6 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors text-xs sm:text-base whitespace-nowrap"
                >
                  View Shop
                </button>
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="flex-1 sm:flex-initial px-3 py-2 sm:px-6 bg-blue-50 text-blue-700 rounded-full font-medium border-2 border-blue-200 hover:bg-blue-100 transition-colors text-xs sm:text-base whitespace-nowrap"
                >
                  Contact Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Shop Modal */}
      {showContactModal && flavor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 md:p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 pr-2 break-words">Contact {flavor.store_name}</h2>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Vendor Info */}
              <div className="mb-4 sm:mb-5 md:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                  {flavor.profile_image_url ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/vendor-documents/${flavor.profile_image_url}`}
                      alt={flavor.store_name}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{flavor.store_name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{flavor.fname} {flavor.lname}</p>
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">{flavor.location}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-5 md:mb-6">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Contact Information</h4>
                
                {/* Phone Number */}
                {flavor.contact_no && (
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{flavor.contact_no}</p>
                    </div>
                    <a 
                      href={`tel:${flavor.contact_no}`}
                      className="px-2.5 py-1 sm:px-3 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                    >
                      Call
                    </a>
                  </div>
                )}

                {/* Email */}
                {flavor.email && (
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base break-words">{flavor.email}</p>
                    </div>
                    <a 
                      href={`mailto:${flavor.email}`}
                      className="px-2.5 py-1 sm:px-3 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                    >
                      Email
                    </a>
                  </div>
                )}

              </div>

              {/* Business Hours Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-yellow-800">Business Hours</p>
                    <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                      Please contact during business hours for the best response time. 
                      Most vendors respond within 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-4 sm:mt-5 md:mt-6 flex justify-end">
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 md:p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 pr-2 break-words">Rate {flavor?.flavor_name}</h2>
                <button 
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Rating Input */}
              <div className="mb-4 sm:mb-5 md:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  Your Rating
                </label>
                <StarRating 
                  rating={newRating}
                  onRatingChange={setNewRating}
                  interactive={true}
                  size="lg"
                />
              </div>

              {/* Review Text */}
              <div className="mb-4 sm:mb-5 md:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this flavor..."
                  className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button 
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRateFlavor}
                  disabled={ratingLoading || newRating === 0}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    ratingLoading || newRating === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {ratingLoading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-sky-100 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-5 md:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Customer Reviews</h2>
            <button 
              onClick={() => setShowRatingModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors text-sm sm:text-base"
            >
              Rate This Flavor
            </button>
          </div>
          
          {ratings.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {ratings.map((rating) => (
                <div key={rating.rating_id} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800 text-sm sm:text-base truncate">
                        {rating.fname} {rating.lname}
                      </span>
                      <StarRating rating={rating.rating} size="sm" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.review_text && (
                    <p className="text-gray-600 text-xs sm:text-sm break-words">{rating.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⭐</div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Be the first to rate this flavor!</p>
              <button 
                onClick={() => setShowRatingModal(true)}
                className="px-4 sm:px-6 py-2 bg-blue-50 text-blue-700 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors text-sm sm:text-base"
              >
                Rate This Flavor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 mb-3 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Missing Information
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                {validationMessage}
              </p>
              <button
                onClick={() => setShowValidationModal(false)}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg border-2 border-blue-200 transition-colors duration-200 text-sm sm:text-base"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Confirmation Modal */}
      {showReserveModal && flavor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 sm:p-5 md:p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Item Reserved!</h2>
                <button 
                  onClick={() => setShowReserveModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Success Icon */}
              <div className="text-center mb-4 sm:mb-5 md:mb-6">
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-100 mb-3 sm:mb-4">
                  <svg className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Successfully Added to Cart
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Added {quantity} {selectedSize} {flavor.flavor_name} to your cart!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowReserveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    setShowReserveModal(false);
                    navigate('/cart');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium border-2 border-blue-200 hover:bg-blue-100 transition-colors text-sm sm:text-base"
                >
                  Go to Cart
                </button>
              </div>
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

      {/* Contact Number Modal */}
      <ContactNumberModal 
        isOpen={showContactNumberModal}
        onClose={handleContactNumberModalClose}
        onGoToSettings={handleGoToSettings}
      />
    </>
  );
};
