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
  // Sidebar state - always closed on initial load for clean login experience
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarOpen(prev => !prev);
    };

    const handleClose = () => {
      setIsSidebarOpen(false);
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
      if (!isDesktop && isSidebarOpen) {
        // Auto-close when resizing to mobile
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  return (
    <>
      <NavWithLogo />
      <div className="flex min-h-screen">
        <Sidebar />

        {/* Backdrop overlay when sidebar is open (mobile/tablet only) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40 top-16 transition-opacity duration-300 lg:hidden"
            onClick={() => window.dispatchEvent(new Event('closeSidebar'))}
          />
        )}

        <main className="flex-1 pt-20 p-4 sm:p-6 lg:p-8 w-full">
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


