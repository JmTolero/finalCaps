import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav.jsx';
import axios from 'axios';
import { handleValidatedChange, validateFormData } from '../../utils/inputValidation';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({ 
        newPassword: '', 
        confirmPassword: '' 
    });
    const [status, setStatus] = useState({ type: null, message: '' });
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(null);
    const [verifyingToken, setVerifyingToken] = useState(true);

    const token = searchParams.get('token');

    // Verify token on component mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus({ type: 'error', message: 'Invalid reset link. Please request a new password reset.' });
                setTokenValid(false);
                setVerifyingToken(false);
                return;
            }

            try {
                const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
                const res = await axios.get(`${apiBase}/api/auth/verify-reset-token/${token}`);
                
                if (res.data.valid) {
                    setTokenValid(true);
                } else {
                    setStatus({ type: 'error', message: 'Invalid or expired reset token. Please request a new password reset.' });
                    setTokenValid(false);
                }
            } catch (error) {
                console.error('Token verification error:', error);
                setStatus({ type: 'error', message: 'Invalid or expired reset token. Please request a new password reset.' });
                setTokenValid(false);
            } finally {
                setVerifyingToken(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleChange = (e) => {
        handleValidatedChange(e, setForm, ['newPassword', 'confirmPassword']);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: null, message: "" });
        setLoading(true);

        // Validate form data
        const validation = validateFormData(form, ['newPassword', 'confirmPassword']);
        if (!validation.isValid) {
            setStatus({ type: 'error', message: validation.message });
            setLoading(false);
            return;
        }

        // Validate password strength
        if (form.newPassword.length < 6) {
            setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
            setLoading(false);
            return;
        }

        // Check if passwords match
        if (form.newPassword !== form.confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match.' });
            setLoading(false);
            return;
        }

        try {
            const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
            const requestData = {
                token: token,
                newPassword: form.newPassword
            };

            const res = await axios.post(`${apiBase}/api/auth/reset-password`, requestData);
            const data = res.data;

            if (data.message) {
                setStatus({ type: 'success', message: data.message });
                // Clear form after successful reset
                setForm({ newPassword: '', confirmPassword: '' });
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                throw new Error(data?.error || "Failed to reset password");
            }

        } catch (error) {
            console.error('Reset password error:', error);
            const errorMessage = error.response?.data?.error || error.message || "An error occurred. Please try again.";
            setStatus({ type: 'error', message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while verifying token
    if (verifyingToken) {
        return (
            <>
                <NavWithLogo />
                <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center py-8 mt-16">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-blue-700">Verifying reset link...</p>
                    </div>
                </div>
            </>
        );
    }

    // Show error if token is invalid
    if (!tokenValid) {
        return (
            <>
                <NavWithLogo />
            <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center py-4 px-4 sm:py-8 mt-16">
                <div className="w-full max-w-md mx-auto">
                    <div 
                        className="rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full text-black p-6 sm:p-8"
                        style={{backgroundColor: "#D4F6FF"}}
                    >
                            <div className="text-center">
                                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">❌</div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                                    Invalid Reset Link
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
                                    {status.message || 'This password reset link is invalid or has expired.'}
                                </p>
                                <Link 
                                    to="/forgot-password"
                                    className="inline-block bg-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:bg-blue-700 transition-all duration-200 shadow-lg"
                                >
                                    Request New Reset Link
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

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
                                🔐 Reset Password
                            </h1>
                            <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2">
                                Enter your new password below
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
                                {status.type === 'success' && (
                                    <div className="text-xs mt-2">Redirecting to login page...</div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-6 sm:pb-8">
                            <div className="space-y-4 sm:space-y-6">
                                {/* New Password Input */}
                                <div>
                                    <label htmlFor="newPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={form.newPassword}
                                        onChange={handleChange}
                                        placeholder="Enter your new password"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base text-gray-700 placeholder-gray-400"
                                        required
                                        disabled={loading}
                                        minLength={6}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                                </div>

                                {/* Confirm Password Input */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your new password"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base text-gray-700 placeholder-gray-400"
                                        required
                                        disabled={loading}
                                        minLength={6}
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
                                            <span className="text-xs sm:text-sm md:text-base">Resetting Password...</span>
                                        </div>
                                    ) : (
                                        'Reset Password'
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

                        {/* Security Notice */}
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200">
                                <h3 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Security Notice</h3>
                                <p className="text-xs sm:text-sm text-yellow-700 leading-relaxed">
                                    Choose a strong password that you haven't used before. 
                                    This reset link can only be used once.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
