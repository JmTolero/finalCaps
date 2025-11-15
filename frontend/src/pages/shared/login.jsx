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
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    const handleGoogleSignIn = () => {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      // Redirect to Google OAuth endpoint
      window.location.href = `${apiBase}/api/auth/google`;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setStatus({ type: null, message: "" });
      setLoading(true);

      // Validate form data
      const validation = validateFormData(form, ['username', 'password']);
      if (!validation.isValid) {
        setStatus({ type: 'error', message: validation.message });
        setLoading(false);
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

        // Save user info and JWT token in sessionStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem("token", data.token);
          sessionStorage.setItem("token", data.token);
        }

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
              const ackKey = `vendorRejectionAcknowledged_${data.user.id}`;
              const hasAcknowledgedRejection = localStorage.getItem(ackKey) === 'true';

              if (userData.vendor_status === 'pending') {
                console.log('Vendor status is pending, checking if they have uploaded documents');
                // Check if vendor has uploaded documents (business permit and valid ID)
                const setupStatusRes = await axios.get(`${apiBase}/api/vendor/setup-status/${data.user.id}`);
                console.log('Setup status response for pending vendor:', setupStatusRes.data);
                if (setupStatusRes.data.success && setupStatusRes.data.isVendor) {
                  const vendor = setupStatusRes.data.vendor;
                  // If they have all documents but setup is not complete, go to setup
                  if (vendor.business_permit_url && vendor.valid_id_url && vendor.proof_image_url) {
                    console.log('Vendor has uploaded all documents, redirecting to vendor-pending page');
                    // All documents uploaded - go to pending page to wait for approval
                    navigate("/vendor-pending");
                    return;
                  } else {
                    // Vendor record exists but documents not uploaded
                    // Check if they're Google auth user - if so, redirect to google-complete page
                    // Otherwise, redirect to vendor-pending (they can see their status there)
                    console.log('Vendor record exists but documents not uploaded');
                    if (data.user.auth_provider === 'google' || data.user.google_id) {
                      console.log('Google auth user, redirecting to vendor-google-complete');
                      navigate("/vendor-google-complete");
                    } else {
                      // Regular login - go to pending page to see status
                      // They can complete registration from there if needed
                      console.log('Regular login user with pending status, redirecting to vendor-pending');
                      navigate("/vendor-pending");
                    }
                    return;
                  }
                } else {
                  // No vendor record exists but status is pending - go to pending page
                  console.log('No vendor record found but status is pending, redirecting to vendor-pending');
                  navigate("/vendor-pending");
                  return;
                }
              } else if (userData.vendor_status === 'rejected') {
                console.log('Vendor status is rejected, redirecting to pending page');
                if (hasAcknowledgedRejection) {
                  console.log('Vendor rejection already acknowledged, switching to customer view');
                  const updatedUserData = {
                    ...data.user,
                    role: 'customer'
                  };
                  localStorage.setItem("user", JSON.stringify(updatedUserData));
                  sessionStorage.setItem("user", JSON.stringify(updatedUserData));
                  window.dispatchEvent(new Event('userChanged'));
                  navigate("/customer");
                  return;
                } else {
                  navigate("/vendor-pending");
                  return;
                }
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
            // If we can't check status, check auth provider
            if (data.user.auth_provider === 'google' || data.user.google_id) {
              navigate("/vendor-google-complete");
            } else {
              navigate("/vendor");
            }
            return;
          }
          
          // Default fallback - check auth provider
          console.log('Default fallback: checking auth provider');
          if (data.user.auth_provider === 'google' || data.user.google_id) {
            navigate("/vendor-google-complete");
          } else {
            navigate("/vendor");
          }
        } else {
          // Check if this user has a vendor application in pending or rejected status
          try {
            const vendorStatusRes = await axios.get(`${apiBase}/api/admin/users/${data.user.id}`);
            if (vendorStatusRes.data.success) {
              const userData = vendorStatusRes.data.user;
              const ackKey = `vendorRejectionAcknowledged_${data.user.id}`;
              const hasAcknowledgedRejection = localStorage.getItem(ackKey) === 'true';
              
              console.log('Customer login - vendor_status:', userData.vendor_status);
              console.log('Customer login - hasAcknowledgedRejection:', hasAcknowledgedRejection);
              
              if (userData.vendor_status === 'rejected' && !hasAcknowledgedRejection) {
                console.log('User has rejected vendor application (not acknowledged), redirecting to pending page');
                // Update user role in session to match backend (customer)
                const updatedUserData = {
                  ...data.user,
                  role: 'customer'
                };
                sessionStorage.setItem('user', JSON.stringify(updatedUserData));
                localStorage.setItem('user', JSON.stringify(updatedUserData));
                window.dispatchEvent(new Event('userChanged'));
                navigate("/vendor-pending");
                return;
              }
              if (userData.vendor_status === 'pending') {
                console.log('User has pending vendor application, redirecting to pending page');
                // Update user role in session to match backend (customer, since backend changed it)
                const updatedUserData = {
                  ...data.user,
                  role: 'customer'
                };
                sessionStorage.setItem('user', JSON.stringify(updatedUserData));
                localStorage.setItem('user', JSON.stringify(updatedUserData));
                window.dispatchEvent(new Event('userChanged'));
                navigate("/vendor-pending");
                return;
              }
            }
          } catch (error) {
            console.log('Could not check vendor status for user, proceeding to customer page');
          }
          
          // Regular customer login
          console.log('Customer login, redirecting to marketplace');
          navigate("/customer");
        }
      } catch (err) {
        setStatus({
          type: "error",
          message: err.response?.data?.error || err.message || "Something went wrong",
        });
        setLoading(false);
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
                 Welcome Back
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
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        required
                        value={form.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 text-sm sm:text-base">
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
                        onClick={handleGoogleSignIn}
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
                           Create Customer Account
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
                           Register as Vendor
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
                  disabled={loading}
                  className={`bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-extrabold py-2 sm:py-3 px-6 sm:px-8 text-base sm:text-lg rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:min-w-[160px] sm:w-auto border-2 border-gray-700 drop-shadow-lg flex items-center justify-center ${
                    loading ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                  style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}
                >
                  {loading && (
                    <svg 
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      ></circle>
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {loading ? 'LOGGING IN...' : 'LOGIN'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </>
    );
}

export default Login;