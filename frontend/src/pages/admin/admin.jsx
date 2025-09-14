import { NavWithLogo } from "../../components/shared/nav";
import { Sidebar } from "../../components/admin/adminSidebar";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminDashboard from './dashboard';
import AdminUserManagement from './usermanagement';
import AdminVendorApproval from './vendorApproval';
import AdminVendorLocations from './vendorLocations';
import AdminFeedback from './feedback';


export const Admin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarOpen(prev => !prev);
    };

    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  return (
    <>
      <NavWithLogo />
      <div className="flex min-h-screen">
        <Sidebar />

        <main className={`flex-1 pt-20 p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="user-management" element={<AdminUserManagement />} />
              <Route path="vendor-approval" element={<AdminVendorApproval />} />
              <Route path="vendor-locations" element={<AdminVendorLocations />} />
              <Route path="feedback" element={<AdminFeedback />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
};


export default Admin;


