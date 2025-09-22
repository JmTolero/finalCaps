    import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
    import { useState, useEffect } from 'react';
    import './App.css';
    import { LandingPage } from './pages/shared/landingpage';
    import { Login } from "./pages/shared/login.jsx";
    import { UserRegister } from "./pages/shared/userRegister.jsx";
    import { VendorRegister } from "./pages/vendor/vendorRegister.jsx";
    import { BecomeVendor } from "./pages/vendor/BecomeVendor.jsx";
    import { VendorSetup } from "./pages/vendor/VendorSetup.jsx";
    import { VendorPending } from "./pages/vendor/VendorPending.jsx";
    import { VendorRedirect } from "./components/shared/VendorRedirect.jsx";
    import { Home } from "./pages/shared/home.jsx";
    import { Admin } from "./pages/admin/admin.jsx";
    import { Vendor } from "./pages/vendor/vendor.jsx";
    import { Customer } from "./pages/customer/customer.jsx";
    import { FindNearbyVendors } from "./pages/customer/FindNearbyVendors.jsx";
    import { FlavorDetail } from "./pages/customer/FlavorDetail.jsx";
    import { Checkout } from "./pages/customer/Checkout.jsx";
    import { Notifications } from "./pages/customer/Notifications.jsx";
import PaymentPage from "./pages/customer/PaymentPage.jsx";
import LoginTest from "./pages/shared/LoginTest.jsx";
    // import Nav from '../src/components/nav';

    function App() {
  const [user, setUser] = useState(null);

  // Update user state when sessionStorage changes
  useEffect(() => {
    const updateUser = () => {
      const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
      const userData = userRaw ? JSON.parse(userRaw) : null;
      setUser(userData);
    };

    // Initial load
    updateUser();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        updateUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab login/logout
    const handleUserChange = () => {
      updateUser();
    };

    window.addEventListener('userChanged', handleUserChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, []);

  const requireRole = (role, element) => {
    // If user is still loading (null), don't redirect yet
    if (user === null) {
      // Check if there's a user in sessionStorage while loading
      const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
      if (userRaw) {
        // User exists in storage but state hasn't loaded yet, wait
        return <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>;
      }
      // No user in storage, redirect to login
      return <Navigate to="/login" replace />;
    }
    
    const currentRole = (user?.role || 'customer').toLowerCase();
    if (currentRole !== role) return <Navigate to="/login" replace />;
    return element;
  };
  // Redirect logged-in users away from login page
  const LoginRoute = () => {
    if (user) {
      const role = (user?.role || 'customer').toLowerCase();
      if (role === 'admin') return <Navigate to="/admin" replace />;
      if (role === 'vendor') return <VendorRedirect />;
      if (role === 'customer') return <Navigate to="/customer" replace />;
      return <Navigate to="/home" replace />;
    }
    return <Login />;
  };

  return (
    <>
    <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />        
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/user-register" element={<UserRegister />} />
          <Route path="/vendor-register" element={<VendorRegister />} />
          <Route path="/become-vendor" element={requireRole('customer', <BecomeVendor />)} />
          <Route path="/vendor-setup" element={<VendorSetup />} />
          <Route path="/vendor-pending" element={<VendorPending />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin/*" element={requireRole('admin', <Admin />)} />
          <Route path="/vendor" element={requireRole('vendor', <Vendor />)} />
          <Route path="/vendor-redirect" element={<VendorRedirect />} />
          <Route path="/customer" element={requireRole('customer', <Customer />)} />
          <Route path="/customer/notifications" element={requireRole('customer', <Notifications />)} />
          <Route path="/customer/payment/:orderId" element={requireRole('customer', <PaymentPage />)} />
          <Route path="/find-vendors" element={requireRole('customer', <FindNearbyVendors />)} />
          <Route path="/flavor/:flavorId" element={requireRole('customer', <FlavorDetail />)} />
          <Route path="/checkout" element={requireRole('customer', <Checkout />)} />
          <Route path="/login-test" element={<LoginTest />} />
        </Routes>
      </Router>
    </>
      
   
      
  );
}

    export default App;
