import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
    import './App.css';
    import { CartProvider } from './contexts/CartContext';
import { LandingPage } from './pages/shared/landingpage';
import { Login } from "./pages/shared/login.jsx";
import { ForgotPassword } from "./pages/shared/forgotPassword.jsx";
import { ResetPassword } from "./pages/shared/resetPassword.jsx";
import { UserRegister } from "./pages/shared/userRegister.jsx";
import ContactSupport from "./pages/shared/ContactSupport.jsx";
import { VendorRegister } from "./pages/vendor/vendorRegister.jsx";
import { VendorGoogleComplete } from "./pages/vendor/vendorGoogleComplete.jsx";
import { BecomeVendor } from "./pages/vendor/BecomeVendor.jsx";
import { VendorSetup } from "./pages/vendor/VendorSetup.jsx";
import { VendorPending } from "./pages/vendor/VendorPending.jsx";
    import { VendorRedirect } from "./components/shared/VendorRedirect.jsx";
    import { Home } from "./pages/shared/home.jsx";
    import { Admin } from "./pages/admin/admin.jsx";
    import { Vendor } from "./pages/vendor/vendor.jsx";
    import { Customer } from "./pages/customer/customer.jsx";
import { Cart } from "./pages/customer/Cart.jsx";
import { FindNearbyVendors } from "./pages/customer/FindNearbyVendors.jsx";
import { AllVendorStores } from "./pages/customer/AllVendorStores.jsx";
import { VendorStore } from "./pages/customer/VendorStore.jsx";
import { FlavorDetail } from "./pages/customer/FlavorDetail.jsx";
import { Checkout } from "./pages/customer/Checkout.jsx";
import { OrderConfirmation } from "./pages/customer/OrderConfirmation.jsx";
    import { Notifications } from "./pages/customer/Notifications.jsx";
