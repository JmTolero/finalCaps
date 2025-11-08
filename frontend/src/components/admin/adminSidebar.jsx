import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from 'react-router-dom'; 
import axios from 'axios';
import adminIcon from '../../assets/images/administrator.png'
import usermanagement from '../../assets/images/usermanagement.png'
import vendorApproval from '../../assets/images/approval.png'
import vendorLocationManagerIcon from '../../assets/images/vendorLocationManagerIcon.png'
import feedback from '../../assets/images/feedback.png'
import '../../assets/fonts/fonts.css';  



export const Sidebar = () => {
  // Sidebar state - always closed on initial load for clean login experience
  const [isOpen, setIsOpen] = useState(false); 
  const location = useLocation();
  const [pendingVendorCount, setPendingVendorCount] = useState(0);

  // Helper function to check if link is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    const handleClose = () => {
      setIsOpen(false);
    };

    window.addEventListener('toggleSidebar', handleToggle);
    window.addEventListener('closeSidebar', handleClose);
    return () => {
      window.removeEventListener('toggleSidebar', handleToggle);
      window.removeEventListener('closeSidebar', handleClose);
    };
  }, []);

  const fetchPendingVendors = useCallback(async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/vendors`);
      if (response.data?.success && Array.isArray(response.data.vendors)) {
        const pendingCount = response.data.vendors.filter(
          (vendor) => (vendor.status || '').toLowerCase() === 'pending'
        ).length;
        setPendingVendorCount(pendingCount);
      }
    } catch (error) {
      console.error('Failed to fetch pending vendors:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingVendors();
    const interval = setInterval(fetchPendingVendors, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingVendors]);

  // Handle window resize for sidebar responsiveness
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (!isDesktop && isOpen) {
        // Auto-close when resizing to mobile
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Auto-close sidebar on mobile after clicking a link
  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && isOpen) {
      // Dispatch close event to close sidebar on both components
      window.dispatchEvent(new Event('closeSidebar'));
    }
  };

  return (
    <div
      className={`bg-[#BBDEF8] h-[calc(100vh-4rem)] fixed top-16 z-50 transition-all duration-300 overflow-y-auto shadow-2xl ${
        isOpen ? "w-64 sm:w-72 left-0" : "w-64 sm:w-72 -left-64 sm:-left-72 lg:w-20 lg:left-0"
      }`}
    >
      <div className="p-3 sm:p-4 pt-6 sm:pt-8">
        {/* Menu items */}
        <ul className="flex flex-col space-y-2 sm:space-y-3">

        <Link to="/admin/dashboard" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3"
              : "items-center justify-center p-2 sm:p-3"
          } rounded-lg transition-all duration-200 ${
            isActiveLink('/admin/dashboard')
              ? 'bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700'
              : 'text-gray-700 hover:bg-blue-200 hover:text-gray-900'
          }`}>
            <img src={adminIcon} alt="admin" className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain ${
              isActiveLink('/admin/dashboard') ? 'brightness-0 invert' : ''
            }`}/>
            {isOpen && <span className="font-medium text-xs">Dashboard</span>}
          </li>
        </Link>
        
        <Link to="/admin/vendor-approval" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3"
              : "items-center justify-center p-2 sm:p-3"
          } rounded-lg transition-all duration-200 ${
            isActiveLink('/admin/vendor-approval')
              ? 'bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700'
              : 'text-gray-700 hover:bg-blue-200 hover:text-gray-900'
          }`}>
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 inline-flex items-center justify-center">
              <img src={vendorApproval} alt="vendorApproval" className={`w-full h-full object-contain ${
                isActiveLink('/admin/vendor-approval') ? 'brightness-0 invert' : ''
              }`}/>
              {pendingVendorCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
              )}
            </div>
            {isOpen && (
              <span className="font-medium text-xs flex items-center gap-1">
                Vendor Approval
                {pendingVendorCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                    {pendingVendorCount}
                  </span>
                )}
              </span>
            )}
          </li>
        </Link>
        
        <Link to="/admin/vendor-locations" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3"
              : "items-center justify-center p-2 sm:p-3"
          } rounded-lg transition-all duration-200 ${
            isActiveLink('/admin/vendor-locations')
              ? 'bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700'
              : 'text-gray-700 hover:bg-blue-200 hover:text-gray-900'
          }`}>
            <img src={vendorLocationManagerIcon} alt="vendor locations" className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain ${
              isActiveLink('/admin/vendor-locations') ? 'brightness-0 invert' : ''
            }`}/>
            {isOpen && <span className="font-medium text-xs">Vendor Locations</span>}
          </li>
        </Link>
        
        <Link to="/admin/user-management" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3"
              : "items-center justify-center p-2 sm:p-3"
          } rounded-lg transition-all duration-200 ${
            isActiveLink('/admin/user-management')
              ? 'bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700'
              : 'text-gray-700 hover:bg-blue-200 hover:text-gray-900'
          }`}>
            <img src={usermanagement} alt="usermanagement" className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain ${
              isActiveLink('/admin/user-management') ? 'brightness-0 invert' : ''
            }`}/>
            {isOpen && <span className="font-medium text-xs">User Management</span>}
          </li>
        </Link>
        
        <Link to="/admin/feedback" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3"
              : "items-center justify-center p-2 sm:p-3"
          } rounded-lg transition-all duration-200 ${
            isActiveLink('/admin/feedback')
              ? 'bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700'
              : 'text-gray-700 hover:bg-blue-200 hover:text-gray-900'
          }`}>
            <img src={feedback} alt="feedback" className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 object-contain ${
              isActiveLink('/admin/feedback') ? 'brightness-0 invert' : ''
            }`}/>
            {isOpen && <span className="font-medium text-xs">Feedback</span>}
          </li>
        </Link>

        <Link to="/admin/subscriptions" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3"
              : "items-center justify-center p-2 sm:p-3"
          } rounded-lg transition-all duration-200 ${
            isActiveLink('/admin/subscriptions')
              ? 'bg-blue-500 text-white font-semibold shadow-lg border-l-4 border-blue-700'
              : 'text-gray-700 hover:bg-blue-200 hover:text-gray-900'
          }`}>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center ${
              isActiveLink('/admin/subscriptions') ? 'text-white' : 'text-gray-700'
            }`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
              </svg>
            </div>
            {isOpen && <span className="font-medium text-xs">Subscriptions</span>}
          </li>
        </Link>

      </ul>
      </div>
    </div>
  );
};
