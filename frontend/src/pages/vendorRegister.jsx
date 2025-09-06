import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavWithLogo } from '../components/nav.jsx';
import axios from 'axios';

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
    store_name: '',
    address: '',
    valid_id: null,
    business_permit: null,
    ice_cream_photo: null
  });
  const [status, setStatus] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    const { id, files } = e.target;
    setForm(prev => ({ ...prev, [id]: files[0] }));
  };

  const validateForm = () => {
    console.log('Form data:', form); // Debug log
    if (!form.fname || !form.username || !form.password || 
        !form.contact_no || !form.email || !form.store_name || !form.address) {
      setStatus({ type: 'error', message: 'Please fill in all required fields' });
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return false;
    }

    if (form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long' });
      return false;
    }

    if (!form.valid_id || !form.business_permit || !form.ice_cream_photo) {
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
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('fname', form.fname);
      formData.append('lname', form.lname);
      formData.append('username', form.username);
      formData.append('password', form.password);
      formData.append('contact_no', form.contact_no);
      formData.append('email', form.email);
      formData.append('store_name', form.store_name);
      formData.append('address', form.address);
      formData.append('role', 'vendor');
      formData.append('valid_id', form.valid_id);
      formData.append('business_permit', form.business_permit);
      formData.append('ice_cream_photo', form.ice_cream_photo);

      const res = await axios.post(`${apiBase}/register-vendor`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setStatus({
          type: 'success',
          message: 'Registration successful! Your account is pending approval.'
        });
        
        // Redirect to login after successful registration
        setTimeout(() => {
          navigate('/login');
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
      setLoading(false);
    }
  };

  return (
    <>
      <NavWithLogo />
      <main className="flex items-center justify-center min-h-[80vh] px-4 py-8">
        <div 
          className="rounded-xl shadow-lg px-8 py-8 w-full max-w-2xl text-black"
          style={{backgroundColor: "#D4F6FF"}}
        >
          <h2 className="text-4xl font-bold text-center mb-8">Vendor Registration</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="fname">
                Fullname
              </label>
              <input
                id="fname"
                type="text"
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                required
                value={form.fname}
                onChange={handleChange}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                required
                value={form.username}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                required
                value={form.password}
                onChange={handleChange}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                required
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="contact_no">
                Contact No
              </label>
              <input
                id="contact_no"
                type="tel"
                placeholder="Enter contact number"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                required
                value={form.contact_no}
                onChange={handleChange}
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email address"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                required
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="store_name">
                Store Name
              </label>
              <input
                id="store_name"
                type="text"
                placeholder="Enter your store name"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                required
                value={form.store_name}
                onChange={handleChange}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="address">
                Store Address
              </label>
              <textarea
                id="address"
                placeholder="Enter your store address"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                rows="3"
                required
                value={form.address}
                onChange={handleChange}
              />
            </div>

            {/* Upload Valid ID */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="valid_id">
                Upload valid ID
              </label>
              <input
                id="valid_id"
                type="file"
                accept="image/*,.pdf"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                
                onChange={handleFileChange}
              />
            </div>

            {/* Upload Business Permit */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="business_permit">
                Upload Business Permit
              </label>
              <input
                id="business_permit"
                type="file"
                accept="image/*,.pdf"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                
                onChange={handleFileChange}
              />
            </div>

            {/* Upload Ice Cream Photo */}
            <div>
              <label className="block text-xl font-semibold mb-2" htmlFor="ice_cream_photo">
                Please upload a Photo of your Ice cream Drums (for proof that you making Ice cream)
              </label>
              <input
                id="ice_cream_photo"
                type="file"
                accept="image/*"
                className="w-full px-4 py-3 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                onChange={handleFileChange}
              />
            </div>

            {/* Status Message */}
            {status.type && (
              <div className={`text-center py-3 rounded-lg ${
                status.type === 'success' 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {status.message}
              </div>
            )}

            {/* Register Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFDDAE] hover:bg-[#FFDDAE]/80 text-gray-700 font-bold py-4 rounded-lg shadow-md text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <Link to="/login" className="text-indigo-800 font-bold hover:underline transition">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default VendorRegister;
  
