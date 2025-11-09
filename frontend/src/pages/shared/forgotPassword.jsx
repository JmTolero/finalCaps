import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav.jsx';
import axios from 'axios';
import { handleValidatedChange, validateFormData, trimFormData } from '../../utils/inputValidation';

export const ForgotPassword = () => {
    const [form, setForm] = useState({ email: '' });
    const [status, setStatus] = useState({ type: null, message: '' });
    const [loading, setLoading] = useState(false);

    // Auto-hide success messages after 5 seconds
    useEffect(() => {
        if (status.type === 'success') {
            const timer = setTimeout(() => {
                setStatus({ type: null, message: '' });
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [status.type]);

    const handleChange = (e) => {
        handleValidatedChange(e, setForm, ['email']);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: null, message: "" });
        setLoading(true);

        // Validate form data
        const validation = validateFormData(form, ['email']);
        if (!validation.isValid) {
            setStatus({ type: 'error', message: validation.message });
            setLoading(false);
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setStatus({ type: 'error', message: 'Please enter a valid email address.' });
            setLoading(false);
            return;
        }

        try {
            const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
            const trimmedForm = trimFormData(form);

            const res = await axios.post(`${apiBase}/api/auth/forgot-password`, trimmedForm);
            const data = res.data;

            if (data.message) {
                setStatus({ type: 'success', message: data.message });
                // Clear form after successful submission
                setForm({ email: '' });
            } else {
                throw new Error(data?.error || "Failed to send reset email");
            }

        } catch (error) {
            console.error('Forgot password error:', error);
            const errorMessage = error.response?.data?.error || error.message || "An error occurred. Please try again.";
            setStatus({ type: 'error', message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <NavWithLogo />
            <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center py-4 px-4 sm:py-8 mt-16">
                <div className="w-full max-w-md mx-auto">
                    <div 
                        className="rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full text-black"
                        style={{backgroundColor: "#D4F6FF"}}
                    >
                        {/* Header Section */}
                        <div className="text-center py-6 px-4 sm:py-8 sm:px-6 border-b border-sky-200">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                                🔑 Forgot Password
                            </h1>
                            <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2">
                                Enter your email address and we'll send you a link to reset your password
                            </p>
                        </div>

                        {/* Status Message */}
                        {status.type && (
                            <div className={`text-center mx-4 sm:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                                status.type === 'success' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                                <div className="font-semibold text-xs sm:text-sm md:text-base">{status.message}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-6 sm:pb-8">
                            <div className="space-y-4 sm:space-y-6">
                                {/* Email Input */}
                                <div>
                                    <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email address"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base text-gray-700 placeholder-gray-400"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                                            <span className="text-xs sm:text-sm md:text-base">Sending Reset Link...</span>
                                        </div>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>

                                {/* Back to Login Link */}
                                <div className="text-center">
                                    <Link 
                                        to="/login" 
                                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 text-xs sm:text-sm md:text-base"
                                    >
                                        ← Back to Login
                                    </Link>
                                </div>
                            </div>
                        </form>

                        {/* Help Section */}
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                                <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Need Help?</h3>
                                <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                                    If you don't receive an email within a few minutes, check your spam folder. 
                                    The reset link will expire in 1 hour for security reasons.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