import { MyFeedback } from "./pages/customer/MyFeedback.jsx";
import CustomerPayment from "./pages/customer/CustomerPayment.jsx";
import CustomerGCashAccount from "./pages/customer/CustomerGCashAccount.jsx";
import PaymentSuccess from "./pages/customer/PaymentSuccess.jsx";
import VendorGCashAccount from "./pages/vendor/VendorGCashAccount.jsx";
import SubscriptionSuccess from "./pages/vendor/SubscriptionSuccess.jsx";
import SubscriptionFailed from "./pages/vendor/SubscriptionFailed.jsx";
import LoginTest from "./pages/shared/LoginTest.jsx";
import { GoogleCallback } from "./pages/shared/googleCallback.jsx";
    // import Nav from '../src/components/nav';

    function App() {
  const [user, setUser] = useState(null);
  const initialLoadRef = useRef(true);

  // Update user state when storage changes
  useEffect(() => {
    const updateUser = () => {
      if (typeof window === 'undefined') {
        setUser(null);
        return;
      }

      let userRaw = localStorage.getItem('user');
      let tokenRaw = localStorage.getItem('token');

      if (initialLoadRef.current && !tokenRaw) {
        const legacyToken = sessionStorage.getItem('token');
        if (legacyToken) {
          localStorage.setItem('token', legacyToken);
          sessionStorage.removeItem('token');
          tokenRaw = legacyToken;
        }
      }

      if (initialLoadRef.current && !userRaw) {
        const legacyUser = sessionStorage.getItem('user');
        if (legacyUser) {
          localStorage.setItem('user', legacyUser);
          sessionStorage.removeItem('user');
          userRaw = legacyUser;
        }
      }

      if (userRaw) {
        sessionStorage.setItem('user', userRaw);
      } else {
        sessionStorage.removeItem('user');
      }

      if (tokenRaw) {
        sessionStorage.setItem('token', tokenRaw);
      } else {
        sessionStorage.removeItem('token');
      }

      const userData = userRaw ? JSON.parse(userRaw) : null;
      setUser(userData);

      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }
    };

    // Initial load
    updateUser();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
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
    console.log('requireRole called with role:', role);
    console.log('Current user:', user);
    
    // If user is still loading (null), don't redirect yet
    if (user === null) {
      // Check if there's a user in sessionStorage while loading
      const userRaw = typeof window !== 'undefined' ? (localStorage.getItem('user') || sessionStorage.getItem('user')) : null;
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
    console.log('Current role:', currentRole, 'Required role:', role);
    
    if (currentRole !== role) {
      console.log('Role mismatch, redirecting to login');
      return <Navigate to="/login" replace />;
    }
    
    console.log('Role check passed, rendering element');
    return element;
  };
  // VendorPending route - accessible to vendors and rejected vendors (who may have customer role)
  const VendorPendingRoute = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    const role = (user?.role || 'customer').toLowerCase();
    
    // Allow access if user is vendor OR if they have rejected vendor status (even if role is customer)
    if (role === 'vendor' || role === 'customer') {
      // For customers, check if they have a rejected vendor application
      if (role === 'customer') {
        // This will be checked in VendorPending component itself
        // Allow access - VendorPending will handle showing rejection message
        return <VendorPending />;
      }
      return <VendorPending />;
    }
    
    return <Navigate to="/login" replace />;
  };

  // Redirect logged-in users away from login page
  const LoginRoute = () => {
    if (user) {
      const role = (user?.role || 'customer').toLowerCase();
      
      // Special handling for vendors - check vendor status first
      if (role === 'vendor') {
        // VendorRedirect will handle the actual status check and redirect appropriately
        return <VendorRedirect />;
      }
      
      if (role === 'admin') return <Navigate to="/admin" replace />;
      if (role === 'customer') return <Navigate to="/customer" replace />;
      return <Navigate to="/home" replace />;
    }
    return <Login />;
  };

  return (
    <>
    <CartProvider>
    <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />        
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/google-callback" element={<GoogleCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/user-register" element={<UserRegister />} />
          <Route path="/vendor-register" element={<VendorRegister />} />
          <Route path="/vendor-google-complete" element={<VendorGoogleComplete />} />
          <Route path="/become-vendor" element={requireRole('customer', <BecomeVendor />)} />
          <Route path="/vendor-setup" element={<VendorSetup />} />
          <Route path="/vendor-pending" element={<VendorPendingRoute />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin/*" element={requireRole('admin', <Admin />)} />
          <Route path="/vendor" element={requireRole('vendor', <Vendor />)} />
          <Route path="/vendor-redirect" element={<VendorRedirect />} />
          <Route path="/customer" element={requireRole('customer', <Customer />)} />
          <Route path="/cart" element={requireRole('customer', <Cart />)} />
          <Route path="/customer/notifications" element={requireRole('customer', <Notifications />)} />
          <Route path="/customer/my-feedback" element={<MyFeedback />} />
          <Route path="/customer/payment/:orderId" element={requireRole('customer', <CustomerPayment />)} />
          <Route path="/customer/gcash-account/:orderId" element={requireRole('customer', <CustomerGCashAccount />)} />
          <Route path="/customer/payment/success/:orderId" element={requireRole('customer', <PaymentSuccess />)} />
          <Route path="/vendor/gcash-account" element={requireRole('vendor', <VendorGCashAccount />)} />
          <Route path="/vendor/subscription/success" element={requireRole('vendor', <SubscriptionSuccess />)} />
          <Route path="/vendor/subscription/failed" element={requireRole('vendor', <SubscriptionFailed />)} />
          <Route path="/find-vendors" element={requireRole('customer', <FindNearbyVendors />)} />
          <Route path="/all-vendor-stores" element={requireRole('customer', <AllVendorStores />)} />
          <Route path="/vendor/:vendorId/store" element={requireRole('customer', <VendorStore />)} />
          <Route path="/flavor/:flavorId" element={requireRole('customer', <FlavorDetail />)} />
          <Route path="/checkout" element={requireRole('customer', <Checkout />)} />
          <Route path="/order-confirmation" element={requireRole('customer', <OrderConfirmation />)} />
          <Route path="/contact" element={<ContactSupport />} />
          <Route path="/login-test" element={<LoginTest />} />
        </Routes>
      </Router>
    </CartProvider>
    </>
  );
}

    export default App;
