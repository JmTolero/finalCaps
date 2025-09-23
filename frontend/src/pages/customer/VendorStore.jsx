import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { NavWithLogo } from "../../components/shared/nav";
import axios from "axios";

// Import customer icons
import cartIcon from "../../assets/images/customerIcon/cart.png";
import feedbackIcon from "../../assets/images/customerIcon/feedbacks.png";
import notifIcon from "../../assets/images/customerIcon/notifbell.png";
import productsIcon from "../../assets/images/customerIcon/productsflavor.png";
import shopsIcon from "../../assets/images/customerIcon/shops.png";

export const VendorStore = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [flavors, setFlavors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (vendorId) {
      console.log('🚀 VendorStore component mounted with vendorId:', vendorId);
      fetchVendorData();
      fetchVendorFlavors();
    } else {
      console.log('❌ No vendorId provided');
    }
  }, [vendorId]);

  // Fetch notifications for customer
  const fetchNotifications = async () => {
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
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
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
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchVendorData = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      console.log('🔍 Fetching vendor data for vendorId:', vendorId);
      const response = await axios.get(`${apiBase}/api/admin/vendors/${vendorId}`);
      
      if (response.data.success) {
        console.log('✅ Vendor data fetched:', response.data.vendor);
        console.log('🖼️ Vendor profile image URL:', response.data.vendor.profile_image_url);
        setVendor(response.data.vendor);
      } else {
        console.log('❌ Vendor data fetch failed:', response.data);
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
    }
  };

  const fetchVendorFlavors = async () => {
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
  };

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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/all-vendor-stores')}
                className="text-blue-700 hover:text-blue-800 font-medium"
              >
                ← Back to Stores
              </button>
            </div>

            <div className="flex items-center space-x-4 ml-6">
              <Link
                to="/all-vendor-stores"
                className="text-blue-700 hover:text-blue-800 font-medium"
              >
                Find nearby Vendors
              </Link>

              {/* Navigation Icons */}
              <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 shadow-sm">
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigate("/customer")}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={productsIcon} alt="Products" className="w-5 h-5" />
                </button>

                {/* Shops Icon */}
                <button className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors">
                  <img src={shopsIcon} alt="Shops" className="w-5 h-5" />
                </button>

                {/* Notification Bell */}
                <button
                  onClick={() => navigate("/customer/notifications")}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
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
                  onClick={() => navigate("/customer?view=cart")}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={cartIcon} alt="Cart" className="w-5 h-5" />
                </button>

                {/* Feedback Icon */}
                <button 
                  onClick={() => navigate("/customer?view=feedback")}
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Vendor Information Card */}
        <div className="bg-sky-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-6">
            {/* Vendor Profile Image */}
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
              {vendor.profile_image_url ? (
                <img
                  src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/vendor-documents/${vendor.profile_image_url}`}
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
              <p className="text-lg text-gray-600">
                ID: {vendor.vendor_id}
              </p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Available Products</h2>
          
          {flavors.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products available</h3>
              <p className="text-gray-500">This vendor hasn't added any flavors yet.</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                              src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/flavor-images/${imageUrls[0]}`}
                              alt={flavor.flavor_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="text-4xl">🍦</div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Product Information Section */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {flavor.flavor_name}
                          </h3>
                          <p className="text-sm text-gray-700 mb-2">
                            {flavor.flavor_description}
                          </p>
                        </div>

                        {/* Price Range */}
                        <div className="text-sm font-bold text-gray-900">
                          {flavor.small_price && flavor.large_price 
                            ? `₱${parseInt(flavor.small_price)} - ₱${parseInt(flavor.large_price)}`
                            : flavor.small_price 
                              ? `₱${parseInt(flavor.small_price)}`
                              : 'Price not available'
                          }
                        </div>

                        {/* Location */}
                        <div className="text-sm text-gray-600">
                          {vendor.location || 'Location not specified'}
                        </div>

                        {/* Rating and Sold Count */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-4 h-4" fill={i < 3 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 font-medium">
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
      </div>
    </>
  );
};

export default VendorStore;
