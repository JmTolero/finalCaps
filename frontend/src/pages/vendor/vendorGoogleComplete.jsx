import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav.jsx';
import axios from 'axios';
import { handleValidatedChange, validateFormData, trimFormData } from '../../utils/inputValidation';

export const VendorGoogleComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    birth_date: '',
    gender: '',
    contact_no: '',
    valid_id: null,
    business_permit: null,
    proof_image: null
  });
  const [status, setStatus] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [showExistingUserMessage, setShowExistingUserMessage] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState({
    valid_id: null,
    business_permit: null,
    proof_image: null
  });
  const [checkingDocuments, setCheckingDocuments] = useState(true);

  // Check if documents are already uploaded
  useEffect(() => {
    const checkExistingDocuments = async () => {
      if (!user || !user.id) {
        setCheckingDocuments(false);
        return;
      }

      try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const setupResponse = await axios.get(`${apiBase}/api/vendor/setup-status/${user.id}`);
        
        if (setupResponse.data.success && setupResponse.data.isVendor) {
          const vendor = setupResponse.data.vendor;
          
          // Try to get vendor details with document URLs
          try {
            // Use vendor current endpoint which includes document URLs
            const vendorResponse = await axios.get(`${apiBase}/api/vendor/current`, {
              headers: {
                'x-user-id': user.id
              }
            });
            
            if (vendorResponse.data.success && vendorResponse.data.vendor) {
              const vendorData = vendorResponse.data.vendor;
              
              setExistingDocuments({
                valid_id: vendorData.valid_id_url || null,
                business_permit: vendorData.business_permit_url || null,
                proof_image: vendorData.proof_image_url || null
              });

              // If all documents are uploaded, redirect immediately
              if (vendorData.valid_id_url && vendorData.business_permit_url && vendorData.proof_image_url) {
                console.log('All documents already uploaded, redirecting to vendor-pending immediately');
                // Redirect immediately - no delay
                navigate('/vendor-pending');
                return;
              }
            }
          } catch (vendorError) {
            console.error('Error fetching vendor details:', vendorError);
            // If vendor current fails, try admin endpoint if we have vendor_id
            if (vendor.vendor_id) {
              try {
                const adminResponse = await axios.get(`${apiBase}/api/admin/vendors/${vendor.vendor_id}`);
                if (adminResponse.data.success && adminResponse.data.vendor) {
                  const vendorData = adminResponse.data.vendor;
                  setExistingDocuments({
                    valid_id: vendorData.valid_id_url || null,
                    business_permit: vendorData.business_permit_url || null,
                    proof_image: vendorData.proof_image_url || null
                  });
                }
              } catch (adminError) {
                console.error('Error fetching vendor from admin endpoint:', adminError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing documents:', error);
      } finally {
        setCheckingDocuments(false);
      }
    };

    if (user && user.id) {
      checkExistingDocuments();
    }
  }, [user, navigate]);

  useEffect(() => {
    // Get user data from URL parameters
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const vendorIdParam = searchParams.get('vendor_id');
    const existingParam = searchParams.get('existing');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus({
        type: 'error',
        message: 'Google authentication failed. Please try again.'
      });
      // Set a dummy user object so the component can render the error
      setUser({ error: true });
      // Redirect to login after showing error
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        setUser(userData);
        setIsExistingUser(existingParam === 'true');
        if (vendorIdParam) {
          setVendorId(vendorIdParam);
        }
        
        // Set username from user data
        setForm(prev => ({
          ...prev,
          username: userData.username || ''
        }));
        
        // Store token and user data
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Dispatch user change event to update navbar
        window.dispatchEvent(new Event('userChanged'));
      } catch (error) {
        console.error('Error parsing user data:', error);
        setStatus({
          type: 'error',
          message: 'Invalid user data. Please try again.'
        });
        // Set a dummy user object so the component can render the error
        setUser({ error: true });
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } else {
      // Check if user data exists in localStorage/sessionStorage as fallback
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // Use stored token
          if (!localStorage.getItem('token')) {
            localStorage.setItem('token', storedToken);
          }
          if (!sessionStorage.getItem('token')) {
            sessionStorage.setItem('token', storedToken);
          }
          window.dispatchEvent(new Event('userChanged'));
          return;
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
      
      // No valid data found - show error and redirect
      setStatus({
        type: 'error',
        message: 'Missing authentication data. Please try again.'
      });
      // Set a dummy user object so the component can render the error
      setUser({ error: true });
      // Redirect to login after showing error
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [searchParams, navigate]);

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

  // Auto-hide existing user message after 10 seconds
  useEffect(() => {
    if (isExistingUser && showExistingUserMessage) {
      const timer = setTimeout(() => {
        setShowExistingUserMessage(false);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isExistingUser, showExistingUserMessage]);

  const handleChange = (e) => {
    // Prevent spaces in contact, username, and password fields
    const noSpaceFields = ['contact_no', 'username', 'password', 'confirmPassword'];
    handleValidatedChange(e, setForm, noSpaceFields);
  };

  const handleFileChange = (e) => {
    const { id, files } = e.target;
    setForm(prev => ({ ...prev, [id]: files[0] }));
  };

  const validateForm = () => {
    console.log('Form data:', form); // Debug log
    
    // Validate required text fields for empty/whitespace values
    const requiredTextFields = ['birth_date', 'gender', 'password', 'confirmPassword'];
    const validation = validateFormData(form, requiredTextFields);
    if (!validation.isValid) {
      setStatus({ type: 'error', message: validation.message });
      return false;
    }

    // Validate password length
    if (form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long' });
      return false;
    }

    // Validate password match
    if (form.password !== form.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return false;
    }

    // Check if all documents are uploaded (either new uploads or existing)
    const hasValidId = form.valid_id || existingDocuments.valid_id;
    const hasBusinessPermit = form.business_permit || existingDocuments.business_permit;
    const hasProofImage = form.proof_image || existingDocuments.proof_image;
    
    if (!hasValidId || !hasBusinessPermit || !hasProofImage) {
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
      console.log('Attempting to complete vendor registration with API base:', apiBase);
      
      // Trim form data before sending
      const trimmedForm = trimFormData(form);
      console.log('Trimmed form data:', trimmedForm);
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('user_id', user.id);
      if (vendorId) {
        formData.append('vendor_id', vendorId);
      }
      if (trimmedForm.username) {
        formData.append('username', trimmedForm.username);
      }
      formData.append('password', trimmedForm.password);
      formData.append('birth_date', trimmedForm.birth_date);
      formData.append('gender', trimmedForm.gender);
      formData.append('contact_no', trimmedForm.contact_no);
      
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
      
      console.log('Sending completion request to:', `${apiBase}/api/vendor/auth/complete-registration`);
      const res = await axios.post(`${apiBase}/api/vendor/auth/complete-registration`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      console.log('Completion response:', res.data);

      if (res.data.success) {
        setStatus({
          type: 'success',
          message: 'Registration completed successfully! Your application is now pending approval...'
        });
        
        // Update user data in sessionStorage
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
        
        // Redirect to vendor pending page after successful completion
        setTimeout(() => {
          navigate('/vendor-pending');
        }, 2000);
      } else {
        throw new Error(res.data.message || 'Registration completion failed');
      }
    } catch (err) {
      console.error('Registration completion error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Registration completion failed. Please try again.';
      
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

  if (!user || checkingDocuments) {
    return (
      <>
        <NavWithLogo />
        <main className="flex items-center justify-center min-h-[90vh] px-4 py-4 pt-20 sm:pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
            {checkingDocuments && (
              <p className="text-sm text-gray-500 mt-2">Checking for existing documents...</p>
            )}
            {!checkingDocuments && (
              <p className="text-sm text-gray-500 mt-2">If this takes too long, please try signing in again.</p>
            )}
          </div>
        </main>
      </>
    );
  }

  // Show error state if user object has error flag
  if (user.error) {
    return (
      <>
        <NavWithLogo />
        <main className="flex items-center justify-center min-h-[90vh] px-4 py-4 pt-20 sm:pt-20">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Error</h2>
            {status.message && (
              <p className="text-gray-600 mb-6">{status.message}</p>
            )}
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        </main>
      </>
    );
  }

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
               Complete Vendor Registration
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Welcome {user.firstName}! Please complete your vendor registration by providing additional information and required documents.
            </p>
            {isExistingUser && showExistingUserMessage && (
              <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg transition-opacity duration-500">
                <p className="text-blue-800 text-sm">
                  <strong>Existing User:</strong> You already have an account. We're upgrading you to vendor status.
                </p>
              </div>
            )}
          </div>

          {/* Status Message - Moved to top */}
          {status.type && (
            <div className={`text-center mx-4 sm:mx-8 mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl ${
              status.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <div className="font-semibold text-sm sm:text-base mb-2">{status.message}</div>
              {status.type === 'success' && status.message.includes('already uploaded') && (
                <button
                  onClick={() => navigate('/vendor-pending')}
                  className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Go to Pending Page Now →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
            {/* Two Column Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
              
              {/* Left Column - Additional Information */}
              <div className="space-y-4 sm:space-y-6">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    📝 Additional Information
                  </h2>
                  <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                </div>

                {/* User Info Display */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-green-200 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2 flex items-center">
                    ✅ Google Account Information
                  </h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Username:</strong> {user.username}</p>
                  </div>
                </div>

                {/* Username Field - Only show for existing users */}
                {isExistingUser && (
                  <div className="form-group">
                    <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="username">
                      Username
                      <span className="text-xs sm:text-sm font-normal text-gray-500 block">
                        You can change your username if you want
                      </span>
                    </label>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your preferred username"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      value={form.username}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      3-20 characters, letters, numbers, and underscores only
                    </p>
                  </div>
                )}

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

                {/* Contact Number */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="contact_no">
                    Contact Number
                  </label>
                  <input
                    id="contact_no"
                    type="tel"
                    placeholder="09XX-XXX-XXXX"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    value={form.contact_no}
                    onChange={handleChange}
                  />
                </div>

                {/* Password Field */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="password">
                    Password *
                    <span className="text-xs sm:text-sm font-normal text-gray-500 block">
                      Set a password for your account (minimum 6 characters)
                    </span>
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
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L6.878 6.878M6.88 6.88L3 3m3.29 3.29L12 12m-3.29-3.29L12 12m0 0l3.29 3.29M12 12l3.29-3.29m0 0L21 21m-3.29-3.29L21 21" />
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

                {/* Confirm Password Field */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 text-gray-700" htmlFor="confirmPassword">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base sm:text-lg text-black transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L6.878 6.878M6.88 6.88L3 3m3.29 3.29L12 12m-3.29-3.29L12 12m0 0l3.29 3.29M12 12l3.29-3.29m0 0L21 21m-3.29-3.29L21 21" />
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
                  {existingDocuments.valid_id ? (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg sm:rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-green-800 font-semibold">✅ Document Already Uploaded</p>
                          <p className="text-green-600 text-sm">Valid ID has been uploaded successfully</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id="valid_id"
                        type="file"
                        accept="image/*,.pdf"
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-sm sm:text-base text-black transition-all duration-200 bg-white/80 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </div>

                {/* Upload Business Permit */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-700" htmlFor="business_permit">
                    Business Permit *
                    <span className="text-xs sm:text-sm font-normal text-gray-500 block">
                      Valid business registration or permit
                    </span>
                  </label>
                  {existingDocuments.business_permit ? (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg sm:rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-green-800 font-semibold">✅ Document Already Uploaded</p>
                          <p className="text-green-600 text-sm">Business Permit has been uploaded successfully</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id="business_permit"
                        type="file"
                        accept="image/*,.pdf"
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-sm sm:text-base text-black transition-all duration-200 bg-white/80 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </div>

                {/* Upload Proof Image */}
                <div className="form-group">
                  <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-700" htmlFor="proof_image">
                    Ice Cream Making Proof *
                    <span className="text-xs sm:text-sm font-normal text-gray-500 block">
                      Photo of you making ice cream or with your ice cream products (proof of business)
                    </span>
                  </label>
                  {existingDocuments.proof_image ? (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg sm:rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-green-800 font-semibold">✅ Document Already Uploaded</p>
                          <p className="text-green-600 text-sm">Ice Cream Making Proof has been uploaded successfully</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id="proof_image"
                        type="file"
                        accept="image/*"
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-sm sm:text-base text-black transition-all duration-200 bg-white/80 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
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

            {/* Complete Registration Button */}
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
                    Completing Registration...
                  </span>
                ) : (
                  '🚀 Complete Registration'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default VendorGoogleComplete;
