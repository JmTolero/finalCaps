import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav.jsx';
import axios from 'axios';
import { handleValidatedChange, validateFormData, trimFormData } from '../../utils/inputValidation';

export const VendorRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    username: '',
    password: '',
    confirmPassword: '',
    contact_no: '',
    email: '',
    birth_date: '',
    gender: '',
    valid_id: null,
    business_permit: null,
    proof_image: null
  });
  const [status, setStatus] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-hide error messages after 3 seconds and scroll to top when error/success occurs
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
    }
  }, [status.type]);

  const handleChange = (e) => {
    // Prevent spaces in username, password, and contact fields
    const noSpaceFields = ['username', 'password', 'confirmPassword', 'contact_no'];
    handleValidatedChange(e, setForm, noSpaceFields);
  };

  const handleFileChange = (e) => {
    const { id, files } = e.target;
    setForm(prev => ({ ...prev, [id]: files[0] }));
  };


  const validateForm = () => {
    console.log('Form data:', form); // Debug log
    
    // Validate required text fields for empty/whitespace values
    const requiredTextFields = ['fname', 'lname', 'username', 'password', 'contact_no', 'email', 'birth_date', 'gender'];
    const validation = validateFormData(form, requiredTextFields);
    if (!validation.isValid) {
      setStatus({ type: 'error', message: validation.message });
      return false;
    }

    // Address is optional during registration - will be added later in settings

    if (form.password !== form.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return false;
    }

    if (form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long' });
      return false;
    }

    if (!form.valid_id || !form.business_permit || !form.proof_image) {
      setStatus({ type: 'error', message: 'Please upload all required documents' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      console.log('Attempting vendor registration with API base:', apiBase);
      
      // Trim form data before sending
      const trimmedForm = trimFormData(form);
      console.log('Trimmed form data:', trimmedForm);
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('fname', trimmedForm.fname);
      formData.append('lname', trimmedForm.lname);
      formData.append('username', trimmedForm.username);
      formData.append('password', trimmedForm.password);
      formData.append('contact_no', trimmedForm.contact_no);
      formData.append('email', trimmedForm.email);
      formData.append('birth_date', trimmedForm.birth_date);
      formData.append('gender', trimmedForm.gender);
      formData.append('role', 'vendor');
      
      // Only append files if they exist
      if (form.valid_id) {
        formData.append('valid_id', form.valid_id);
      }
      if (form.business_permit) {
        formData.append('business_permit', form.business_permit);
      }
      if (form.proof_image) {
        formData.append('proof_image', form.proof_image);
      }

      // Debug FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      console.log('Sending registration request to:', `${apiBase}/api/vendor/register`);
      const res = await axios.post(`${apiBase}/api/vendor/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      console.log('Registration response:', res.data);

      if (res.data.success) {
        setStatus({
          type: 'success',
          message: 'Registration successful! Your application is now pending approval...'
        });
        
        // Store user data in sessionStorage to keep them logged in
        sessionStorage.setItem('user', JSON.stringify({
          id: res.data.user.user_id,
          fname: res.data.user.fname,
          email: res.data.user.email,
          role: 'vendor'
        }));
        
        // Store vendor data for setup process
        sessionStorage.setItem('pendingVendor', JSON.stringify({
          vendor_id: res.data.vendor.vendor_id,
          user_id: res.data.user.user_id,
          store_name: 'Store Name Pending Setup',
          email: res.data.user.email,
          fname: res.data.user.fname
        }));
        
        // Dispatch user change event to update navbar
        window.dispatchEvent(new Event('userChanged'));
        
        // Redirect to vendor pending page after successful registration
        setTimeout(() => {
          navigate('/vendor-pending');
        }, 2000);
      } else {
        throw new Error(res.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 3001.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please check the backend console for details.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setStatus({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavWithLogo />
      <main className="flex items-center justify-center min-h-[90vh] px-4 py-4 pt-20 sm:pt-20">
        <div 
          className="rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl text-black overflow-hidden"
          style={{backgroundColor: "#D4F6FF"}}
        >
          {/* Header Section */}
          <div className="text-center py-6 sm:py-8 px-4 sm:px-8 border-b border-sky-200">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            🍦 Vendor Registration   
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Join our ice cream vendor community and start sharing your delicious creations with customers
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

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
            {/* Two Column Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
              
              {/* Left Column - Personal Information */}
              <div className="space-y-4 sm:space-y-6">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    👤 Personal Information
                  </h2>
                  <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="fname">
                      First Name *
                    </label>
                    <input
                      id="fname"
                      type="text"
                      placeholder="Enter your first name"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.fname}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="lname">
                      Last Name *
                    </label>
                    <input
                      id="lname"
                      type="text"
                      placeholder="Enter your last name"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.lname}
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
                    placeholder="Choose a unique username"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                    value={form.username}
                    onChange={handleChange}
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="password">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
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

                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="confirmPassword">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        required
                        value={form.confirmPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
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
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="contact_no">
                      Contact Number *
                    </label>
                    <input
                      id="contact_no"
                      type="tel"
                      placeholder="09XX-XXX-XXXX"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.contact_no}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="email">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
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

              </div>

              {/* Right Column - Documents & Requirements */}
              <div className="space-y-4 sm:space-y-6">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    📄 Required Documents
                  </h2>
                  <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                </div>

                {/* File Upload Instructions */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-amber-200 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-2 flex items-center">
                    ⚠️ Important Requirements
                  </h3>
                  <ul className="text-xs sm:text-sm text-amber-700 space-y-1">
                    <li>• All documents must be clear and readable</li>
                    <li>• Accepted formats: JPG, PNG, PDF (Max 20MB each)</li>
                    <li>• Ice cream photo should show your actual product</li>
                  </ul>
                </div>

                {/* Upload Valid ID */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-700" htmlFor="valid_id">
                    Valid ID * 
                    <span className="text-xs sm:text-sm font-normal text-gray-500 block">
                      Driver's License, Passport, National ID, etc.
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="valid_id"
                      type="file"
                      accept="image/*,.pdf"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-sm sm:text-base text-black transition-all duration-200 bg-white/80 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                {/* Upload Business Permit */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-700" htmlFor="business_permit">
                    Business Permit *
                    <span className="text-xs sm:text-sm font-normal text-gray-500 block">
                      Valid business registration or permit
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="business_permit"
                      type="file"
                      accept="image/*,.pdf"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-sm sm:text-base text-black transition-all duration-200 bg-white/80 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                {/* Upload Proof Image */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-700" htmlFor="proof_image">
                    Ice Cream Making Proof *
                    <span className="text-xs sm:text-sm font-normal text-gray-500 block">
                      Photo of you making ice cream or with your ice cream products (proof of business)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="proof_image"
                      type="file"
                      accept="image/*"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-sm sm:text-base text-black transition-all duration-200 bg-white/80 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>


                {/* Registration Process Info */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-green-200 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2 flex items-center">
                    ✅ What happens next?
                  </h3>
                  <ol className="text-xs sm:text-sm text-green-700 space-y-2">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">1.</span>
                      <span>Your application will be reviewed by our team</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">2.</span>
                      <span>We'll verify your documents and business information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">3.</span>
                      <span>You'll receive approval notification via email</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">4.</span>
                      <span>Start selling your delicious ice cream!</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Register Button */}
            <div className="mt-6 sm:mt-8 flex flex-col items-center space-y-3 sm:space-y-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full max-w-md bg-gradient-to-r from-[#FFDDAE] to-[#FFD700] hover:from-[#FFDDAE]/90 hover:to-[#FFD700]/90 text-gray-800 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-lg text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-yellow-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Registration...
                  </span>
                ) : (
                  '🚀 Submit Registration'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center w-full max-w-md">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm font-medium">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Google Sign Up Button */}
              <button 
                type="button"
                onClick={() => {
                  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
                  window.location.href = `${apiBase}/api/vendor/auth/google`;
                }}
                className="w-full max-w-md bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-lg text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl border-2 border-gray-300 flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign up with Google</span>
              </button>

              {/* Login Link */}
              <div className="text-center">
                <Link to="/login" className="text-indigo-700 font-semibold hover:text-indigo-900 hover:underline transition-all duration-200 text-base sm:text-lg">
                  Already have an account? Login here →
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default VendorRegister;
  
