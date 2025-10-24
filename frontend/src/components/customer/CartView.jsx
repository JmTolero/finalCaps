import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { getImageUrl } from '../../utils/imageUtils';
import FeedbackModal from '../../components/shared/FeedbackModal';
import ContactNumberModal from '../../components/shared/ContactNumberModal';
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
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [flavorImages, setFlavorImages] = useState({});
  const [userAddress, setUserAddress] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Contact number modal state
  const [showContactNumberModal, setShowContactNumberModal] = useState(false);
  
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

  // Fetch user address
  const fetchUserAddress = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      console.log('🔍 CartView: Fetching addresses for user:', user.id);
      
      const response = await axios.get(`${apiBase}/api/addresses/user/${user.id}/addresses`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      console.log('🔍 CartView: Address API response:', response.data);

      if (response.data && response.data.length > 0) {
        // Find primary address or first address
        const primaryAddress = response.data.find(addr => addr.is_primary) || response.data[0];
        
        console.log('🔍 CartView: Primary address found:', primaryAddress);
        
        if (primaryAddress && primaryAddress.cityVillage && primaryAddress.province) {
          const addressString = `${primaryAddress.cityVillage}, ${primaryAddress.province}`;
          console.log('🔍 CartView: Setting user address:', addressString);
          setUserAddress(addressString);
        } else {
          console.log('🔍 CartView: Address missing city/province');
          setUserAddress('');
        }
      } else {
        console.log('🔍 CartView: No addresses found');
        setUserAddress('');
      }
    } catch (error) {
      console.error('🔍 CartView: Error fetching user address:', error);
      setUserAddress('');
    }
  }, []);

  useEffect(() => {
    fetchUserAddress();
  }, [fetchUserAddress]);

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    // Validate that all items have valid vendor_id
    const invalidItems = items.filter(item => !item.vendor_id || item.vendor_id === null || item.vendor_id === undefined);
    if (invalidItems.length > 0) {
      console.error('Invalid cart items found:', invalidItems);
      console.error('All cart items:', items);
      alert(`Some items in your cart have missing vendor information:\n\n${invalidItems.map(item => `• ${item.name || 'Unknown Item'} (${item.size})`).join('\n')}\n\nPlease remove these items and re-add them from the product page.`);
      return;
    }
    
    console.log('🔍 CartView: handleCheckout - userAddress:', userAddress);
    
    // Validate delivery address
    if (!userAddress || userAddress.trim() === '') {
      console.log('🔍 CartView: No address found, showing modal');
      setShowAddressModal(true);
      return;
    }
    
    // Validate delivery date and time
    if (!deliveryDate) {
      alert('Please select a delivery date');
      return;
    }
    
    if (!deliveryTime) {
      alert('Please select a delivery time');
      return;
    }
    
    // Navigate to checkout with cart items and delivery info
    navigate('/checkout', { 
      state: { 
        fromCart: true,
        items: items,
        totalPrice: totalPrice,
        deliveryDate: deliveryDate,
        deliveryTime: deliveryTime
      } 
    });
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    // Check if user has contact number
    const userRaw = sessionStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (!user.contact_no || user.contact_no.trim() === '') {
        setShowContactNumberModal(true);
        return;
      }
    }
    
    console.log('🔍 CartView: handleProceedToCheckout - userAddress:', userAddress);
    
    // Validate delivery address
    if (!userAddress || userAddress.trim() === '') {
      console.log('🔍 CartView: No address found, showing modal');
      setShowAddressModal(true);
      return;
    }
    
    // Show delivery form first
    setShowDeliveryForm(true);
  };

  const handleQuantityChange = (flavorId, size, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(flavorId, size);
    } else {
      updateQuantity(flavorId, size, newQuantity);
    }
  };

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
            <div className="text-4xl sm:text-6xl mb-4">🛒</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Add some delicious ice cream flavors to get started!</p>
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
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Reserved Items</h2>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium self-end sm:self-auto"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
        {items.map((item, index) => (
          <div key={`${item.flavor_id}-${item.size}`} className="bg-white rounded-lg p-2 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between space-x-2">
              {/* Left side: Checkbox + Content */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 flex-shrink-0"
                />
                
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
                    <p className="text-xs sm:text-sm text-gray-800 font-medium mb-1 sm:mb-2 truncate" title={item.flavor_name || item.name || 'No flavor name'}>
                      {item.flavor_name || item.name || 'No flavor name'}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-0.5 sm:space-y-0 sm:space-x-4">
                      <span className="text-[11px] sm:text-sm text-gray-600 font-medium">Size: {item.size}</span>
                      <span className="text-[11px] sm:text-sm text-gray-600">Unit Price: ₱{item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Bottom row for mobile - Quantity, Price */}
                  <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-4">
                    {/* Quantity Display */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-xs sm:text-sm text-gray-600">Qty:</span>
                      <span className="w-6 sm:w-8 text-center font-medium text-xs sm:text-base">{item.quantity}</span>
                    </div>

                    {/* Total Price */}
                    <div className="text-right sm:text-left flex items-center">
                      <p className="text-sm sm:text-lg font-bold text-gray-800">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remove Button - Right side */}
              <button
                onClick={() => removeFromCart(item.flavor_id, item.size)}
                className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center flex-shrink-0"
                title="Remove item"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Schedule Section */}
      {showDeliveryForm && (
        <div className="bg-white rounded-lg p-3 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Schedule Delivery</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`w-full px-2 sm:px-4 py-1.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-base ${
                  !deliveryDate ? 'border-red-300' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Delivery Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className={`w-full px-2 sm:px-4 py-1.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-base ${
                  !deliveryTime ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
            </div>
          </div>
          
          {(!deliveryDate || !deliveryTime) && (
            <p className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4">
              Please select both date and time to proceed with checkout
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowDeliveryForm(false)}
              className="px-3 sm:px-6 py-1.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={!deliveryDate || !deliveryTime}
              className="px-3 sm:px-6 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      <div className="border-t pt-3 sm:pt-4">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <span className="text-base sm:text-lg font-semibold text-gray-800">Total:</span>
          <span className="text-lg sm:text-xl font-bold text-orange-600">₱{totalPrice.toFixed(2)}</span>
        </div>
        
        {!showDeliveryForm ? (
          <button
            onClick={handleProceedToCheckout}
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <span>Schedule Delivery & Checkout</span>
          </button>
        ) : (
          <div className="text-center text-xs sm:text-sm text-gray-600">
            Please complete the delivery schedule above to proceed
          </div>
        )}
        </div>
      </div>
      </div>

      {/* Address Required Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-2">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Address Required</h2>
                <button 
                  onClick={() => setShowAddressModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Warning Icon */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-3 sm:mb-4">
                  <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                  Delivery Address Required
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 px-2">
                  Please add a delivery address in your profile settings before proceeding to checkout.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mb-4 sm:mb-6">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-blue-800 font-medium mb-1">How to add your address:</p>
                    <p className="text-xs text-blue-700 leading-tight">
                      Click "Go to Address Settings" below → Click "Add New Address" → Fill city & province → Use Address
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    navigate('/customer?view=settings&tab=addresses');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium border-2 border-blue-200 hover:bg-blue-100 transition-colors text-sm sm:text-base"
                >
                  Go to Address Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {console.log('🎯 CartView: Rendering FeedbackModal with isOpen:', showFeedbackModal)}
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

export default CartView;
