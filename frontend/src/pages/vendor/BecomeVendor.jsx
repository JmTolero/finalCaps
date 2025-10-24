import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav';
// import logoImage from '../../assets/images/LOGO.png';
import axios from 'axios';

export const BecomeVendor = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    valid_id: null,
    business_permit: null,
    proof_image: null
  });
  const [status, setStatus] = useState({ type: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = 'ChillNet';
    
    // Get user data from session storage
    const userRaw = sessionStorage.getItem('user');
    if (!userRaw) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userRaw);
      console.log('User data from session:', user);
    setUserData(user);
    
    // Pre-fill form with existing user data
    setForm(prev => ({
      ...prev,
      // We'll use the existing user data
    }));
    
    setLoading(false);
  }, [navigate]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: files[0] || null
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Validate user name
    const firstName = userData?.firstName || userData?.fname || '';
    const lastName = userData?.lastName || userData?.lname || '';
    
    if (!firstName.trim()) {
      setStatus({ type: 'error', message: 'First name is required' });
      return false;
    }
    if (!lastName.trim()) {
      setStatus({ type: 'error', message: 'Last name is required' });
      return false;
    }
    
    // Validate form fields (store name will be set after approval)
    if (!form.valid_id) {
      setStatus({ type: 'error', message: 'Valid ID is required' });
      return false;
    }
    if (!form.business_permit) {
      setStatus({ type: 'error', message: 'Business permit is required' });
      return false;
    }
    if (!form.proof_image) {
      setStatus({ type: 'error', message: 'Ice cream photo is required' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Create FormData for file uploads
      const formData = new FormData();
      const firstName = userData.firstName || userData.fname || '';
      const lastName = userData.lastName || userData.lname || '';
      
      formData.append('fname', firstName);
      formData.append('lname', lastName);
      formData.append('username', userData.username || '');
      formData.append('password', userData.password || 'defaultPassword123'); // Note: In production, you'd want to re-verify password
      formData.append('contact_no', userData.contact_no || '');
      formData.append('email', userData.email);
      formData.append('birth_date', userData.birth_date || '1990-01-01'); // Default if not provided
      formData.append('gender', userData.gender || 'prefer_not_to_say'); // Default if not provided
      formData.append('store_name', ''); // Store name will be set after approval
      formData.append('role', 'vendor');
      formData.append('valid_id', form.valid_id);
      formData.append('business_permit', form.business_permit);
      formData.append('proof_image', form.proof_image);

      const res = await axios.post(`${apiBase}/api/vendor/register-existing-user`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        // Store vendor data for pending page
        sessionStorage.setItem('pendingVendor', JSON.stringify({
          vendor_id: res.data.vendor.vendor_id,
          user_id: res.data.user.user_id,
          store_name: res.data.vendor.store_name,
          email: res.data.user.email,
          fname: res.data.user.fname,
          lname: res.data.user.lname
        }));
        
        // Update user session with vendor role
        const updatedUser = {
          ...userData,
          role: 'vendor'
        };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch user change event to update navbar
        window.dispatchEvent(new Event('userChanged'));
        
        // Show success message and redirect to pending page
        setStatus({
          type: 'success',
          message: 'Vendor application submitted successfully! Redirecting to pending page...'
        });
        
        // Redirect to vendor pending page after a short delay
        setTimeout(() => {
          navigate('/vendor-pending');
        }, 2000);
      } else {
        throw new Error(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Registration failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center px-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-sm w-full">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base text-center">Loading your information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavWithLogo />
      
      <main className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 px-4 sm:px-6 mt-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Become a Vendor</h1>
            <p className="text-sm sm:text-base text-gray-600 px-2">Complete your vendor application using your existing account details</p>
            {userData && (
              <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg mx-2 sm:mx-0">
                <p className="text-base sm:text-lg font-medium text-blue-900">
                  Welcome, {userData.firstName || userData.fname} {userData.lastName || userData.lname}!
                </p>
                <p className="text-xs sm:text-sm text-blue-700">
                  We'll use your existing account information to streamline your vendor application.
                </p>
              </div>
            )}
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Your Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <p className="text-gray-900 break-words">{userData.firstName || userData.fname} {userData.lastName || userData.lname}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="text-gray-900 break-all">{userData.email || 'Not provided'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Username:</span>
                <p className="text-gray-900 break-words">{userData.username}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Contact:</span>
                <p className="text-gray-900">{userData.contact_no || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Vendor Application Form */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Vendor Application Details</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Store Information - Store name will be set after approval */}

              {/* File Uploads */}
              <div className="space-y-4">
                <h4 className="text-sm sm:text-base font-medium text-gray-900">Required Documents</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid ID *
                  </label>
                  <input
                    type="file"
                    name="valid_id"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload a clear photo of your valid ID</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Permit *
                  </label>
                  <input
                    type="file"
                    name="business_permit"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload your business permit or registration</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ice Cream Product Photo *
                  </label>
                  <input
                    type="file"
                    name="proof_image"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload a photo of your ice cream product</p>
                </div>
              </div>

              {/* Status Message */}
              {status.message && (
                <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                  status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {status.message}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
                <Link
                  to="/customer"
                  className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center text-sm sm:text-base"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Information Box */}
          <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">What happens next?</h4>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• Your application will be reviewed by our admin team</li>
              <li>• You'll receive an email notification once approved</li>
              <li>• After approval, you can complete your store setup</li>
              <li>• You can start adding products and receiving orders</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
};

export default BecomeVendor;
