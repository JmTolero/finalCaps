import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoImage from '../../assets/images/LOGO.png';
import axios from 'axios';

// Import customer icons for header

export const VendorPending = () => {
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(typeof document !== 'undefined' ? !document.hidden : true);
  const pollIntervalRef = useRef(null);
  const inFlightRef = useRef(false);
  const abortControllerRef = useRef(null);
  const navigatedRef = useRef(false);

  const isPending = (status) => status !== 'approved' && status !== 'rejected';

  const checkVendorStatus = useCallback(async () => {
    // Pause checks when tab is hidden
    if (!isTabVisible) return;
    // Avoid overlapping requests
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    // Abort any previous pending request (defensive)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      // Get user from session
      const userRaw = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (!userRaw) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userRaw);
      
      // Fetch vendor status
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/users/${user.id}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        setVendorData(userData);
        
        // If vendor is approved, redirect to setup or dashboard
        if (userData.vendor_status === 'approved') {
          if (!navigatedRef.current) {
            navigatedRef.current = true;
            navigate('/vendor-setup');
          }
        } else if (userData.vendor_status === 'rejected') {
          // No navigation here; message is shown in UI
        }
        // Stop polling if no longer pending
        if (!isPending(userData.vendor_status) && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (error) {
      if (axios.isCancel?.(error)) {
        // request cancelled
      } else if (error?.name !== 'CanceledError') {
        console.error('Error checking vendor status:', error);
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [navigate, isTabVisible]);

  useEffect(() => {
    // Visibility change: pause/resume polling
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    // Initial fetch
    checkVendorStatus();
    return () => {
      // Cleanup on unmount
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkVendorStatus]);

  useEffect(() => {
    // Manage polling based on status and tab visibility
    const currentStatus = vendorData?.vendor_status;
    // Clear any existing interval first
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    // Only poll when pending and tab visible
    if (isTabVisible && (currentStatus === undefined || isPending(currentStatus))) {
      // Poll every 0.5 seconds for fast status updates
      pollIntervalRef.current = setInterval(() => {
        checkVendorStatus();
      }, 500);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [vendorData?.vendor_status, isTabVisible, checkVendorStatus]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('pendingVendor');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingVendor');
    localStorage.removeItem('token');
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
      <header className="w-full bg-sky-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link to="/">
            <img
              src={logoImage}
              alt="ChillNet Logo"
              className="ChillNet-Logo h-8 sm:h-10 rounded-full object-cover"
            />
          </Link>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-2xl w-full bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100 ${
            vendorData?.vendor_status === 'rejected' 
              ? 'bg-gradient-to-r from-red-50 to-pink-50' 
              : 'bg-gradient-to-r from-blue-50 to-sky-50'
          }`}>
            <div className="text-center">
              {/* Icon with Animation */}
              <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg ${
                vendorData?.vendor_status === 'rejected'
                  ? 'bg-gradient-to-br from-red-100 to-red-200'
                  : 'bg-gradient-to-br from-yellow-100 to-yellow-200'
              }`}>
                {vendorData?.vendor_status === 'rejected' ? (
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {vendorData?.vendor_status === 'rejected' 
                  ? 'Account Application Rejected' 
                  : 'Account Pending Approval'
                }
              </h1>
              <p className={`text-base sm:text-lg font-semibold mb-2 ${
                vendorData?.vendor_status === 'rejected' 
                  ? 'text-red-600' 
                  : 'text-yellow-600'
              }`}>
                {vendorData?.vendor_status === 'rejected' 
                  ? '❌ Your application needs improvements' 
                  : '⚠️ Your account is under review'   
                }
              </p>
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                {vendorData?.vendor_status === 'rejected' 
                  ? 'Please review the feedback and reapply after 1 week' 
                  : 'We\'re carefully reviewing your application and documents'
                }
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

            {/* Welcome Message */}
            <div className="text-center mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Hi <span className="font-semibold text-blue-600">{vendorData?.fname || 'Vendor'}</span>,
              </p>
              <div className={`border-l-4 p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 rounded-r-lg shadow-sm ${
                vendorData?.vendor_status === 'rejected'
                  ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400'
                  : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400'
              }`}>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    {vendorData?.vendor_status === 'rejected' ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base text-gray-800 font-semibold mb-1 sm:mb-2">
                      {vendorData?.vendor_status === 'rejected' 
                        ? '📋 Application Needs Review' 
                        : '⏳ Your Account is Under Review'
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {vendorData?.vendor_status === 'rejected' 
                        ? 'Your vendor application requires some improvements. You can reapply after 1 week to give you time to address any issues. Please review your documents and make necessary corrections.'
                        : 'Our admin team is carefully reviewing your application and documents. You will be notified via email once your account is approved.'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 px-2">
                {vendorData?.vendor_status === 'rejected' 
                  ? 'You\'ll receive a notification when you\'re eligible to reapply. Use this time to improve your application.'
                  : 'You\'ll be able to complete your store setup and start selling once your account is approved.'
                }
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <span className={`inline-flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium shadow-md ${
                vendorData?.vendor_status === 'rejected'
                  ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
                  : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300'
              }`}>
                {vendorData?.vendor_status === 'rejected' ? (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="hidden sm:inline">Status: </span>{vendorData?.vendor_status === 'rejected' ? 'Rejected - Can Reapply in 1 Week' : 'Pending Review'}
              </span>
            </div>

            {/* Application Information Card */}
            {vendorData && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 shadow-sm">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Application Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-gray-600"><span className="font-medium">Store:</span> Will be set after approval</span>
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
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <button
                onClick={handleRefreshStatus}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{loading ? 'Checking...' : 'Refresh Status'}</span>
                </div>
              </button>

              {/* Continue as Customer Button - Only show for rejected vendors */}
              {vendorData?.vendor_status === 'rejected' && (
                <button
                  onClick={async () => {
                    console.log('Continue as Customer button clicked');
                    console.log('Current user data:', vendorData);
                    
                    try {
                      const userRaw = sessionStorage.getItem('user') || localStorage.getItem('user');
                      if (!userRaw) {
                        console.error('No user data found');
                        navigate('/login');
                        return;
                      }
                      
                      const user = JSON.parse(userRaw);
                      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
                      
                      // Fetch updated user data from backend to confirm role change
                      try {
                        const response = await axios.get(`${apiBase}/api/admin/users/${user.id}`);
                        if (response.data.success) {
                          const updatedUser = response.data.user;
                          console.log('Backend user role:', updatedUser.role);
                          
                          // Update session storage with customer role (backend already changed it)
                          const updatedUserData = {
                            ...user,
                            role: 'customer', // Backend already changed this, but ensure frontend matches
                            id: updatedUser.user_id || user.id
                          };
                          sessionStorage.setItem('user', JSON.stringify(updatedUserData));
                          localStorage.setItem('user', JSON.stringify(updatedUserData));
                          console.log('Updated user role in session to customer');
                        }
                      } catch (error) {
                        console.error('Error fetching updated user data:', error);
                        // Still proceed with role update
                      }
                      
                      // Update role to customer in session/localStorage
                      const updatedUserData = {
                        ...user,
                        role: 'customer'
                      };
                      sessionStorage.setItem('user', JSON.stringify(updatedUserData));
                      localStorage.setItem('user', JSON.stringify(updatedUserData));
                      
                      // Mark rejection as acknowledged BEFORE navigation
                      localStorage.setItem(`vendorRejectionAcknowledged_${user.id}`, 'true');
                      console.log('Marked rejection as acknowledged for user:', user.id);
                      
                      // Trigger user change event to update app state
                      window.dispatchEvent(new Event('userChanged'));
                      
                      // Small delay to ensure state updates before navigation
                      setTimeout(() => {
                        console.log('Navigating to /customer');
                        navigate('/customer', { replace: true });
                      }, 100);
                      
                    } catch (error) {
                      console.error('Error in Continue as Customer:', error);
                      // Still try to navigate
                      navigate('/customer', { replace: true });
                    }
                  }}
                  className="w-full bg-green-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:bg-green-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Continue as Customer</span>
                  </div>
                </button>
              )}
              
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Need assistance?</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium transition-colors"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Support
                </Link>
              </div>
            </div>

            {/* Enhanced Timeline */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900">What happens next?</h4>
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
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
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
