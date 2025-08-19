import { NavWithLogo } from "../../components/nav";
import { Sidebar } from "../../components/admin/adminSidebar";
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './dashboard';
import AdminUserManagement from './usermanagement';
import AdminVendorApproval from './vendorApproval';
import AdminFeedback from './feedback';


export const Admin = () => {
  return (
    <>
      <NavWithLogo />
      <div className="flex h-screen">
        <Sidebar className="w-64" />

        <main className="flex-1 max-w-4xl mx-10 py-10 h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="user-management" element={<AdminUserManagement />} />
            <Route path="vendor-approval" element={<AdminVendorApproval />} />
            <Route path="feedback" element={<AdminFeedback />} />
          </Routes>
        </main>
      </div>
    </>
  );
};


export default Admin;


