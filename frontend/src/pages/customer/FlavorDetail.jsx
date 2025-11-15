import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';
import StarRating from '../../components/shared/StarRating';
import { useCart } from '../../contexts/CartContext';
import { getImageUrl } from '../../utils/imageUtils';
import FeedbackModal from '../../components/shared/FeedbackModal';
import ContactNumberModal from '../../components/shared/ContactNumberModal';
import { getAvailabilityByDate } from '../../services/availabilityService';

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
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Rating state
  const [ratings, setRatings] = useState([]);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  
  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Contact number modal state
  const [showContactNumberModal, setShowContactNumberModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // Feedback dropdown state
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);
  
  // Date-based availability state
  const [dateAvailability, setDateAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

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

  const fetchFlavorDetails = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/flavors/${flavorId}`);
      
      if (response.data.success) {
        const flavorData = response.data.flavor;
        setFlavor(flavorData);
        
        if (flavorData?.images?.length) {
          setSelectedImages(flavorData.images);
        } else if (flavorData?.image_url) {
          try {
            const images = JSON.parse(flavorData.image_url);
            setSelectedImages(Array.isArray(images) ? images : [images]);
          } catch (err) {
            setSelectedImages([flavorData.image_url]);
          }
        } else {
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
  }, [flavorId]);

  const fetchRatings = useCallback(async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/ratings/flavors/${flavorId}/ratings`);
      
      if (response.data.success) {
        setRatings(response.data.ratings);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }, [flavorId]);

  const fetchUserRating = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const token = sessionStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/ratings/flavors/${flavorId}/my-rating`, {
        headers: { Authorization: `Bearer ${token || userRaw}` }
      });
      
      if (response.data.success) {
        if (response.data.rating) {
          setNewRating(response.data.rating.rating);
          setReviewText(response.data.rating.review_text || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  }, [flavorId]);

  useEffect(() => {
    fetchFlavorDetails();
    fetchRatings();
    fetchUserRating();
  }, [flavorId, fetchFlavorDetails, fetchRatings, fetchUserRating]);

  // Fetch notifications for customer
  const fetchNotifications = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        console.log('🔔 FlavorDetail: No user found in sessionStorage');
        return;
      }

      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/notifications/customer/${JSON.parse(userRaw).id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        console.log('📬 FlavorDetail: Fetched notifications:', response.data.notifications?.length || 0);
        console.log('📬 FlavorDetail: Total notifications:', response.data.notifications?.length || 0);
      } else {
        console.log('🔔 FlavorDetail: API returned unsuccessful response:', response.data);
      }
    } catch (error) {
      console.error('🔔 FlavorDetail: Error fetching notifications:', error);
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

      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/notifications/customer/${JSON.parse(userRaw).id}/unread-count`, {
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

  // Fetch date-specific availability when delivery date changes
  useEffect(() => {
    const fetchDateAvailability = async () => {
      if (!flavor?.vendor_id) {
        setDateAvailability(null);
        return;
      }

      // If no date selected, use today as default
      const dateToCheck = deliveryDate || new Date().toISOString().split('T')[0];

      try {
        setAvailabilityLoading(true);
        console.log('📅 Fetching availability for date:', dateToCheck);
        const response = await getAvailabilityByDate(flavor.vendor_id, dateToCheck);
        console.log('📅 Availability response:', response);
        
        // Extract just the counts from the nested structure
        if (response.success && response.availability) {
          const simplifiedAvailability = {
            small: response.availability.small?.available_count || 0,
            medium: response.availability.medium?.available_count || 0,
            large: response.availability.large?.available_count || 0
          };
          console.log('📅 Simplified availability:', simplifiedAvailability);
          setDateAvailability(simplifiedAvailability);
        }
      } catch (error) {
        console.error('Error fetching date availability:', error);
        setDateAvailability(null);
      } finally {
        setAvailabilityLoading(false);
      }
    };

    fetchDateAvailability();
  }, [deliveryDate, flavor?.vendor_id, flavor]); // Add flavor to dependencies

  const handleRateFlavor = async () => {
    if (newRating === 0) {
      setValidationMessage('Please select a rating');
      setShowValidationModal(true);
      return;
    }

    try {
      setRatingLoading(true);
      const userRaw = sessionStorage.getItem('user');
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
        setNewRating(0);
        setReviewText('');
        setSuccessMessage('Rating submitted successfully!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error rating flavor:', error);
      setValidationMessage('Failed to submit rating. Please try again.');
      setShowValidationModal(true);
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

  const getDeliveryDateTime = () => {
    if (!deliveryDate || !deliveryTime) return null;
    const [year, month, day] = deliveryDate.split('-').map(Number);
    const [hours, minutes] = deliveryTime.split(':').map(Number);

    if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
      return null;
    }

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  };

  const calculateHoursUntilDelivery = () => {
    const deliveryDateTime = getDeliveryDateTime();
    if (!deliveryDateTime) return null;

    const now = new Date();
    return (deliveryDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  };

  // Check if delivery time is at least 24 hours away
  const isDeliveryTimeValid = () => {
    if (!deliveryDate || !deliveryTime) return false;

    const hoursUntilDelivery = calculateHoursUntilDelivery();
    if (hoursUntilDelivery === null) return false;

    return hoursUntilDelivery >= 24;
  };

  const handleReserveNow = async () => {
    if (!flavor) return;
    
    // Check if user has contact number
    const userRaw = sessionStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (!user.contact_no || user.contact_no.trim() === '') {
        setShowContactNumberModal(true);
        return;
      }

      const userId = user.id ?? user.user_id ?? user.userId;
      if (!userId) {
        console.warn('⚠️ Unable to determine user ID for address validation. User data:', user);
        setShowAddressModal(true);
        return;
      }

      try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const { data } = await axios.get(`${apiBase}/api/addresses/user/${userId}/addresses`);

        if (!Array.isArray(data) || data.length === 0) {
          setShowAddressModal(true);
          return;
        }
      } catch (error) {
        console.error('Error checking user addresses:', error);
        setShowAddressModal(true);
        return;
      }
    }
    
    // Validate size selection
    if (!selectedSize || selectedSize.trim() === '') {
      setValidationMessage('Please select a size to proceed with booking.');
      setShowValidationModal(true);
      return;
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
    
    // Check if drums are available for the selected date and size
    const availableDrums = getAvailableDrums();
    
    if (availableDrums === 0) {
      const dateDisplay = formatDateString(deliveryDate) || 'this date';
      setValidationMessage(
        `No ${selectedSize} drums available for ${dateDisplay}. Please select a different date or size.`
      );
      setShowValidationModal(true);
      return;
    }
    
    // Check if requested quantity exceeds available
    if (quantity > availableDrums) {
      const dateDisplay = formatDateString(deliveryDate) || 'this date';
      setValidationMessage(
        `Only ${availableDrums} ${selectedSize} drum(s) available for ${dateDisplay}. Please reduce quantity.`
      );
      setShowValidationModal(true);
      return;
    }
    
    // Validate: Orders must be placed at least 24 hours before delivery time
    const deliveryDateTime = getDeliveryDateTime();
    const hoursUntilDelivery = calculateHoursUntilDelivery();
    
    if (!deliveryDateTime || hoursUntilDelivery === null || hoursUntilDelivery < 24) {
      const formattedDateTime = deliveryDateTime
        ? deliveryDateTime.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        : `${deliveryDate} ${deliveryTime}`;
      setValidationMessage(
        `Orders must be placed at least 24 hours before delivery time. Ice cream preparation requires 24 hours. You selected ${formattedDateTime}, which is ${hoursUntilDelivery !== null ? hoursUntilDelivery.toFixed(1) : 'less than'} hours from now. Please select a delivery time at least 24 hours in the future.`
      );
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
          price: parseFloat(getPrice().replace('₱', '')),
          vendor_id: flavor.vendor_id,
          vendor_name: flavor.store_name
        }
      ]
    };
    
    navigate('/checkout', { state: orderData });
  };

  const handleAddToFavorites = async () => {
    if (!flavor) return;

    console.log('🔍 Debug flavor object:', flavor);
    console.log('🔍 flavor.flavor_name:', flavor.flavor_name);
    console.log('🔍 flavor.store_name:', flavor.store_name);
    console.log('🔍 selectedImages:', selectedImages);
    console.log('🔍 selectedImages[0]:', selectedImages[0]);

    // For favorites, use first available size as default if no size selected
    const defaultSize = selectedSize || (flavor.available_sizes && flavor.available_sizes.length > 0 ? flavor.available_sizes[0] : 'large');
    
    // Get price for the default size (or use first available size price)
    let favoritePrice = 0;
    if (selectedSize) {
      favoritePrice = parseFloat(getPrice().replace('₱', ''));
    } else {
      // Use price from first available size
      if (flavor.available_sizes && flavor.available_sizes.length > 0) {
        const firstSize = flavor.available_sizes[0].toLowerCase();
        if (firstSize === 'small' && flavor.small_price) {
          favoritePrice = parseFloat(flavor.small_price);
        } else if (firstSize === 'medium' && flavor.medium_price) {
          favoritePrice = parseFloat(flavor.medium_price);
        } else if (firstSize === 'large' && flavor.large_price) {
          favoritePrice = parseFloat(flavor.large_price);
        }
      }
    }

    const cartItem = {
      flavor_id: flavor.flavor_id,
      name: flavor.flavor_name,
      size: defaultSize,
      quantity: 1, // Favorites always start with quantity 1
      price: favoritePrice,
      vendor_id: flavor.vendor_id,
      vendor_name: flavor.store_name,
      image_url: selectedImages[0] || null,
      location: flavor.location
    };

    console.log('🔍 Cart item created:', cartItem);
    console.log('🔍 Flavor data vendor_id:', flavor.vendor_id);
    console.log('🔍 Flavor data store_name:', flavor.store_name);
    
    // Validate vendor_id before adding to favorites
    if (!flavor.vendor_id || flavor.vendor_id === null || flavor.vendor_id === undefined) {
      console.error('❌ Flavor has no vendor_id:', flavor);
      alert('This product has missing vendor information and cannot be added to favorites. Please contact support.');
      return;
    }

    await addToCart(cartItem);
    setShowReserveModal(true);
  };

  // Helper function to format date without timezone issues
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    // Parse date string manually to avoid timezone conversion
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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

  const getPriceRange = () => {
    if (!flavor || !flavor.available_sizes || flavor.available_sizes.length === 0) {
      return 'Price not available';
    }

    const prices = [];
    
    // Get prices for all available sizes
    if (flavor.available_sizes.includes('small') && flavor.small_price) {
      prices.push(parseInt(flavor.small_price));
    }
    if (flavor.available_sizes.includes('medium') && flavor.medium_price) {
      prices.push(parseInt(flavor.medium_price));
    }
    if (flavor.available_sizes.includes('large') && flavor.large_price) {
      prices.push(parseInt(flavor.large_price));
    }

    if (prices.length === 0) {
      return 'Price not available';
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // If all sizes have the same price, show single price
    if (minPrice === maxPrice) {
      return `₱${minPrice}`;
    }

    // Otherwise show range
    return `₱${minPrice} - ₱${maxPrice}`;
  };

  const getAvailableDrums = () => {
    // If no size is selected, return 0
    if (!selectedSize || selectedSize.trim() === '') {
      return 0;
    }
    
    // Normalize selectedSize to lowercase for consistent lookup
    const normalizedSize = selectedSize.toLowerCase();
    
    // If we have date-specific availability, use that (with case-insensitive lookup)
    if (dateAvailability) {
      // Try direct lookup first, then try normalized lowercase
      let dateAvail = dateAvailability[selectedSize] ?? dateAvailability[normalizedSize];
      
      // If still not found, try other case variations
      if (dateAvail === undefined || dateAvail === null) {
        const capitalized = selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1).toLowerCase();
        dateAvail = dateAvailability[capitalized] ?? dateAvailability[selectedSize.toLowerCase()];
      }
      
      // Return the value if found (even if it's 0, which is a valid value)
      if (dateAvail !== undefined && dateAvail !== null) {
        return dateAvail;
      }
    }
    
    // Fallback to flavor's general availability
    if (!flavor || !flavor.drum_availability) {
      return 0;
    }
    
    // Get availability for the selected size - handle case sensitivity
    let availability = flavor.drum_availability[selectedSize] ?? flavor.drum_availability[normalizedSize];
    
    // Fallback: try with different cases if not found
    if (availability === undefined || availability === null) {
      const capitalized = selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1).toLowerCase();
      availability = flavor.drum_availability[capitalized] || flavor.drum_availability[normalizedSize];
    }
    
    // Return availability (0 is a valid value, so we check for null/undefined)
    return (availability !== undefined && availability !== null) ? availability : 0;
  };

  const hoursUntilDelivery = calculateHoursUntilDelivery();

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
              <Link to="/find-vendors" className="p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm" title="Find nearby Vendors">
                <img src={findNearbyIcon} alt="Find nearby Vendors" className="w-5 h-5" />
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigate("/customer")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Products & Flavors"
                >
                  <img src={productsIcon} alt="Products" className="w-4 h-4" />
                </button>

                {/* Shops Icon */}
                <button 
                  onClick={() => navigate('/all-vendor-stores')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="All Vendor Stores"
                >
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4" />
                </button>

                {/* Notification Bell */}
                <button
                  onClick={() => navigate("/customer/notifications")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative"
                  title="Notifications"
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
                    alt="Favorites" 
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
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base" title="Find nearby Vendors">
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
                  title="Products & Flavors"
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
                  title="All Vendor Stores"
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
                  title="Notifications"
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
                    alt="Favorites" 
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
                    {selectedSize ? getPrice() : getPriceRange()}
                  </div>

                   {/* Quantity Selector */}
                   <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                     <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 self-start sm:self-auto">
                       <button 
                         onClick={() => handleQuantityChange(-1)}
                         disabled={!selectedSize || quantity <= 1}
                         className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base ${
                           !selectedSize || quantity <= 1 
                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                             : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                         }`}
                       >
                         -
                       </button>
                       <span className="text-base sm:text-lg font-medium w-7 sm:w-8 text-center">{quantity}</span>
                       <button 
                         onClick={() => handleQuantityChange(1)}
                         disabled={!selectedSize || quantity >= getAvailableDrums()}
                         className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base ${
                           !selectedSize || quantity >= getAvailableDrums()
                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                             : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                         }`}
                       >
                         +
                       </button>
                     </div>
                     {selectedSize && (
                     <div className="flex items-center gap-2">
                       <span className="text-sm sm:text-base text-gray-600">
                         {getAvailableDrums()} drums available
                         {deliveryDate && ` for ${formatDateString(deliveryDate)}`}
                       </span>
                       {availabilityLoading && <span className="text-xs text-gray-400">(loading...)</span>}
                     </div>
                     )}
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
                     
                     {/* Preparation Time Notice */}
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                       <div className="flex items-start space-x-2">
                         <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <p className="text-xs sm:text-sm text-blue-800">
                           <strong className="font-semibold"> Preparation Time Required:</strong> Orders must be placed at least <strong>24 hours</strong> before your selected delivery time. The vendor needs this time to prepare your ice cream order.
                         </p>
                       </div>
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
                    {deliveryDate && deliveryTime && !isDeliveryTimeValid() && (
                      <p className="text-xs sm:text-sm text-red-600">
                        Orders must be placed at least 24 hours before your selected delivery time
                        {hoursUntilDelivery !== null
                          ? `. Your current selection is ${hoursUntilDelivery.toFixed(1)} hour(s) away.`
                          : '.'}
                      </p>
                    )}
                     
                     {/* Date-specific availability display */}
                     {deliveryDate && dateAvailability && (
                       <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                         <p className="text-xs sm:text-sm font-medium text-blue-900 mb-2">
                           📅 Availability for {formatDateString(deliveryDate)}:
                         </p>
                         <div className="grid grid-cols-3 gap-2">
                           {['small', 'medium', 'large'].map((size) => {
                             const count = dateAvailability[size] || 0;
                             return (
                               <div key={size} className="text-center p-2 bg-white rounded">
                                 <p className="text-xs text-gray-600 capitalize">{size}</p>
                                 <p className={`text-sm font-semibold ${count > 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                   {count} {count !== 1 ? 'drums' : 'drum'}
                                 </p>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Action Buttons */}
                   <div className="flex justify-end space-x-3 sm:space-x-4 pt-8 sm:pt-12 lg:pt-16">
                     <button 
                       onClick={handleAddToFavorites}
                         className="px-4 py-2 sm:px-8 sm:py-3 border-2 border-gray-400 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                     >
                       Add to Favorites
                     </button>
                    <button 
                      onClick={handleReserveNow}
                      disabled={!selectedSize || !deliveryDate || !deliveryTime}
                      className={`px-4 py-2 sm:px-8 sm:py-3 rounded-full font-medium transition-colors text-sm sm:text-base ${
                        !selectedSize || !deliveryDate || !deliveryTime
                          ? 'bg-blue-200 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } ${deliveryDate && deliveryTime && !isDeliveryTimeValid() ? 'ring-2 ring-red-300' : ''}`}
                      title={
                        !selectedSize
                          ? 'Please select a size'
                          : !deliveryDate || !deliveryTime
                            ? 'Please select delivery date and time'
                            : !isDeliveryTimeValid()
                              ? `Orders must be placed at least 24 hours before delivery time. Current selection is ${
                                  hoursUntilDelivery !== null ? hoursUntilDelivery.toFixed(1) : 'less than 24'
                                } hour(s) ahead.`
                              : ''
                      }
                    >
                      Reserve
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
                      src={getImageUrl(flavor.profile_image_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents')}
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
                      src={getImageUrl(flavor.profile_image_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents')}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-3 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Success!
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg border-2 border-green-200 transition-colors duration-200 text-sm sm:text-base"
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
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Added to Favorites!</h2>
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
                  Successfully Added to Favorites
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Added {flavor.flavor_name} to your favorites!
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
                  View Favorites
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

      {/* Address Required Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Delivery Address Required</h2>
                <p className="text-gray-600">Add a delivery address in your profile before reserving an order.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">How to add your address:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Go to your profile settings</li>
                      <li>• Open the Address tab</li>
                      <li>• Add a delivery address with city and province</li>
                      <li>• Return here to reserve your order</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Got it
                </button>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    navigate('/customer?view=settings&tab=addresses');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Go to Address Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Number Modal */}
      <ContactNumberModal 
        isOpen={showContactNumberModal}
        onClose={handleContactNumberModalClose}
        onGoToSettings={handleGoToSettings}
      />
    </>
  );
};
