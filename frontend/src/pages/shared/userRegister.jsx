import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { NavWithLogo } from "../../components/shared/nav"
import { handleValidatedChange, validateFormData, trimFormData } from '../../utils/inputValidation';

export const UserRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    password: "",
    confirm: "",
    contact: "",
    email: "",
    birth_date: "",
    gender: ""
  });
  const [status, setStatus] = useState({ type: null, message: "" });

  // Auto-hide error messages after 3 seconds, redirect after success after 5 seconds, scroll to top when error occurs
  useEffect(() => {
    if (status.type === 'error') {
      // Scroll to top when error occurs
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 3000);
      
      // Cleanup timer on component unmount or status change
      return () => clearTimeout(timer);
    } else if (status.type === 'success') {
      // Scroll to top when success occurs (to show the success message)
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);
      
      // Cleanup timer on component unmount or status change
      return () => clearTimeout(timer);
    }
  }, [status.type, navigate]);

  const handleChange = (e) => {
    // Prevent spaces in username and password fields, allow spaces in names and email
    const noSpaceFields = ['username', 'password', 'confirm', 'contact'];
    handleValidatedChange(e, setForm, noSpaceFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    // Validate form data for empty/whitespace values
    const requiredFields = ['firstname', 'lastname', 'username', 'password', 'confirm', 'contact', 'email', 'birth_date', 'gender'];
    const validation = validateFormData(form, requiredFields);
    if (!validation.isValid) {
      setStatus({ type: "error", message: validation.message });
      return;
    }
  
    if (form.password !== form.confirm) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }
  
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Trim form data before sending
      const trimmedForm = trimFormData(form);
      
      await axios.post(`${apiBase}/api/auth/register`, trimmedForm, {
        headers: { "Content-Type": "application/json" },
      });
  
      setStatus({ type: "success", message: "Registration successful! Redirecting to login page in 5 seconds..." });
      setForm({
        firstname: "",
        lastname: "",
        username: "",
        password: "",
        confirm: "",
        contact: "",
        email: "",
        birth_date: "",
        gender: ""
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || "Something went wrong";
      setStatus({ type: "error", message: errorMessage });
    }
  };

  return (
    <>
      <NavWithLogo />

      <main className="flex items-center justify-center min-h-screen px-4 py-4 pt-20 sm:pt-20">
        <div 
          className="rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl text-black"
          style={{backgroundColor: "#D4F6FF"}}
        >
          {/* Header Section */}
          <div className="text-center py-6 sm:py-8 px-4 sm:px-8 border-b border-sky-200">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              👤 User Registration
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Create your account and start exploring our amazing ice cream offerings
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
              
              {/* Left Column - Personal Information */}
              <div className="space-y-4 sm:space-y-6">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    🆔 Personal Information
                  </h2>
                  <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="firstname">
                      First Name *
                    </label>
                    <input
                      id="firstname"
                      type="text"
                      placeholder="Enter your first name"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.firstname}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="lastname">
                      Last Name *
                    </label>
                    <input
                      id="lastname"
                      type="text"
                      placeholder="Enter your last name"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.lastname}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="username">
                    Username *
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="off"
                    placeholder="Choose a unique username"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                    value={form.username}
                    onChange={handleChange}
                  />
                </div>

                {/* Birth Date and Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="birth_date">
                      Birth Date *
                    </label>
                    <input
                      id="birth_date"
                      type="date"
                      placeholder="Select your birth date"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.birth_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="gender">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select your gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="password">
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.password}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="confirm">
                      Confirm Password *
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      placeholder="Re-enter your password"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.confirm}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Information */}
              <div className="space-y-4 sm:space-y-6">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    📞 Contact Information
                  </h2>
                  <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                </div>

                {/* Contact Number */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="contact">
                    Contact Number *
                  </label>
                  <input
                    id="contact"
                    type="text"
                    placeholder="09XXXXXXXXX"
                    autoComplete="off"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                    value={form.contact}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="email">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border-l-4 border-blue-400">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center text-sm sm:text-base">
                    ℹ️ Account Benefits
                  </h3>
                  <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <li>• Browse and order from multiple ice cream vendors</li>
                    <li>• Track your order history and favorites</li>
                    <li>• Receive notifications about new flavors</li>
                    <li>• Rate and review your purchases</li>
                  </ul>
                </div>

                {/* Alternative Registration Options */}
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
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/250px-Google_Favicon_2025.svg.png"
                        alt="Google"
                        className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3"
                      />
                      <span className="text-gray-800 font-medium text-sm sm:text-base">
                        Sign in with Google
                      </span>
                    </button>
                  </div>

                  {/* Vendor Registration Link */}
                  <div className="text-center">
                    <Link 
                      to="/vendor-register" 
                      className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 text-base sm:text-lg"
                    >
                      🍦 Register as a Vendor instead
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-sky-200 relative z-10 bg-white/20 rounded-lg sm:rounded-xl py-4 sm:py-6 mx-2 sm:mx-4">
              <button
                type="submit"
                className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-extrabold py-2 sm:py-3 px-6 sm:px-8 text-base sm:text-lg rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:min-w-[200px] sm:w-auto border-2 border-gray-700 drop-shadow-lg"
                style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}
              >
                🚀 CREATE ACCOUNT
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};
