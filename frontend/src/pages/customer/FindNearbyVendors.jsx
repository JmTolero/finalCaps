import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { NavWithLogo } from "../../components/shared/nav";
import { useCart } from "../../contexts/CartContext";
import CustomerVendorMap from "../../components/customer/CustomerVendorMap";
import axios from "axios";

// Import customer icons
import cartIcon from "../../assets/images/customerIcon/cart.png";
import feedbackIcon from "../../assets/images/customerIcon/feedbacks.png";
import notifIcon from "../../assets/images/customerIcon/notifbell.png";
import productsIcon from "../../assets/images/customerIcon/productsflavor.png";
import shopsIcon from "../../assets/images/customerIcon/shops.png";

export const FindNearbyVendors = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  
  // Reviews state
  const [vendorReviews, setVendorReviews] = useState({});
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchVendors();
  }, []);

  // Fetch notifications for customer
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/notifications/customer/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
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
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";

      // Fetch vendors with their locations
      const response = await axios.get(`${apiBase}/api/vendor/with-locations`);
      if (response.data.success) {
        setVendors(response.data.vendors);
        if (response.data.vendors.length > 0) {
          setSelectedVendor(response.data.vendors[0]);
        }
        
        // Fetch reviews for each vendor
        fetchAllVendorReviews(response.data.vendors);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews for all vendors
  const fetchAllVendorReviews = async (vendorsList) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const reviewsData = {};

      // Fetch reviews for each vendor
      await Promise.all(
        vendorsList.map(async (vendor) => {
          try {
            const response = await axios.get(
              `${apiBase}/api/reviews/vendor/${vendor.vendor_id}`
            );
            if (response.data.success) {
              reviewsData[vendor.vendor_id] = response.data.summary;
            }
          } catch (error) {
            console.error(`Error fetching reviews for vendor ${vendor.vendor_id}:`, error);
            // Set default values if fetch fails
            reviewsData[vendor.vendor_id] = {
              total_reviews: 0,
              average_rating: "0.00"
            };
          }
        })
      );

      setVendorReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching vendor reviews:", error);
    }
  };

  // Calculate distance between two coordinates (in kilometers)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter vendors based on location proximity and search term
  const filteredVendors = vendors.filter((vendor) => {
    // If no user location, show all vendors (fallback)
    if (!userLocation) {
      return (
        (vendor.store_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (vendor.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    
    // Calculate distance from user to vendor
    const vendorLat = parseFloat(vendor.latitude);
    const vendorLng = parseFloat(vendor.longitude);
    
    if (isNaN(vendorLat) || isNaN(vendorLng)) {
      return false; // Skip vendors without valid coordinates
    }
    
    const distance = calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      vendorLat, 
      vendorLng
    );
    
    // Show only vendors within 15km radius
    const isNearby = distance <= 15;
    
    // Also check search term if provided
    const matchesSearch = !searchTerm || 
      (vendor.store_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (vendor.location?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    return isNearby && matchesSearch;
  });

  // Handle vendor selection from map
  const handleVendorSelect = (vendor) => {
    // Find the corresponding vendor from the real vendors list
    const realVendor = vendors.find(v => 
      v.store_name === vendor.name || 
      v.vendor_id === vendor.id ||
      v.location === vendor.location
    );
    
    if (realVendor) {
      setSelectedVendor(realVendor);
    } else {
      // If no match found, create a vendor object from the marker data
      setSelectedVendor({
        vendor_id: vendor.id,
        store_name: vendor.name,
        location: vendor.location || 'Location not specified',
        profile_image_url: null,
        rating: vendor.rating || 4.5,
        flavors: vendor.flavors || [],
        drumSizes: vendor.drumSizes || []
      });
    }
  };

  // Handle location change from map
  const handleLocationChange = (location, zone) => {
    setUserLocation(location);
    setSelectedZone(zone);
  };

  return (
    <>
      <NavWithLogo />

      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vendor nearby..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 pr-4 text-gray-700 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 ml-6">
              <Link
                to="/find-vendors"
                className="text-blue-700 hover:text-blue-800 font-medium underline"
              >
                Find nearby Vendors
              </Link>

              {/* Navigation Icons */}
              <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 shadow-sm">
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigate("/customer")}
                  className={`p-2 rounded-lg transition-colors ${
                    location.pathname === '/customer' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img src={productsIcon} alt="Products" className="w-5 h-5" />
                </button>

                {/* Shops Icon */}
                <button 
                  onClick={() => navigate("/all-vendor-stores")}
                  className={`p-2 rounded-lg transition-colors ${
                    location.pathname === '/all-vendor-stores' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img src={shopsIcon} alt="Shops" className="w-5 h-5" />
                </button>

                {/* Notification Bell */}
                <button
                  onClick={() => navigate("/customer/notifications")}
                  className={`p-2 rounded-lg transition-colors relative ${
                    location.pathname === '/customer/notifications' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img
                    src={notifIcon}
                    alt="Notifications"
                    className="w-5 h-5"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Cart Icon */}
                <button 
                  onClick={() => navigate("/cart")}
                  className={`p-2 rounded-lg transition-all duration-200 relative ${
                    location.pathname === '/cart'
                      ? 'bg-blue-100 hover:bg-blue-200 shadow-sm' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Cart" 
                    className="w-5 h-5 transition-transform duration-200"
                  />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Vendor Information */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-blue-600 mb-6">
              Find nearby Vendors
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Loading vendors...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVendors.map((vendor) => (
                  <div
                    key={vendor.vendor_id}
                    className={`bg-blue-50 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                      selectedVendor?.vendor_id === vendor.vendor_id
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Vendor Logo */}
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {vendor.profile_image_url ? (
                          <img
                            src={`${
                              process.env.REACT_APP_API_URL ||
                              "http://localhost:3001"
                            }/uploads/vendor-documents/${
                              vendor.profile_image_url
                            }`}
                            alt={vendor.store_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
                            <span className="text-2xl">🍦</span>
                          </div>
                        )}
                      </div>

                      {/* Vendor Details */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-800">
                            {vendor.store_name || 'Unnamed Store'}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm text-gray-600">
                              {vendorReviews[vendor.vendor_id] ? (
                                <>
                                  {parseFloat(vendorReviews[vendor.vendor_id].average_rating).toFixed(1)}{" "}
                                  ({vendorReviews[vendor.vendor_id].total_reviews}{" "}
                                  {vendorReviews[vendor.vendor_id].total_reviews === 1 ? 'review' : 'reviews'})
                                </>
                              ) : (
                                'No reviews yet'
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center space-x-2 mb-3">
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-gray-600">
                            {vendor.location || 'Location not specified'}
                          </span>
                          {userLocation && vendor.latitude && vendor.longitude && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {calculateDistance(
                                userLocation.lat,
                                userLocation.lng,
                                parseFloat(vendor.latitude),
                                parseFloat(vendor.longitude)
                              ).toFixed(1)} km away
                            </span>
                          )}
                        </div>

                        {/* Drum Sizes */}
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">
                            Available Drum Sizes:
                          </h4>
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              Large
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              Medium
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              Small
                            </span>
                          </div>
                        </div>

                        {/* Flavors */}
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">
                            Flavors:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {vendor.flavors && vendor.flavors.length > 0 ? (
                              vendor.flavors
                                .slice(0, 3)
                                .map((flavor, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                                  >
                                    {flavor.flavor_name}
                                  </span>
                                ))
                            ) : (
                              <>
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                  Mango
                                </span>
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                  Ube
                                </span>
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                  Choco
                                </span>
                              </>
                            )}
                          </div>
                        </div>


                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button 
                            onClick={() => navigate(`/vendor/${vendor.vendor_id}/store`)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                          >
                            View Shop
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Map */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">
                  Find Vendors Near You
                </h3>
                <p className="text-blue-100 text-sm">
                  Click on markers to view vendor details and delivery options
                </p>
              </div>
              
              <div className="p-4">
                <CustomerVendorMap
                  onVendorSelect={handleVendorSelect}
                  onLocationChange={handleLocationChange}
                  className="w-full h-96"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FindNearbyVendors;
