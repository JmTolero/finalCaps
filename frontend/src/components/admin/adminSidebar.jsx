import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import adminIcon from '../../assets/images/administrator.png'
import usermanagement from '../../assets/images/usermanagement.png'
import vendorApproval from '../../assets/images/approval.png'
import vendorLocationManagerIcon from '../../assets/images/vendorLocationManagerIcon.png'
import feedback from '../../assets/images/feedback.png'
import '../../assets/fonts/fonts.css';  



export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  return (
    <div
      className={`bg-[#BBDEF8] h-screen fixed left-0 top-16 z-10 transition-all duration-300 overflow-y-auto ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="p-4 pt-8">
        {/* Menu items */}
        <ul className="flex flex-col space-y-3">

        <Link to="/admin/dashboard">
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors text-gray-700 hover:bg-blue-300 hover:text-gray-900`}>
            <img src={adminIcon} alt="admin" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">Dashboard</span>}
          </li>
        </Link>
        
        <Link to="/admin/vendor-approval">
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors text-gray-700 hover:bg-blue-300 hover:text-gray-900`}>
            <img src={vendorApproval} alt="vendorApproval" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">Vendor Approval</span>}
          </li>
        </Link>
        
        <Link to="/admin/vendor-locations">
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors text-gray-700 hover:bg-blue-300 hover:text-gray-900`}>
            <img src={vendorLocationManagerIcon} alt="vendor locations" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">Vendor Locations</span>}
          </li>
        </Link>
        
        <Link to="/admin/user-management">
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors text-gray-700 hover:bg-blue-300 hover:text-gray-900`}>
            <img src={usermanagement} alt="usermanagement" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">User Management</span>}
          </li>
        </Link>
        
        <Link to="/admin/feedback">
          <li className={`w-full flex ${
            isOpen
              ? "items-center gap-3 px-4 py-3"
              : "items-center justify-center p-3"
          } rounded-lg transition-colors text-gray-700 hover:bg-blue-300 hover:text-gray-900`}>
            <img src={feedback} alt="feedback" className="w-8 h-8 flex-shrink-0 object-contain"/>
            {isOpen && <span className="font-medium text-sm">Feedback</span>}
          </li>
        </Link>

      </ul>
      </div>
    </div>
  );
};
