import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import axios from 'axios';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';

export const CartView = () => {
  const navigate = useNavigate();
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
    
    if (itemsNeedingImages.length === 0) return;

    console.log('🔍 Fetching images for', itemsNeedingImages.length, 'items without images');

    for (const item of itemsNeedingImages) {
      try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const response = await axios.get(`${apiBase}/api/flavors/${item.flavor_id}`);
        
        if (response.data.success && response.data.flavor.image_url) {
          let imageUrl = response.data.flavor.image_url;
          
          // Parse JSON if it's a string
          try {
            const parsedImages = JSON.parse(imageUrl);
            imageUrl = Array.isArray(parsedImages) ? parsedImages[0] : parsedImages;
          } catch (e) {
            // imageUrl is already a string, use as is
          }
          
          setFlavorImages(prev => ({
            ...prev,
            [item.flavor_id]: imageUrl
          }));
          
          console.log('🔍 Fetched image for flavor', item.flavor_id, ':', imageUrl);
        }
      } catch (error) {
        console.error('🔍 Error fetching image for flavor', item.flavor_id, ':', error);
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
            <div className="flex items-center justify-end mb-3 sm:mb-4 lg:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base">
                  Find nearby Vendors
                </Link>
                
                {/* Navigation Icons */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                  {/* Products/Flavors Icon - Navigate to browse flavors */}
                  <button 
                    onClick={() => {
                      // Navigate to customer dashboard
                      navigate('/customer');
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Browse Flavors"
                  >
                    <img src={productsIcon} alt="Products" className="w-5 h-5" />
                  </button>
                  
                  {/* Shops Icon */}
                  <Link to="/all-vendor-stores" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <img src={shopsIcon} alt="Shops" className="w-5 h-5" />
                  </Link>
                  
                  {/* Notification Bell */}
                  <button 
                    onClick={() => navigate('/customer/notifications')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                  >
                    <img src={notifIcon} alt="Notifications" className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Cart Icon */}
                  <button 
                    onClick={() => navigate('/cart')}
                    className={`p-2 rounded-lg transition-all duration-200 relative ${
                      'bg-orange-100 hover:bg-orange-200 shadow-sm'
                    }`}
                    title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                  >
                    <img 
                      src={cartIcon} 
                      alt="Cart" 
                      className={`w-5 h-5 transition-transform duration-200 ${
                        totalItems > 0 ? 'scale-110' : ''
                      }`} 
                    />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
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
              className="bg-orange-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
            >
              Browse Flavors
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-end mb-6">
            <div className="flex items-center space-x-4">
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium">
                Find nearby Vendors
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                {/* Products/Flavors Icon */}
                <button 
                  onClick={() => navigate('/customer')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2"
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
                
                {/* Cart Icon - Active on cart page */}
                <button 
                  onClick={() => navigate('/cart')}
                  className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors relative sm:p-2"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-sky-100 rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Reserved Items</h2>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-800 text-sm font-medium self-end sm:self-auto"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {items.map((item, index) => (
          <div key={`${item.flavor_id}-${item.size}`} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Checkbox */}
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 self-start sm:self-auto"
              />
              
              {/* Item Image */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {(() => {
                  console.log('🔍 Cart item image debug:', {
                    item: item,
                    image_url: item.image_url,
                    flavor_image_url: item.flavor_image_url,
                    allKeys: Object.keys(item),
                    allFields: Object.keys(item).map(key => `${key}: ${item[key]}`)
                  });
                  
                  // Check multiple possible field names for the image
                  const imageField = item.image_url || item.flavor_image_url || item.image || item.flavor_image || flavorImages[item.flavor_id];
                  
                  const imagePath = imageField ? `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageField}` : null;
                  
                  console.log('🔍 Image field found:', imageField);
                  console.log('🔍 Image path:', imagePath);
                  
                  return imagePath ? (
                    <img
                      src={imagePath}
                      alt={item.flavor_name || item.name || 'Flavor'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('🔍 Image failed to load:', imagePath);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      🍦
                    </div>
                  );
                })()}
                <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: 'none'}}>
                  🍦
                </div>
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-1">
                  {item.vendor_name}
                </h3>
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {item.flavor_name || item.name || 'No flavor name'}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                  <span className="text-sm text-gray-600 font-medium">Size: {item.size}</span>
                  <span className="text-sm text-gray-600">Unit Price: ₱{item.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Bottom row for mobile - Quantity, Price, Remove */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-4">
                {/* Quantity Display */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Qty:</span>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                </div>

                {/* Total Price */}
                <div className="text-right sm:text-left">
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.flavor_id, item.size)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove item"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Schedule Section */}
      {showDeliveryForm && (
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Schedule Delivery</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${
                  !deliveryDate ? 'border-red-300' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${
                  !deliveryTime ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
            </div>
          </div>
          
          {(!deliveryDate || !deliveryTime) && (
            <p className="text-sm text-red-600 mb-4">
              Please select both date and time to proceed with checkout
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowDeliveryForm(false)}
              className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={!deliveryDate || !deliveryTime}
              className="px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-800">Total:</span>
          <span className="text-xl font-bold text-orange-600">₱{totalPrice.toFixed(2)}</span>
        </div>
        
        {!showDeliveryForm ? (
          <button
            onClick={handleProceedToCheckout}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <span>Schedule Delivery & Checkout</span>
          </button>
        ) : (
          <div className="text-center text-sm text-gray-600">
            Please complete the delivery schedule above to proceed
          </div>
        )}
        </div>
      </div>
      </div>

      {/* Address Required Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Address Required</h2>
                <button 
                  onClick={() => setShowAddressModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Warning Icon */}
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  Delivery Address Required
                </h3>
                <p className="text-sm text-gray-500">
                  Please add a delivery address in your profile settings before proceeding to checkout.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-blue-800 font-medium mb-1">How to add your address:</p>
                    <p className="text-xs text-blue-700 leading-tight">
                      Click "Go to Address Settings" below → Click "Add New Address" → Fill city & province → Set as primary
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    navigate('/customer?view=settings&tab=addresses');
                  }}
                  className="flex-1 px-4 py-2 bg-orange-300 text-black rounded-lg font-medium hover:bg-orange-400 transition-colors"
                >
                  Go to Address Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartView;
