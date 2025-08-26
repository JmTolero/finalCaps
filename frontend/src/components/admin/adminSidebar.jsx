import { useState } from "react";
import { Link } from 'react-router-dom';
import menu from '../../assets/images/menu.png';
import adminIcon from '../../assets/images/administrator.png'
import usermanagement from '../../assets/images/usermanagement.png'
import vendorApproval from '../../assets/images/approval.png'
import feedback from '../../assets/images/feedback.png'
import '../../assets/fonts/fonts.css';  



export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // sidebar starts open

  return (
    <div
      className={`bg-[#BBDEF8] h-screen transition-all duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Toggle button */}
      <div className="flex items-center justify-between p-4">
        <img
          src={menu}
          alt="menu"
          className="w-7 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
        {isOpen && <span className="text-white font-bold">Menu</span>}
      </div>

      {/* Menu items */}
      <ul className="flex flex-col mt-10 cursor-pointer font-sans adminMenu">

        <Link to="/admin/dashboard">
          <li className="hover:bg-blue-300 p-3 flex items-center gap-3">
            <img src = {adminIcon}  alt="admin" className="w-7 ml-2"/>
            {isOpen && <span>Dashboard</span>}
          </li>
        </Link>
        
        <Link to="/admin/vendor-approval">
          <li className="hover:bg-blue-300 p-3 flex items-center gap-3">
            <img src = {vendorApproval}  alt="vendorApproval" className="w-6 ml-2"/>
            {isOpen && <span>Vendor Approval</span>}
          </li>
        </Link>
        
        <Link to="/admin/user-management">
          <li className="hover:bg-blue-300 p-3 flex items-center gap-3" >
            <img src = {usermanagement}  alt="usermanagement" className="w-7 ml-2"/>
            {isOpen && <span>User Management</span>}
          </li>
        </Link>
        

        <Link to="/admin/feedback">
        <li className="hover:bg-blue-300 p-3 flex items-center gap-3" >
          <img src = {feedback}  alt="feedback" className="w-7 ml-2"/>
          {isOpen && <span>Feedback</span>}
        </li>
        </Link>

      </ul>
    </div>
  );
};
