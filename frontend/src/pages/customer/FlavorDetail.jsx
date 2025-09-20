import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';

export const FlavorDetail = () => {
  const { flavorId } = useParams();
  const navigate = useNavigate();
  const [flavor, setFlavor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('large');
  const [quantity, setQuantity] = useState(1);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  useEffect(() => {
    fetchFlavorDetails();
  }, [flavorId]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Navigation Icons */}
          <div className="flex justify-end mb-6">
            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
               <button 
                 onClick={() => navigate('/customer')}
                 className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
               >
                <img src={productsIcon} alt="Products" className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/find-vendors')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img src={shopsIcon} alt="Shops" className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <img src={notifIcon} alt="Notifications" className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <img src={cartIcon} alt="Cart" className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <img src={feedbackIcon} alt="Support" className="w-5 h-5" />
              </button>
            </div>
          </div>
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
                       <span className="text-yellow-500 text-lg">★★★★★</span>
                       <span className="text-gray-600">4.4</span>
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
                     <button className="px-8 py-3 border-2 border-gray-400 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors">
                       Reserve
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
                      src={flavor.profile_image_url} 
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
                <button className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors">
                  View Shop
                </button>
                <button className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors">
                  Contact Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
