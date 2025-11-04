import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImage from '../../assets/images/LOGO.png';
import FeedbackModal from '../../components/shared/FeedbackModal';

const ContactSupport = () => {
  const navigate = useNavigate();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userRole = user?.role || 'customer';

  const handleGoBack = () => {
    if (user) {
      const role = (user?.role || 'customer').toLowerCase();
      if (role === 'admin') navigate('/admin');
      else if (role === 'vendor') navigate('/vendor-pending');
      else navigate('/customer');
    } else {
      navigate('/');
    }
  };

  return (
    <>
      {/* Navbar */}
      <header className="w-full bg-sky-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link to="/">
            <img
              src={logoImage}
              alt="ChillNet Logo"
              className="ChillNet-Logo h-8 sm:h-10 rounded-full object-cover"
            />
          </Link>
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-gray-900 text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 px-2">
              Contact Support
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              We're here to help! Get in touch with our support team for assistance with your account, questions, or any issues you may be experiencing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Contact Information Card */}
            <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Get in Touch</h2>
              
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Email */}
                <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                  <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">Email</h3>
                    <a 
                      href="mailto:chillneticecream@gmail.com" 
                      className="text-xs sm:text-sm lg:text-base text-blue-600 hover:text-blue-800 break-all"
                    >
                      chillneticecream@gmail.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                  <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">Phone</h3>
                    <a 
                      href="tel:+639124850622" 
                      className="text-xs sm:text-sm lg:text-base text-green-600 hover:text-green-800 break-words"
                    >
                      +63 912 485 0622
                    </a>
                  </div>
                </div>

                {/* Response Time */}
                <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                  <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">Response Time</h3>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                      We typically respond within 24-48 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Feedback Card */}
            <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Submit a Request</h2>
              
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                  Have a question, issue, or feedback? Submit a support request and our team will get back to you as soon as possible.
                </p>

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-xs sm:text-sm lg:text-base"
                >
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-center">Submit Feedback/Support Request</span>
                  </div>
                </button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-0.5 sm:mb-1">Need immediate assistance?</h4>
                      <p className="text-xs sm:text-sm text-blue-700 break-words">
                        For urgent matters, please call us directly at +63 912 485 0622 or email us at chillneticecream@gmail.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-4 sm:mt-8 lg:mt-12 bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">How do I submit feedback or report an issue?</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                  Click the "Submit Feedback/Support Request" button above to open our feedback form. Select the appropriate category and provide as much detail as possible.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">What information should I include in my support request?</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                  Please include your account details (email), a clear description of the issue or question, and any relevant screenshots or error messages if applicable.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">How long does it take to get a response?</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                  We aim to respond to all support requests within 24-48 hours during business days. For urgent matters, please call us directly.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Can I track my support request?</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                  Yes! After submitting a request, you'll receive a confirmation and can track your request status through your account notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          userRole={userRole}
        />
      )}
    </>
  );
};

export default ContactSupport;

