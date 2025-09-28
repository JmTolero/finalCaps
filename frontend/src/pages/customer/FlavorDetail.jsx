import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';
import StarRating from '../../components/shared/StarRating';
import { useCart } from '../../contexts/CartContext';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';

export const FlavorDetail = () => {
  const { flavorId } = useParams();
  const navigate = useNavigate();
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
  const [showContactModal, setShowContactModal] = useState(false);
  
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
        setFlavor(response.data.flavor);
        
        // Parse and set images
        if (response.data.flavor.image_url) {
          try {
            const images = JSON.parse(response.data.flavor.image_url);
            setSelectedImages(Array.isArray(images) ? images : [images]);
          } catch (e) {
            setSelectedImages([response.data.flavor.image_url]);
          }
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
    
    // Validate required fields
    if (!deliveryDate) {
      alert('Please select a delivery date');
      return;
    }
    
    if (!deliveryTime) {
      alert('Please select a delivery time');
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

    await addToCart(cartItem);
    alert(`Added ${quantity} ${selectedSize} ${flavor.flavor_name} to your cart!`);
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
    if (!flavor || !flavor.drum_availability) return 0;
    
    // Get availability for the selected size
    const availability = flavor.drum_availability[selectedSize];
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
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-end mb-6">
            <div className="flex items-center space-x-4">
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium">
                Find nearby Vendors
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 shadow-sm">
                {/* Products/Flavors Icon - Navigate back to customer dashboard */}
                <button 
                  onClick={() => navigate('/customer')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={productsIcon} alt="Products" className="w-5 h-5" />
                </button>
                
                {/* Shops Icon */}
                <Link to="/all-vendor-stores" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={shopsIcon} alt="Shops" className="w-5 h-5" />
                </Link>
                
                {/* Notification Bell */}
                <button 
                  onClick={() => {
                    console.log('🔔 FlavorDetail: Notification button clicked');
                    navigate('/customer/notifications');
                  }}
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
                  onClick={() => {
                    console.log('🛒 FlavorDetail: Cart button clicked');
                    navigate('/cart');
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 relative ${
                    totalItems > 0
                      ? 'bg-orange-100 hover:bg-orange-200 shadow-sm'
                      : 'hover:bg-gray-100'
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
                <button 
                  onClick={() => {
                    console.log('💬 FlavorDetail: Feedback button clicked');
                    navigate('/customer?view=feedback');
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={feedbackIcon} alt="Feedback" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8">
        <div className="max-w-6xl mx-auto px-6">
          {/* Main Product Card */}
          <div className="bg-sky-100 rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="flex flex-col lg:flex-row">
              {/* Product Images */}
              <div className="lg:w-1/2 p-8">
                 <div className="space-y-4">
                   {/* Main Image */}
                   <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                     {selectedImages[currentImageIndex] ? (
                       <img 
                         src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${selectedImages[currentImageIndex]}`}
                         alt={flavor.flavor_name}
                         className="w-full h-full object-cover"
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
                           className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                           </svg>
                         </button>
                         <button
                           onClick={() => setCurrentImageIndex(prev => prev < selectedImages.length - 1 ? prev + 1 : 0)}
                           className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                         </button>
                       </>
                     )}
                   </div>
                   
                   {/* Thumbnail Images */}
                   {selectedImages.length > 1 && (
                     <div className="flex space-x-2 overflow-x-auto pb-2">
                       {selectedImages.map((image, index) => (
                         <button
                           key={index}
                           onClick={() => setCurrentImageIndex(index)}
                           className={`w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                             currentImageIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                           }`}
                         >
                           <img 
                             src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${image}`}
                             alt={`${flavor.flavor_name} ${index + 1}`}
                             className="w-full h-full object-cover"
                           />
                         </button>
                       ))}
                     </div>
                   )}
                   
                   {/* Image counter */}
                   {selectedImages.length > 1 && (
                     <div className="text-center text-sm text-gray-500">
                       {currentImageIndex + 1} of {selectedImages.length}
                     </div>
                   )}
                 </div>
              </div>

              {/* Product Details */}
              <div className="lg:w-1/2 p-8">
                <div className="space-y-6">
                   {/* Product Title */}
                   <div>
                     <h1 className="text-3xl font-bold text-gray-800 mb-2">
                       {flavor.flavor_name}
                     </h1>
                     <div className="flex items-center space-x-2 mb-3">
                       <StarRating 
                         rating={parseFloat(flavor.average_rating) || 0}
                         size="md"
                         showCount={true}
                         totalRatings={flavor.total_ratings || 0}
                       />
                     </div>
                     {/* Flavor Description */}
                     {flavor.flavor_description && (
                       <p className="text-gray-600 text-base leading-relaxed">
                         {flavor.flavor_description}
                       </p>
                     )}
                   </div>

                   {/* Price */}
                  <div className="text-3xl font-bold text-blue-600">
                    {getPrice()}
                  </div>

                   {/* Quantity Selector */}
                   <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2">
                       <button 
                         onClick={() => handleQuantityChange(-1)}
                         disabled={quantity <= 1}
                         className={`w-8 h-8 rounded-full flex items-center justify-center ${
                           quantity <= 1 
                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                             : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                         }`}
                       >
                         -
                       </button>
                       <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                       <button 
                         onClick={() => handleQuantityChange(1)}
                         disabled={quantity >= getAvailableDrums()}
                         className={`w-8 h-8 rounded-full flex items-center justify-center ${
                           quantity >= getAvailableDrums()
                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                             : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                         }`}
                       >
                         +
                       </button>
                     </div>
                     <span className="text-gray-600">{getAvailableDrums()} drums available</span>
                   </div>

                  {/* Size Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Select Size</h3>
                    <div className="flex space-x-3">
                      {flavor.available_sizes.map((size) => (
                         <button
                           key={size}
                           onClick={() => handleSizeChange(size)}
                           className={`px-6 py-3 rounded-full font-medium transition-colors ${
                             selectedSize === size
                               ? 'text-gray-800'
                               : 'bg-white text-gray-700 hover:bg-gray-100'
                           }`}
                           style={{
                             backgroundColor: selectedSize === size ? '#FFDDAE' : 'white'
                           }}
                         >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                   {/* Schedule Delivery */}
                   <div className="space-y-3">
                     <div className="flex items-center space-x-2 text-gray-600">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                       </svg>
                       <span>Schedule to Deliver <span className="text-red-500">*</span></span>
                     </div>
                     <div className="flex space-x-3">
                       <div className="flex-1">
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                           Date <span className="text-red-500">*</span>
                         </label>
                         <input
                           type="date"
                           value={deliveryDate}
                           onChange={(e) => setDeliveryDate(e.target.value)}
                           className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                             !deliveryDate ? 'border-red-300' : 'border-gray-300'
                           }`}
                           min={new Date().toISOString().split('T')[0]}
                           required
                         />
                       </div>
                       <div className="flex-1">
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                           Time <span className="text-red-500">*</span>
                         </label>
                         <input
                           type="time"
                           value={deliveryTime}
                           onChange={(e) => setDeliveryTime(e.target.value)}
                           className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                             !deliveryTime ? 'border-red-300' : 'border-gray-300'
                           }`}
                           required
                         />
                       </div>
                     </div>
                     {(!deliveryDate || !deliveryTime) && (
                       <p className="text-sm text-red-600">
                         Please select both date and time to proceed with booking
                       </p>
                     )}
                   </div>

                   {/* Action Buttons */}
                   <div className="flex justify-end space-x-4 pt-16">
                     <button 
                       onClick={handleReserve}
                       className="px-8 py-3 border-2 border-gray-400 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                       </svg>
                       <span>Reserve</span>
                     </button>
                     <button 
                       onClick={handleBookNow}
                       className="px-8 py-3 text-gray-800 rounded-full font-medium hover:opacity-80 transition-colors"
                       style={{ backgroundColor: '#FFDDAE' }}
                     >
                       Book now
                     </button>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Information Card */}
          <div className="bg-sky-100 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {flavor.profile_image_url ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/vendor-documents/${flavor.profile_image_url}`}
                      alt={flavor.store_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{flavor.store_name}</h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="text-gray-600">5.0</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => navigate(`/vendor/${flavor.vendor_id}/store`)}
                  className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
                >
                  View Shop
                </button>
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Contact {flavor.store_name}</h2>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Vendor Info */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  {flavor.profile_image_url ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/vendor-documents/${flavor.profile_image_url}`}
                      alt={flavor.store_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{flavor.store_name}</h3>
                    <p className="text-sm text-gray-600">{flavor.fname} {flavor.lname}</p>
                    <p className="text-sm text-gray-500">{flavor.location}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Contact Information</h4>
                
                {/* Phone Number */}
                {flavor.contact_no && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">{flavor.contact_no}</p>
                    </div>
                    <a 
                      href={`tel:${flavor.contact_no}`}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Call
                    </a>
                  </div>
                )}

                {/* Email */}
                {flavor.email && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-900">{flavor.email}</p>
                    </div>
                    <a 
                      href={`mailto:${flavor.email}`}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Email
                    </a>
                  </div>
                )}

              </div>

              {/* Business Hours Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Business Hours</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please contact during business hours for the best response time. 
                      Most vendors respond within 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Rate {flavor?.flavor_name}</h2>
                <button 
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Rating Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this flavor..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRateFlavor}
                  disabled={ratingLoading || newRating === 0}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
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
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="bg-sky-100 rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>
            <button 
              onClick={() => setShowRatingModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rate This Flavor
            </button>
          </div>
          
          {ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.rating_id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">
                        {rating.fname} {rating.lname}
                      </span>
                      <StarRating rating={rating.rating} size="sm" />
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.review_text && (
                    <p className="text-gray-600 text-sm">{rating.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-4">Be the first to rate this flavor!</p>
              <button 
                onClick={() => setShowRatingModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Rate This Flavor
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
