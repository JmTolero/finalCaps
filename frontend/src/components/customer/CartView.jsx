import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { getImageUrl } from '../../utils/imageUtils';
import FeedbackModal from '../../components/shared/FeedbackModal';
import axios from 'axios';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';
import findNearbyIcon from '../../assets/images/vendordashboardicon/findnearby.png';

export const CartView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totalItems, removeFromCart, clearCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [flavorImages, setFlavorImages] = useState({});
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  
  // Debug modal state
  useEffect(() => {
    console.log('🎯 CartView: showFeedbackModal state changed to:', showFeedbackModal);
  }, [showFeedbackModal]);
  
  // Feedback dropdown state
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);

  // Handle feedback dropdown actions
  const handleFeedbackAction = (action) => {
    setShowFeedbackDropdown(false);
    if (action === 'submit') {
      console.log('🎯 CartView: Opening feedback modal');
      setShowFeedbackModal(true);
    } else if (action === 'view') {
      console.log('🎯 CartView: Navigating to my feedback page');
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
        console.log('🔔 Unread notifications:', response.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Fetch flavor images for items that don't have image_url
  const fetchFlavorImages = useCallback(async () => {
    const itemsNeedingImages = items.filter(item => !item.image_url);
    
    console.log('🔍 CartView: Total cart items:', items.length);
    console.log('🔍 CartView: Items needing images:', itemsNeedingImages.length);
    
    if (itemsNeedingImages.length === 0) {
      console.log('🔍 CartView: All items already have images');
      return;
    }

    console.log('🔍 CartView: Fetching images for', itemsNeedingImages.length, 'items');

    for (const item of itemsNeedingImages) {
      try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        console.log('🔍 CartView: Fetching flavor', item.flavor_id, 'from API');
        const response = await axios.get(`${apiBase}/api/flavors/${item.flavor_id}`);
        
        if (response.data.success && response.data.flavor.image_url) {
          let imageUrl = response.data.flavor.image_url;
          console.log('🔍 CartView: Raw image_url from API:', imageUrl);
          
          // Parse JSON if it's a string
          try {
            const parsedImages = JSON.parse(imageUrl);
            imageUrl = Array.isArray(parsedImages) ? parsedImages[0] : parsedImages;
            console.log('🔍 CartView: Parsed image URL:', imageUrl);
          } catch (e) {
            // imageUrl is already a string, use as is
            console.log('🔍 CartView: Image URL already a string:', imageUrl);
          }
          
          setFlavorImages(prev => ({
            ...prev,
            [item.flavor_id]: imageUrl
          }));
          
          console.log('✅ CartView: Successfully fetched image for flavor', item.flavor_id);
        } else {
          console.log('⚠️ CartView: No image_url in API response for flavor', item.flavor_id);
        }
      } catch (error) {
        console.error('❌ CartView: Error fetching image for flavor', item.flavor_id, ':', error);
      }
    }
  }, [items]);

  useEffect(() => {
    fetchFlavorImages();
  }, [fetchFlavorImages]);



  if (items.length === 0) {
    return (
      <>
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
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Desktop: Find nearby Vendors text */}
                <Link 
                  to="/find-vendors" 
                  className="hidden sm:inline text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base"
                  title="Find nearby Vendors"
                >
                  Find nearby Vendors
                </Link>
                
                {/* Navigation Icons */}
                <div className="flex items-center space-x-1.5 sm:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-4 sm:py-2">
                  {/* Products/Flavors Icon - Navigate to browse flavors */}
                  <button 
                    onClick={() => {
                      // Navigate to customer dashboard
                      navigate('/customer');
                    }}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      location.pathname === '/customer' 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                    title="Browse Flavors"
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
                    onClick={() => navigate('/customer/notifications')}
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
                    onClick={() => navigate('/cart')}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 relative ${
                      location.pathname === '/cart'
                        ? 'bg-blue-100 hover:bg-blue-200 shadow-sm' 
                        : totalItems > 0 
                        ? 'bg-orange-100 hover:bg-orange-200 shadow-sm' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                  >
                    <img 
                      src={cartIcon} 
                      alt="Cart" 
                      className="w-4 h-4 sm:w-5 sm:h-5" 
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="bg-sky-100 rounded-xl p-6 sm:p-8 text-center">
            <div className="text-4xl sm:text-6xl mb-4">⭐</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Your favorites list is empty</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Add some delicious ice cream flavors to your favorites to save them for later!</p>
            <button
              onClick={() => {
                // Navigate to customer dashboard to browse flavors
                navigate('/customer');
              }}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Browse Flavors
            </button>
          </div>
        </div>

        {/* Feedback Modal */}
        {console.log('🎯 CartView: Rendering FeedbackModal with isOpen:', showFeedbackModal)}
        <FeedbackModal 
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          userRole="customer"
        />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-end mb-6 relative">
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Desktop: Find nearby Vendors text */}
              <Link 
                to="/find-vendors" 
                className="hidden sm:inline text-blue-700 hover:text-blue-800 font-medium text-sm sm:text-base"
                title="Find nearby Vendors"
              >
                Find nearby Vendors
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-4 sm:py-2">
                {/* Products/Flavors Icon */}
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
                  onClick={() => navigate('/customer/notifications')}
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
                
                {/* Cart Icon - Active on cart page */}
                <button 
                  onClick={() => navigate('/cart')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors relative ${
                    location.pathname === '/cart'
                      ? 'bg-blue-100 hover:bg-blue-200 shadow-sm' 
                      : totalItems > 0 
                      ? 'bg-orange-100 hover:bg-orange-200 shadow-sm' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Cart" 
                    className="w-4 h-4 sm:w-5 sm:h-5" 
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-sky-100 rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 space-y-1 sm:space-y-0">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800">My Favorites</h2>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium self-end sm:self-auto"
        >
          Clear All
        </button>
      </div>

      {/* Favorites Items */}
      <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
        {items.map((item, index) => (
          <div 
            key={`${item.flavor_id}-${item.size}`} 
            className="bg-white rounded-lg p-2 sm:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/flavor/${item.flavor_id}`)}
          >
            <div className="flex items-center justify-between space-x-2">
              {/* Left side: Content */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                {/* Rest of content */}
                <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 min-w-0">
                  {/* Item Image */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {(() => {
                      // Check multiple possible field names for the image
                      const imageField = item.image_url || flavorImages[item.flavor_id] || item.flavor_image_url || item.image || item.flavor_image;
                      
                      console.log('🔍 Cart item:', item.name || item.flavor_name);
                      console.log('🔍 Image field found:', imageField);
                      
                      if (!imageField) {
                        return (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                            🍦
                          </div>
                        );
                      }
                      
                      // Use getImageUrl utility which handles both Cloudinary and local paths
                      const imagePath = getImageUrl(imageField, process.env.REACT_APP_API_URL || "http://localhost:3001");
                      
                      console.log('🔍 Resolved image path:', imagePath);
                      
                      return (
                        <img
                          src={imagePath}
                          alt={item.flavor_name || item.name || 'Flavor'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('🔍 Image failed to load:', imagePath);
                            // Try fallback to local upload path
                            const fallbackPath = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageField}`;
                            console.log('🔍 Trying fallback path:', fallbackPath);
                            if (e.target.src !== fallbackPath) {
                              e.target.src = fallbackPath;
                            } else {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      );
                    })()}
                    <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: 'none'}}>
                      🍦
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="text-sm sm:text-lg font-semibold text-blue-600 mb-0.5 sm:mb-1">
                      {item.vendor_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-800 font-medium truncate" title={item.flavor_name || item.name || 'No flavor name'}>
                      {item.flavor_name || item.name || 'No flavor name'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remove Button - Right side */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromCart(item.flavor_id, item.size);
                }}
                className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center flex-shrink-0"
                title="Remove from favorites"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {console.log('🎯 CartView: Rendering FeedbackModal with isOpen:', showFeedbackModal)}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userRole="customer"
      />
    </>
  );
};

export default CartView;
