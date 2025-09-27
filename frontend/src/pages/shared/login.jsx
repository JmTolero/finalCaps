// import { useRef, useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {NavWithLogo} from '../../components/shared/nav.jsx';
import axios from 'axios';
import { handleValidatedChange, validateFormData, trimFormData } from '../../utils/inputValidation';


export const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [status, setStatus] = useState({ type: null, message: '' });

    // Auto-hide error messages after 3 seconds and scroll to top when error occurs
    useEffect(() => {
        if (status.type === 'error') {
            // Scroll to top when error occurs
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            const timer = setTimeout(() => {
                setStatus({ type: null, message: '' });
            }, 3000);
            
            // Cleanup timer on component unmount or status change
            return () => clearTimeout(timer);
        }
    }, [status.type]);

    const handleChange = (e) => {
      // Prevent spaces in username and password fields
      handleValidatedChange(e, setForm, ['username', 'password']);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setStatus({ type: null, message: "" });

      // Validate form data
      const validation = validateFormData(form, ['username', 'password']);
      if (!validation.isValid) {
        setStatus({ type: 'error', message: validation.message });
        return;
      }

      try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        
        // Trim form data before sending
        const trimmedForm = trimFormData(form);

        // axios automatically stringifies objects and sets headers
        const res = await axios.post(`${apiBase}/api/auth/login`, trimmedForm);

        // Response data is already JSON
        const data = res.data;

        // If backend sends error, you can throw
        if (!data.user) {
          throw new Error(data?.error || "Login failed");
        } 

        // Save user info in sessionStorage
        sessionStorage.setItem("user", JSON.stringify(data.user));

        // Dispatch custom event to notify App component of user change
        window.dispatchEvent(new Event('userChanged'));

        const role = (data.user?.role || "customer").toLowerCase();
        console.log('Login successful, user role:', role, 'User data:', data.user);
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "vendor") {
          console.log('User is a vendor, checking vendor status...');
          // Check vendor status and setup completion before redirecting
          try {
            // First check approval status
            const vendorStatusRes = await axios.get(`${apiBase}/api/admin/users/${data.user.id}`);
            console.log('Vendor status response:', vendorStatusRes.data);
            if (vendorStatusRes.data.success) {
              const userData = vendorStatusRes.data.user;
              console.log('Vendor user data:', userData);
              if (userData.vendor_status === 'pending') {
                console.log('Vendor status is pending, checking if they have uploaded documents');
                // Check if vendor has uploaded documents (business permit and valid ID)
                const setupStatusRes = await axios.get(`${apiBase}/api/vendor/setup-status/${data.user.id}`);
                console.log('Setup status response for pending vendor:', setupStatusRes.data);
                if (setupStatusRes.data.success && setupStatusRes.data.isVendor) {
                  // If they have documents but setup is not complete, go to setup
                  if (setupStatusRes.data.vendor.business_permit_url && setupStatusRes.data.vendor.valid_id_url) {
                    console.log('Vendor has uploaded documents, redirecting to setup page');
                    navigate(`/vendor-setup?vendor_id=${setupStatusRes.data.vendor.vendor_id}`);
                    return;
                  } else {
                    console.log('Vendor has not uploaded documents yet, redirecting to pending page');
                    navigate("/vendor-pending");
                    return;
                  }
                } else {
                  console.log('No vendor record found, redirecting to pending page');
                  navigate("/vendor-pending");
                  return;
                }
              } else if (userData.vendor_status === 'rejected') {
                console.log('Vendor status is rejected, redirecting to pending page');
                navigate("/vendor-pending");
                return;
              } else if (userData.vendor_status === 'approved') {
                console.log('Vendor status is approved, checking setup status');
                // Check if setup is complete
                const setupStatusRes = await axios.get(`${apiBase}/api/vendor/setup-status/${data.user.id}`);
                console.log('Setup status response:', setupStatusRes.data);
                if (setupStatusRes.data.success && setupStatusRes.data.isVendor) {
                  if (!setupStatusRes.data.setupComplete) {
                    console.log('Setup not complete, redirecting to setup page');
                    // Redirect to setup page with vendor_id
                    navigate(`/vendor-setup?vendor_id=${setupStatusRes.data.vendor.vendor_id}`);
                    return;
                  }
                }
                // If approved and setup complete, go to vendor dashboard
                console.log('Vendor approved and setup complete, redirecting to vendor dashboard');
                navigate("/vendor");
                return;
              }
            }
          } catch (vendorError) {
            console.error('Error checking vendor status:', vendorError);
            // If we can't check status, try to go to vendor dashboard anyway
            // This handles cases where the admin API might not be available
          }
          
          // Default fallback - go to vendor dashboard
          console.log('Default fallback: redirecting to vendor dashboard');
          navigate("/vendor");
        } else {
          // Customers go to marketplace (customer page)
          console.log('Customer login, redirecting to marketplace');
          navigate("/customer");
        }
      } catch (err) {
        setStatus({
          type: "error",
          message: err.response?.data?.error || err.message || "Something went wrong",
        });
      }
    };

    return (
      <>
        <NavWithLogo />
        
        <main className="flex items-center justify-center min-h-screen px-4 py-4 pt-20 sm:pt-20">
          <div 
            className="rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl text-black"
            style={{backgroundColor: "#D4F6FF"}}
          >
            {/* Header Section */}
            <div className="text-center py-8 sm:py-8 px-4 sm:px-8 border-b border-sky-200">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2">
                🔐 Welcome Back
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Sign in to your account and continue your ice cream journey
              </p>
            </div>

            {/* Status Message - Moved to top */}
            {status.type && (
              <div className={`text-center mx-4 sm:mx-8 mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl ${
                status.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                <div className="font-semibold text-sm sm:text-base">{status.message}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 pb-8 sm:pb-12">
              {/* Two Column Layout for Desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
                
                {/* Left Column - Login Form */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center">
                      👤 Sign In
                    </h2>
                    <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                  </div>

                  {/* Username */}
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="username">
                      Username *
                    </label>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      autoComplete='off'
                      value={form.username}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="password">
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.password}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Link to="#" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 text-sm sm:text-base">
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                {/* Right Column - Welcome Info & Options */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center">
                      🍦 Quick Access
                    </h2>
                    <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                  </div>

                  {/* Welcome Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border-l-4 border-blue-400">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center text-sm sm:text-base">
                      🎉 Welcome Back!
                    </h3>
                    <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <li>• Access your favorite ice cream vendors</li>
                      <li>• View your order history</li>
                      <li>• Manage your account settings</li>
                      <li>• Discover new flavors and deals</li>
                    </ul>
                  </div>

                  {/* Alternative Login Options */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-center">
                      <span className="text-gray-600 text-xs sm:text-sm font-medium">or</span>
                    </div>

                    {/* Google Sign In */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="flex items-center justify-center border-2 border-gray-300 rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
                      >
                        <img
                          src="https://www.svgrepo.com/show/475656/google-color.svg"
                          alt="Google"
                          className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3"
                        />
                        <span className="text-gray-800 font-medium text-sm sm:text-base">
                          Sign in with Google
                        </span>
                      </button>
                    </div>

                    {/* Registration Links */}
                    <div className="space-y-2 sm:space-y-3 text-center">
                      <div>
                        <Link 
                          to="/user-register" 
                          className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 text-base sm:text-lg"
                        >
                          👤 Create Customer Account
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                      <div>
                        <Link 
                          to="/vendor-register" 
                          className="inline-flex items-center text-green-600 font-semibold hover:text-green-800 transition-colors duration-200 text-base sm:text-lg"
                        >
                          🍦 Register as Vendor
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <div className="flex justify-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-sky-200 relative z-10 bg-white/20 rounded-lg sm:rounded-xl py-4 sm:py-6 mx-2 sm:mx-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-extrabold py-2 sm:py-3 px-6 sm:px-8 text-base sm:text-lg rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:min-w-[160px] sm:w-auto border-2 border-gray-700 drop-shadow-lg"
                  style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}
                >
                  🚀 LOGIN
                </button>
              </div>
            </form>
          </div>
        </main>
      </>
    );
}

export default Login;