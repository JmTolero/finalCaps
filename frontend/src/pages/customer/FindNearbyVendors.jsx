import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { NavWithLogo } from "../../components/shared/nav";
import { useCart } from "../../contexts/CartContext";
import CustomerVendorMap from "../../components/customer/CustomerVendorMap";
import FeedbackModal from '../../components/shared/FeedbackModal';
import axios from "axios";

// Import customer icons
import cartIcon from "../../assets/images/customerIcon/cart.png";
import feedbackIcon from "../../assets/images/customerIcon/feedbacks.png";
import notifIcon from "../../assets/images/customerIcon/notifbell.png";
import productsIcon from "../../assets/images/customerIcon/productsflavor.png";
import shopsIcon from "../../assets/images/customerIcon/shops.png";
import findNearbyIcon from "../../assets/images/vendordashboardicon/findnearby.png";

export const FindNearbyVendors = () => {
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
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Separate input state for non-refreshing input
  const [userLocation, setUserLocation] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  
  // Reviews state
  const [vendorReviews, setVendorReviews] = useState({});
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
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
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-6 sm:py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col gap-3 sm:hidden mb-3">
            {/* Top Row: Find nearby Vendors + Icons */}
            <div className="flex items-center justify-between">
              <Link
                to="/find-vendors"
                className={`p-1.5 rounded-lg transition-colors shadow-sm ${
                  location.pathname === '/find-vendors' 
                    ? 'bg-blue-100 hover:bg-blue-200' 
                    : 'bg-white hover:bg-gray-100'
                }`}
                title="Find nearby Vendors"
              >
                <img src={findNearbyIcon} alt="Find nearby Vendors" className="w-5 h-5" />
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigateOptimized("/customer")}
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
                <button 
                  onClick={() => navigateOptimized("/all-vendor-stores")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    location.pathname === '/all-vendor-stores' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="All Vendor Stores"
                >
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4" />
                </button>

                {/* Notification Bell */}
                <button
                  onClick={() => navigateOptimized("/customer/notifications")}
                  className={`p-1.5 rounded-lg transition-colors relative ${
                    location.pathname === '/customer/notifications' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
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
                  onClick={() => navigateOptimized("/cart")}
                  className={`p-1.5 rounded-lg transition-all duration-200 relative ${
                    location.pathname === '/cart'
                      ? 'bg-blue-100 hover:bg-blue-200 shadow-sm' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in favorites`}
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
            
            {/* Bottom Row: Search Bar */}
            <div className="w-full">
              <div className="relative flex">
                <input
                  type="text"
                  placeholder="Search vendor nearby..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="flex-1 px-3 py-2.5 pl-8 pr-3 text-sm text-gray-700 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-r-0"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
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
                  placeholder="Search vendor nearby..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="flex-1 px-4 py-3 pl-10 pr-4 text-base text-gray-700 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-r-0"
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
            
            <div className="flex items-center space-x-4 lg:space-x-4">
              <Link
                to="/find-vendors"
                className={`px-3 py-1.5 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap ml-3 transition-colors ${
                  location.pathname === '/find-vendors' 
                    ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' 
                    : 'text-blue-700 hover:text-blue-800 hover:bg-gray-100'
                }`}
                title="Find nearby Vendors"
              >
                Find nearby Vendors
              </Link>

              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigateOptimized("/customer")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    location.pathname === '/customer' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Products & Flavors"
                >
                  <img src={productsIcon} alt="Products" className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Shops Icon */}
                <button 
                  onClick={() => navigateOptimized("/all-vendor-stores")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    location.pathname === '/all-vendor-stores' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="All Vendor Stores"
                >
                  <img src={shopsIcon} alt="Shops" className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Notification Bell */}
                <button
                  onClick={() => navigateOptimized("/customer/notifications")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors relative ${
                    location.pathname === '/customer/notifications' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Notifications"
                >
                  <img
                    src={notifIcon}
                    alt="Notifications"
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Cart Icon */}
                <button 
                  onClick={() => navigateOptimized("/cart")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 relative ${
                    location.pathname === '/cart'
                      ? 'bg-blue-100 hover:bg-blue-200 shadow-sm' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in favorites`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Favorites" 
                    className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200"
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
                    <img src={feedbackIcon} alt="Feedback" className="w-5 h-5 sm:w-6 sm:h-6" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mobile Layout - Title and Map on Top */}
        <div className="xl:hidden mb-6 lg:mb-8">
          {/* "Find nearby Vendors" Title at Top for Mobile */}
          <div className="mx-2 sm:mx-0 mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-3 sm:mb-4">
              Find nearby Vendors
            </h2>
            
            {/* Location Accuracy Legend */}
            <div className="flex flex-wrap gap-2 lg:gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-100 border border-green-300 rounded-full"></div>
                <span className="text-gray-600">Exact Location</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-100 border border-yellow-300 rounded-full"></div>
                <span className="text-gray-600">Approximate</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-100 border border-gray-300 rounded-full"></div>
                <span className="text-gray-600">Location Needed</span>
              </div>
            </div>
          </div>
          
          {/* Map Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mx-2 sm:mx-0">
            <div className="p-3 sm:p-4">
              <CustomerVendorMap
                onVendorSelect={handleVendorSelect}
                onLocationChange={handleLocationChange}
                className="w-full h-48 sm:h-60"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
          {/* Left Side - Vendor Information */}
          <div className="space-y-4 lg:space-y-6">
            {/* Desktop Title - Hidden on mobile since it's now at the top */}
            <div className="hidden xl:flex flex-col gap-4 mb-4 lg:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">
                Find nearby Vendors
              </h2>
              
              {/* Location Accuracy Legend */}
              <div className="flex flex-wrap gap-2 lg:gap-3">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-100 border border-green-300 rounded-full"></div>
                  <span className="text-gray-600">Exact Location</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-100 border border-yellow-300 rounded-full"></div>
                  <span className="text-gray-600">Approximate</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-100 border border-gray-300 rounded-full"></div>
                  <span className="text-gray-600">Location Needed</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3 sm:gap-4">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm sm:text-base text-gray-600">Loading vendors...</p>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg mx-2 sm:mx-0">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 px-4">No Vendors Found</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 px-4">
                  {searchTerm ? 
                    `No vendors match "${searchTerm}". Try searching with different keywords or check your location.` :
                    "No vendors found in your area. Try adjusting your location or search criteria."
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredVendors.map((vendor) => (
                  <div
                    key={vendor.vendor_id}
                    className={`bg-blue-50 rounded-lg p-4 sm:p-6 cursor-pointer transition-all duration-200 mx-2 sm:mx-0 ${
                      selectedVendor?.vendor_id === vendor.vendor_id
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      {/* Vendor Logo */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mx-auto sm:mx-0">
                        {vendor.profile_image_url ? (
                          <img
                            src={vendor.profile_image_url}
                            alt={vendor.store_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
                            <span className="text-lg sm:text-2xl">🍦</span>
                          </div>
                        )}
                      </div>

                      {/* Vendor Details */}
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1 sm:gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                            {vendor.store_name || 'Unnamed Store'}
                          </h3>
                          <div className="flex items-center justify-center sm:justify-end space-x-1">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-600">
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <div className="flex items-center justify-center sm:justify-start space-x-2">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                              {vendor.location || 'Location not specified'}
                            </span>
                          </div>
                          
                          {/* Badges Container */}
                          <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2">
                            {/* Location Accuracy Badge */}
                            {vendor.exact_latitude && vendor.exact_longitude ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">Exact Location</span>
                                <span className="sm:hidden">Exact</span>
                              </span>
                            ) : vendor.latitude && vendor.longitude ? (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">Approximate</span>
                                <span className="sm:hidden">~</span>
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">Location Needed</span>
                                <span className="sm:hidden">Need Loc</span>
                              </span>
                            )}
                            
                            {userLocation && vendor.latitude && vendor.longitude && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {calculateDistance(
                                  userLocation.lat,
                                  userLocation.lng,
                                  parseFloat(vendor.latitude),
                                  parseFloat(vendor.longitude)
                                ).toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Drum Sizes */}
                        <div className="mb-3">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 text-center sm:text-left">
                            Available Drum Sizes:
                          </h4>
                          <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2">
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
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 text-center sm:text-left">
                            Flavors:
                          </h4>
                          <div className="flex flex-wrap justify-center sm:justify-start gap-1">
                            {vendor.flavors && vendor.flavors.length > 0 ? (
                              vendor.flavors
                                .slice(0, 3)
                                .map((flavor, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded truncate max-w-20"
                                    title={flavor.flavor_name}
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
                        <div className="flex justify-center sm:justify-start">
                          <button 
                            onClick={() => navigateOptimized(`/vendor/${vendor.vendor_id}/store`)}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm sm:text-base"
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

          {/* Right Side - Map (Desktop Only) */}
          <div className="hidden xl:block space-y-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 lg:px-6 py-3 lg:py-4">
                <h3 className="text-lg lg:text-xl font-bold text-white">
                  Find Vendors Near You
                </h3>
                <p className="text-blue-100 text-xs lg:text-sm">
                  Click on markers to view vendor details and delivery options
                </p>
              </div>
              
              <div className="p-3 lg:p-4">
                <CustomerVendorMap
                  onVendorSelect={handleVendorSelect}
                  onLocationChange={handleLocationChange}
                  className="w-full h-80 lg:h-96"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userRole="customer"
      />
    </>
  );
};

export default FindNearbyVendors;
