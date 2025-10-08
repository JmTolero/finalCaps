import { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom'; 
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
        isOpen ? "w-64 left-0" : "w-64 -left-64 lg:w-20 lg:left-0"
      }`}
    >
      <div className="p-4 pt-8">
        {/* Menu items */}
        <ul className="flex flex-col space-y-3">

        <Link to="/admin/dashboard" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors ${
            isActiveLink('/admin/dashboard')
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-blue-300 hover:text-gray-900'
          }`}>
            <img src={adminIcon} alt="admin" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">Dashboard</span>}
          </li>
        </Link>
        
        <Link to="/admin/vendor-approval" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors ${
            isActiveLink('/admin/vendor-approval')
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-blue-300 hover:text-gray-900'
          }`}>
            <img src={vendorApproval} alt="vendorApproval" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">Vendor Approval</span>}
          </li>
        </Link>
        
        <Link to="/admin/vendor-locations" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors ${
            isActiveLink('/admin/vendor-locations')
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-blue-300 hover:text-gray-900'
          }`}>
            <img src={vendorLocationManagerIcon} alt="vendor locations" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">Vendor Locations</span>}
          </li>
        </Link>
        
        <Link to="/admin/user-management" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors ${
            isActiveLink('/admin/user-management')
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-blue-300 hover:text-gray-900'
          }`}>
            <img src={usermanagement} alt="usermanagement" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">User Management</span>}
          </li>
        </Link>
        
        <Link to="/admin/feedback" onClick={handleLinkClick}>
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors ${
            isActiveLink('/admin/feedback')
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-blue-300 hover:text-gray-900'
          }`}>
            <img src={feedback} alt="feedback" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">Feedback</span>}
          </li>
        </Link>

      </ul>
      </div>
    </div>
  );
};
