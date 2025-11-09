import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { NavWithLogo } from "../../components/shared/nav";
import { getImageUrl } from "../../utils/imageUtils";
import FeedbackModal from '../../components/shared/FeedbackModal';
import { useCart } from '../../contexts/CartContext';
import StarRating from '../../components/shared/StarRating';
import axios from "axios";

// Import customer icons
import cartIcon from "../../assets/images/customerIcon/cart.png";
import feedbackIcon from "../../assets/images/customerIcon/feedbacks.png";
import notifIcon from "../../assets/images/customerIcon/notifbell.png";
import productsIcon from "../../assets/images/customerIcon/productsflavor.png";
import shopsIcon from "../../assets/images/customerIcon/shops.png";
import findNearbyIcon from "../../assets/images/vendordashboardicon/findnearby.png";
import locationIcon from "../../assets/images/vendordashboardicon/location.png";

export const VendorStore = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const [vendor, setVendor] = useState(null);
  const [flavors, setFlavors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
      
  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        return;
      }

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/notifications/customer/${user.id}/unread-count`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const handleUserChanged = () => {
      fetchUnreadCount();
    };

    window.addEventListener('userChanged', handleUserChanged);
    return () => window.removeEventListener('userChanged', handleUserChanged);
  }, [fetchUnreadCount]);

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

  const [shopReviews, setShopReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({
    total_reviews: 0,
    average_rating: 0,
    five_star: 0,
    four_star: 0,
    three_star: 0,
    two_star: 0,
    one_star: 0
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchShopReviews = useCallback(async () => {
    try {
      if (!vendorId) return;
      
      setReviewsLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/reviews/vendor/${vendorId}`);
      
      if (response.data.success) {
        setShopReviews(response.data.reviews || []);
        setReviewsSummary(response.data.summary || {
          total_reviews: 0,
          average_rating: 0,
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0
        });
        console.log('⭐ Shop reviews loaded:', response.data.reviews.length);
      }
    } catch (error) {
      console.error('Error fetching shop reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, [vendorId]);

  const fetchVendorData = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      console.log('🔍 Fetching vendor data for vendorId:', vendorId);
      const response = await axios.get(`${apiBase}/api/admin/vendors/${vendorId}`);
      
      if (response.data.success) {
        console.log('✅ Vendor data fetched:', response.data.vendor);
        console.log('🖼️ Vendor profile image URL:', response.data.vendor.profile_image_url);
        
        // Check if vendor is suspended - don't show store to customers
        if (response.data.vendor.status === 'suspended') {
          setError('This store is currently unavailable.');
          return;
        }
        
        setVendor(response.data.vendor);
      } else {
        console.log('❌ Vendor data fetch failed:', response.data);
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      setError("Failed to load vendor information. Please try again.");
      setLoading(false);
    }
  }, [vendorId]);

  const fetchVendorFlavors = useCallback(async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      console.log('🔍 Fetching flavors for vendorId:', vendorId);
      const response = await axios.get(`${apiBase}/api/vendor/flavors/${vendorId}`);
      
      if (response.data.success) {
        console.log('✅ Flavors fetched for vendor', vendorId, ':', response.data.flavors.length, 'flavors');
        console.log('📦 Flavors data:', response.data.flavors);
        console.log('🖼️ Flavor images:', response.data.flavors.map(f => ({ 
          name: f.flavor_name, 
          image_url: f.image_url 
        })));
        setFlavors(response.data.flavors);
      } else {
        console.log('❌ Flavors fetch failed:', response.data);
      }
    } catch (error) {
      console.error("Error fetching vendor flavors:", error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) {
      console.log('🚀 VendorStore component mounted with vendorId:', vendorId);
      fetchVendorData();
      fetchVendorFlavors();
      fetchShopReviews();
    } else {
      console.log('❌ No vendorId provided');
    }
  }, [vendorId, fetchVendorData, fetchVendorFlavors, fetchShopReviews]);

  if (loading) {
    return (
      <>
        <NavWithLogo />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading store...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavWithLogo />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Store Unavailable</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => navigate('/all-vendor-stores')}
              className="bg-orange-300 text-black px-6 py-2 rounded-lg hover:bg-orange-400 transition-colors"
            >
              Back to Stores
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!vendor) {
    return (
      <>
        <NavWithLogo />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Store not found</h3>
            <p className="text-gray-500 mb-4">The vendor store you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/all-vendor-stores')}
              className="bg-orange-300 text-black px-6 py-2 rounded-lg hover:bg-orange-400 transition-colors"
            >
              Back to Stores
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
              <Link
                to="/find-vendors"
                className="p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm"
                title="Find nearby Vendors"
              >
                <img src={findNearbyIcon} alt="Find nearby Vendors" className="w-5 h-5" />
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigate("/customer")}
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
                  onClick={() => navigate('/all-vendor-stores')}
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
                  onClick={() => navigate("/customer/notifications")}
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
                  onClick={() => navigate("/cart")}
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
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden sm:flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center space-x-4">
            </div>

            <div className="flex items-center space-x-4 ml-6">
              <Link
                to="/find-vendors"
                className="text-blue-700 hover:text-blue-800 font-medium text-sm sm:text-base"
                title="Find nearby Vendors"
              >
                Find nearby Vendors
              </Link>

              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigate("/customer")}
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
                <button 
                  onClick={() => navigate('/all-vendor-stores')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    location.pathname === '/all-vendor-stores' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="All Vendor Stores"
                >
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Notification Bell */}
                <button
                  onClick={() => navigate("/customer/notifications")}
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
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold sm:w-5 sm:h-5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Cart Icon */}
                <button 
                  onClick={() => navigate("/cart")}
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
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200"
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Vendor Information Card */}
        <div className="bg-sky-100 rounded-2xl p-4 sm:p-6 mb-8">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col sm:hidden">
            {/* Top Section: Profile Image + Vendor Info */}
            <div className="flex items-center space-x-4 mb-4">
              {/* Vendor Profile Image */}
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {vendor.profile_image_url ? (
                  <img
                    src={
                      getImageUrl(vendor.profile_image_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents')
                    }
                    alt={vendor.store_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">🍦</span>
                )}
              </div>

              {/* Vendor Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  {vendor.store_name?.toUpperCase() || 'VENDOR STORE'}
                </h1>
                
                {/* Shop Rating */}
                {reviewsSummary.total_reviews > 0 && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= Math.round(reviewsSummary.average_rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {parseFloat(reviewsSummary.average_rating).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-600">
                      ({reviewsSummary.total_reviews} review{reviewsSummary.total_reviews !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-gray-600">
                  ID: {vendor.vendor_id}
                </p>
              </div>
            </div>
            
            {/* Bottom Section: Contact Shop Button */}
            <div className="w-full">
              <button 
                onClick={() => setShowContactModal(true)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg text-sm sm:text-base"
              >
                Contact Shop
              </button>
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden sm:flex items-center space-x-6">
            {/* Vendor Profile Image */}
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
              {vendor.profile_image_url ? (
                <img
                  src={
                    getImageUrl(vendor.profile_image_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents')
                  }
                  alt={vendor.store_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">🍦</span>
              )}
            </div>

            {/* Vendor Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vendor.store_name?.toUpperCase() || 'VENDOR STORE'}
              </h1>
              
              {/* Shop Rating */}
              {reviewsSummary.total_reviews > 0 && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-xl ${
                          star <= Math.round(reviewsSummary.average_rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {parseFloat(reviewsSummary.average_rating).toFixed(1)}
                  </span>
                  <span className="text-gray-600">
                    ({reviewsSummary.total_reviews} review{reviewsSummary.total_reviews !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
              
              <p className="text-lg text-gray-600">
                ID: {vendor.vendor_id}
              </p>
            </div>

            {/* Contact Shop Button */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => setShowContactModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg text-sm sm:text-base"
              >
                Contact Shop
              </button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-left">Available Products</h2>
          
          {flavors.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products available</h3>
              <p className="text-gray-500">This vendor hasn't added any flavors yet.</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {flavors.map((flavor) => {
                  return (
                    <div 
                      key={flavor.flavor_id} 
                      className="bg-sky-100 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/flavor/${flavor.flavor_id}`)}
                    >
                      {/* Image Section */}
                      <div className="bg-gray-100 h-48 flex items-center justify-center">
                        {(() => {
                          // Parse image URLs (stored as JSON array)
                          let imageUrls = [];
                          try {
                            imageUrls = JSON.parse(flavor.image_url || '[]');
                          } catch (e) {
                            if (flavor.image_url) {
                              imageUrls = [flavor.image_url];
                            }
                          }
                          
                          return imageUrls.length > 0 ? (
                            <img
                              src={getImageUrl(imageUrls[0], process.env.REACT_APP_API_URL || "http://localhost:3001") || `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                              alt={flavor.flavor_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                              }}
                            />
                          ) : (
                            <div className="text-center">
                              <div className="text-4xl">🍦</div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Product Information Section */}
                      <div className="p-3 space-y-2">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
                            {flavor.flavor_name}
                          </h3>
                          <p className="text-xs text-gray-700 mb-1 line-clamp-2">
                            {flavor.flavor_description}
                          </p>
                        </div>

                        {/* Price Range */}
                        <div className="text-xs font-bold text-gray-900">
                          {flavor.small_price && flavor.large_price 
                            ? `₱${parseInt(flavor.small_price)} - ₱${parseInt(flavor.large_price)}`
                            : flavor.small_price 
                              ? `₱${parseInt(flavor.small_price)}`
                              : 'Price not available'
                          }
                        </div>

                        {/* Location */}
                        <div className="text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <img 
                              src={locationIcon} 
                              alt="Location" 
                              className="w-3 h-3 flex-shrink-0" 
                            />
                            <span className="truncate" title={flavor.location || 'Location not specified'}>
                              {flavor.location || 'Location not specified'}
                            </span>
                          </div>
                        </div>

                        {/* Rating and Sold Count */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            <StarRating 
                              rating={parseFloat(flavor.average_rating) || 0}
                              size="xs"
                              showCount={false}
                              totalRatings={0}
                              showRating={true}
                              singleStarMode={true}
                            />
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            {flavor.sold_count || 0} sold
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Shop Reviews Section */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-left">Shop Reviews</h2>
          
          {reviewsLoading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm sm:text-base text-gray-600">Loading reviews...</p>
            </div>
          ) : reviewsSummary.total_reviews === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg mx-4 sm:mx-0">
              <div className="text-4xl sm:text-6xl mb-4">⭐</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
              <p className="text-sm sm:text-base text-gray-500">Be the first to leave a review for this shop!</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto px-4 sm:px-0">
              {/* Rating Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-blue-200">
                {/* Mobile Layout - Stacked */}
                <div className="flex flex-col sm:hidden gap-4">
                  {/* Average Rating */}
                  <div className="flex items-center justify-center space-x-3">
                    <div className="text-4xl font-bold text-blue-600">
                      {parseFloat(reviewsSummary.average_rating).toFixed(1)}
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= Math.round(reviewsSummary.average_rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        Based on {reviewsSummary.total_reviews} review{reviewsSummary.total_reviews !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Star Breakdown */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviewsSummary[`${['one', 'two', 'three', 'four', 'five'][stars - 1]}_star`] || 0;
                      const percentage = reviewsSummary.total_reviews > 0 
                        ? (count / reviewsSummary.total_reviews) * 100 
                        : 0;
                      return (
                        <div key={stars} className="flex items-center space-x-2">
                          <span className="w-8 text-xs text-gray-700">{stars} ★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-8 text-xs text-gray-600 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Layout - Side by Side */}
                <div className="hidden sm:flex flex-row items-center justify-between gap-6">
                  {/* Average Rating */}
                  <div className="flex items-center space-x-4">
                    <div className="text-6xl font-bold text-blue-600">
                      {parseFloat(reviewsSummary.average_rating).toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-2xl ${
                              star <= Math.round(reviewsSummary.average_rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-700 font-medium">
                        Based on {reviewsSummary.total_reviews} review{reviewsSummary.total_reviews !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Star Breakdown */}
                  <div className="space-y-2 flex-1 max-w-md">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviewsSummary[`${['one', 'two', 'three', 'four', 'five'][stars - 1]}_star`] || 0;
                      const percentage = reviewsSummary.total_reviews > 0 
                        ? (count / reviewsSummary.total_reviews) * 100 
                        : 0;
                      return (
                        <div key={stars} className="flex items-center space-x-2">
                          <span className="w-12 text-sm text-gray-700">{stars} ★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-yellow-400 h-3 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-12 text-sm text-gray-600 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {shopReviews.map((review) => {
                  const reviewDate = new Date(review.created_at);
                  const now = new Date();
                  const diffTime = Math.abs(now - reviewDate);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let timeAgo;
                  if (diffDays === 0) {
                    timeAgo = 'Today';
                  } else if (diffDays === 1) {
                    timeAgo = '1 day ago';
                  } else if (diffDays < 7) {
                    timeAgo = `${diffDays} days ago`;
                  } else if (diffDays < 30) {
                    const weeks = Math.floor(diffDays / 7);
                    timeAgo = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
                  } else if (diffDays < 365) {
                    const months = Math.floor(diffDays / 30);
                    timeAgo = months === 1 ? '1 month ago' : `${months} months ago`;
                  } else {
                    const years = Math.floor(diffDays / 365);
                    timeAgo = years === 1 ? '1 year ago' : `${years} years ago`;
                  }
                  
                  return (
                    <div key={review.review_id} className="bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                      {/* Customer Info */}
                      <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm sm:text-lg">
                            {review.customer_fname?.[0] || '?'}{review.customer_lname?.[0] || ''}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {review.customer_fname} {review.customer_lname || ''}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm sm:text-lg ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Review Comment */}
                      {review.comment && (
                        <p className="text-gray-700 mb-3 sm:mb-4 italic text-sm sm:text-base line-clamp-3">
                          "{review.comment}"
                        </p>
                      )}
                      
                      {/* Review Date */}
                      <p className="text-xs sm:text-sm text-gray-500">{timeAgo}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Shop Modal */}
      {showContactModal && vendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Contact {vendor.store_name}</h2>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Vendor Info */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                  {vendor.profile_image_url ? (
                    <img 
                      src={
                        getImageUrl(vendor.profile_image_url, process.env.REACT_APP_API_URL || "http://localhost:3001", 'vendor-documents')
                      }
                      alt={vendor.store_name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{vendor.store_name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{vendor.fname} {vendor.lname}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{vendor.location}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Contact Information</h4>
                
                {/* Phone Number */}
                {vendor.contact_no && (
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{vendor.contact_no}</p>
                    </div>
                    <a 
                      href={`tel:${vendor.contact_no}`}
                      className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                    >
                      Call
                    </a>
                  </div>
                )}

                {/* Email */}
                {vendor.email && (
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{vendor.email}</p>
                    </div>
                    <a 
                      href={`mailto:${vendor.email}`}
                      className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
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
              <div className="mt-4 sm:mt-6 flex justify-end">
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Close
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
    </>
  );
};

export default VendorStore;
