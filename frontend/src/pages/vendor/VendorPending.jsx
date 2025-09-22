import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoImage from '../../assets/images/LOGO.png';
import axios from 'axios';

// Import customer icons for header
import cartIcon from '../../assets/images/customerIcon/cart.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';

export const VendorPending = () => {
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkVendorStatus();
    fetchNotifications();
    fetchUnreadCount();

    // Auto-refresh vendor notifications every 30 seconds for real-time updates
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing vendor pending notifications...');
      fetchNotifications();
      fetchUnreadCount();
    }, 30000); // 30 seconds for notification updates

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Fetch notifications for vendor
  const fetchNotifications = async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/notifications/vendor/${user.id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
        console.log('📬 Fetched vendor notifications:', response.data.notifications.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/notifications/vendor/${user.id}/unread-count`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
        console.log('📊 Unread notifications count:', response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const checkVendorStatus = async () => {
    try {
      // Get user from session
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userRaw);
      
      // Fetch vendor status
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/users/${user.id}`);
      
      if (response.data.success) {
        const userData = response.data.user;
        setVendorData(userData);
        
        // If vendor is approved, redirect to setup or dashboard
        if (userData.vendor_status === 'approved') {
          navigate('/vendor-setup');
        } else if (userData.vendor_status === 'rejected') {
          // Handle rejected status - stay on this page but show rejection message
          console.log('Vendor application was rejected');
        }
      }
    } catch (error) {
      console.error('Error checking vendor status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('pendingVendor');
    window.dispatchEvent(new Event('userChanged'));
    navigate('/login');
  };

  const handleRefreshStatus = () => {
    setLoading(true);
    checkVendorStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your account status...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navbar */}
      <header className="w-full bg-sky-100 flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-3">
          <Link to="/">
            <img
              src={logoImage}
              alt="ChillNet Logo"
              className="ChillNet-Logo h-10 rounded-full object-cover"
            />
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className={`px-8 py-6 border-b border-gray-100 ${
            vendorData?.vendor_status === 'rejected' 
              ? 'bg-gradient-to-r from-red-50 to-pink-50' 
              : 'bg-gradient-to-r from-blue-50 to-sky-50'
          }`}>
            <div className="text-center">
              {/* Icon with Animation */}
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg ${
                vendorData?.vendor_status === 'rejected'
                  ? 'bg-gradient-to-br from-red-100 to-red-200'
                  : 'bg-gradient-to-br from-yellow-100 to-yellow-200 animate-pulse'
              }`}>
                {vendorData?.vendor_status === 'rejected' ? (
                  <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{animation: 'spin 3s linear infinite'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vendorData?.vendor_status === 'rejected' 
                  ? 'Account Application Rejected' 
                  : 'Account Pending Approval'
                }
              </h1>
              <p className={`text-lg font-semibold mb-2 ${
                vendorData?.vendor_status === 'rejected' 
                  ? 'text-red-600' 
                  : 'text-yellow-600'
              }`}>
                {vendorData?.vendor_status === 'rejected' 
                  ? '❌ Your application needs improvements' 
                  : '⚠️ Your account is under review'   
                }
              </p>
              <p className="text-sm text-gray-600">
                {vendorData?.vendor_status === 'rejected' 
                  ? 'Please review the feedback and reapply after 1 week' 
                  : 'We\'re carefully reviewing your application and documents'
                }
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-8 py-6">

            {/* Welcome Message */}
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Hi <span className="font-semibold text-blue-600">{vendorData?.fname || 'Vendor'}</span>,
              </p>
              <div className={`border-l-4 p-6 mb-4 rounded-r-lg shadow-sm ${
                vendorData?.vendor_status === 'rejected'
                  ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400'
                  : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {vendorData?.vendor_status === 'rejected' ? (
                      <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-semibold mb-2">
                      {vendorData?.vendor_status === 'rejected' 
                        ? '📋 Application Needs Review' 
                        : '⏳ Your Account is Under Review'
                      }
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {vendorData?.vendor_status === 'rejected' 
                        ? 'Your vendor application requires some improvements. You can reapply after 1 week to give you time to address any issues. Please review your documents and make necessary corrections.'
                        : 'Our admin team is carefully reviewing your application and documents. You will be notified via email once your account is approved.'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {vendorData?.vendor_status === 'rejected' 
                  ? 'You\'ll receive a notification when you\'re eligible to reapply. Use this time to improve your application.'
                  : 'You\'ll be able to complete your store setup and start selling once your account is approved.'
                }
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <span className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-medium shadow-md ${
                vendorData?.vendor_status === 'rejected'
                  ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
                  : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300'
              }`}>
                {vendorData?.vendor_status === 'rejected' ? (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Status: {vendorData?.vendor_status === 'rejected' ? 'Rejected - Can Reapply in 1 Week' : 'Pending Review'}
              </span>
            </div>

            {/* Application Information Card */}
            {vendorData && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-gray-600"><span className="font-medium">Store:</span> {vendorData.store_name || 'Pending Setup'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600"><span className="font-medium">Email:</span> {vendorData.email}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm text-gray-600"><span className="font-medium">Contact:</span> {vendorData.contact_no || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600"><span className="font-medium">Applied:</span> {new Date(vendorData.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 mb-6">
              <button
                onClick={handleRefreshStatus}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{loading ? 'Checking...' : 'Refresh Status'}</span>
                </div>
              </button>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Need assistance?</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Support
                </Link>
              </div>
            </div>

            {/* Enhanced Timeline */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">What happens next?</h4>
              </div>
              
              <div className="space-y-4">
                {/* Step 1 - Completed */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-700">Application Submitted</div>
                    <div className="text-xs text-gray-500 mt-1">Your documents and information have been received</div>
                  </div>
                </div>

                {/* Step 2 - Current */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-yellow-700">Admin Review</div>
                    <div className="text-xs text-gray-500 mt-1">Our team is reviewing your application • Usually takes 1-3 business days</div>
                  </div>
                </div>

                {/* Step 3 - Pending */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Complete Store Setup</div>
                    <div className="text-xs text-gray-400 mt-1">Configure your store details and preferences</div>
                  </div>
                </div>

                {/* Step 4 - Pending */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Start Selling</div>
                    <div className="text-xs text-gray-400 mt-1">Launch your ice cream store and start serving customers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
    </>
  );
};

export default VendorPending;
