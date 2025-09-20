import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NavWithLogo } from "../../components/shared/nav";
import axios from "axios";

// Import customer icons
import cartIcon from "../../assets/images/customerIcon/cart.png";
import feedbackIcon from "../../assets/images/customerIcon/feedbacks.png";
import notifIcon from "../../assets/images/customerIcon/notifbell.png";
import productsIcon from "../../assets/images/customerIcon/productsflavor.png";
import shopsIcon from "../../assets/images/customerIcon/shops.png";

export const FindNearbyVendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";

      // Fetch vendors with their locations
      const response = await axios.get(`${apiBase}/api/vendors/with-locations`);
      if (response.data.success) {
        setVendors(response.data.vendors);
        if (response.data.vendors.length > 0) {
          setSelectedVendor(response.data.vendors[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={productsIcon} alt="Products" className="w-5 h-5" />
                </button>

                {/* Shops Icon */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
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
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* Cart Icon */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={cartIcon} alt="Cart" className="w-5 h-5" />
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
            <h2 className="text-3xl font-bold text-orange-500 mb-6">
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
                            {vendor.store_name}
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
                              4.5 (55 reviews)
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
                            {vendor.location || "Cordova, Cebu, Philippines"}
                          </span>
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

                        {/* Shop Status */}
                        <div className="mb-4">
                          <span className="text-sm font-semibold text-gray-700">
                            Shop Status:{" "}
                          </span>
                          <span className="text-sm text-red-600 font-semibold">
                            Closed
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold rounded-lg transition-colors">
                            View Shop
                          </button>
                          <button className="px-4 py-2 bg-orange-300 hover:bg-orange-400 text-gray-800 font-semibold rounded-lg transition-colors">
                            Book now
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
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <div className="h-96 bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Interactive Map
                </h3>
                <p className="text-gray-500">
                  Map will show vendor locations with markers
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Cordova, Cebu, Philippines
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FindNearbyVendors;
