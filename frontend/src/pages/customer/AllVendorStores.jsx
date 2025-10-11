import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { NavWithLogo } from "../../components/shared/nav";
import { useCart } from "../../contexts/CartContext";
import axios from "axios";

// Import customer icons
import cartIcon from "../../assets/images/customerIcon/cart.png";
import feedbackIcon from "../../assets/images/customerIcon/feedbacks.png";
import notifIcon from "../../assets/images/customerIcon/notifbell.png";
import productsIcon from "../../assets/images/customerIcon/productsflavor.png";
import shopsIcon from "../../assets/images/customerIcon/shops.png";

export const AllVendorStores = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
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

      // Fetch all approved vendors
      const response = await axios.get(`${apiBase}/api/vendor/all-approved`);
      if (response.data.success) {
        setVendors(response.data.vendors);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors
    .filter(
      (vendor) =>
        (vendor.store_name && vendor.store_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vendor.location && vendor.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      // Sort by created_at in descending order (newest first)
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

  return (
    <>
      <NavWithLogo />

      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-6 lg:py-8 mt-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-3 sm:gap-4 lg:gap-6">
            <div className="w-full sm:flex-1 sm:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vendor stores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2.5 pl-8 pr-3 text-sm text-gray-700 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4 sm:py-3 sm:pl-10 sm:text-base"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none sm:pl-3">
                  <svg
                    className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5"
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

            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-8">
              <button
                onClick={() => navigate("/find-vendors")}
                className="text-blue-700 hover:text-blue-800 font-medium text-sm whitespace-nowrap sm:text-base"
              >
                Find nearby Vendors
              </button>

              {/* Navigation Icons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2 lg:px-4">
                {/* Products/Flavors Icon */}
                <button
                  onClick={() => navigate("/customer")}
                  className={`p-1.5 rounded-lg transition-colors sm:p-2 ${
                    location.pathname === '/customer' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img src={productsIcon} alt="Products" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Shops Icon */}
                <button 
                  className={`p-1.5 rounded-lg transition-colors sm:p-2 ${
                    location.pathname === '/all-vendor-stores' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <img src={shopsIcon} alt="Shops" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Notification Bell */}
                <button
                  onClick={() => navigate("/customer/notifications")}
                  className={`p-1.5 rounded-lg transition-colors relative sm:p-2 ${
                    location.pathname === '/customer/notifications' 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : 'hover:bg-gray-100'
                  }`}
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
                  className={`p-1.5 rounded-lg transition-all duration-200 relative sm:p-2 ${
                    location.pathname === '/cart'
                      ? 'bg-blue-100 hover:bg-blue-200 shadow-sm' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
                >
                  <img 
                    src={cartIcon} 
                    alt="Cart" 
                    className="w-4 h-4 transition-transform duration-200 sm:w-5 sm:h-5" 
                  />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold sm:w-5 sm:h-5">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </button>

                {/* Feedback Icon */}
                <button 
                  onClick={() => navigate("/customer?view=feedback")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors sm:p-2"
                >
                  <img src={feedbackIcon} alt="Feedback" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="text-left mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">SHOPS AND VENDORS</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">Discover all available ice cream vendors in your area</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading vendor stores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.vendor_id}
                className="bg-sky-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden p-3"
                onClick={() => {
                  // Navigate to vendor's store page
                  navigate(`/vendor/${vendor.vendor_id}/store`);
                }}
              >
                {/* Image Area with White Background */}
                <div className="relative w-full h-24 bg-white rounded-md flex items-center justify-center mb-2">
                  {vendor.profile_image_url ? (
                    <img
                      src={`${
                        process.env.REACT_APP_API_URL ||
                        "http://localhost:3001"
                      }/uploads/vendor-documents/${
                        vendor.profile_image_url
                      }`}
                      alt={vendor.store_name || "Vendor Store"}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xl">🍦</span>
                    </div>
                  )}
                </div>

                {/* Bottom Information Section - Only Name and Location */}
                <div className="text-left space-y-1">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">
                    {vendor.store_name || "Unnamed Store"}
                  </h3>
                  
                  {/* Location */}
                  <div className="flex items-center space-x-1">
                    <svg
                      className="w-3 h-3 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs text-gray-600 line-clamp-1">
                      {vendor.location || "Location not specified"}
                    </span>
                  </div>

                  {/* View Shop Button */}
                  <button className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md transition-colors">
                    View Shop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No vendor stores found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search terms" : "No approved vendors available at the moment"}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default AllVendorStores;
