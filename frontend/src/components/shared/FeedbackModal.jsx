import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * FeedbackModal Component
 * Reusable modal for submitting feedback (used by customers and vendors)
 */
export const FeedbackModal = ({ isOpen, onClose, userRole = 'customer' }) => {
  console.log('🎯 FeedbackModal: Component called with isOpen:', isOpen, 'userRole:', userRole);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'question',
    description: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  // Auto-scroll to error and auto-hide after 3 seconds
  useEffect(() => {
    if (error && errorRef.current) {
      // Scroll to error message with offset for sticky header
      setTimeout(() => {
        if (errorRef.current) {
          const element = errorRef.current;
          const modalContainer = element.closest('[class*="overflow-y-auto"]');
          
          if (modalContainer) {
            // Get the sticky header height (approximately 80-100px)
            const stickyHeaderHeight = 100;
            const elementTop = element.offsetTop;
            
            // Scroll within modal container with offset
            modalContainer.scrollTo({
              top: elementTop - stickyHeaderHeight - 20, // Extra 20px padding
              behavior: 'smooth'
            });
          } else {
            // Fallback: use scrollIntoView with more offset
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }
      }, 100);
      
      // Clear any existing timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      // Auto-hide error after 3 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError('');
      }, 3000);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);

  const categories = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'question', label: 'Question' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      setError('');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPG, PNG, GIF, or WEBP)');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      
      setSelectedImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('feedback-image');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const token = sessionStorage.getItem('token');

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('subject', formData.subject.trim());
      submitData.append('category', formData.category);
      submitData.append('description', formData.description.trim());
      if (selectedImage) {
        submitData.append('image', selectedImage);
      }

      const response = await axios.post(
        `${apiBase}/api/feedback`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setShowSuccess(true);
        // Reset form
        setFormData({
          subject: '',
          category: 'question',
          description: ''
        });
        setSelectedImage(null);
        setImagePreview(null);
        const fileInput = document.getElementById('feedback-image');
        if (fileInput) fileInput.value = '';
        
        // Auto close after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(
        error.response?.data?.error || 
        'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        subject: '',
        category: 'question',
        description: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      setError('');
      setShowSuccess(false);
      const fileInput = document.getElementById('feedback-image');
      if (fileInput) fileInput.value = '';
      onClose();
    }
  };

  if (!isOpen) {
    console.log('🎯 FeedbackModal: Not rendering because isOpen is false');
    return null;
  }

  console.log('🎯 FeedbackModal: Rendering modal');
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          maxWidth: '42rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 100000
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {userRole === 'vendor' ? 'Contact Support' : 'Submit Feedback'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {userRole === 'vendor' 
                ? "Need help? Let us know what you need assistance with."
                : "We'd love to hear from you! Share your thoughts or report issues."}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 flex-shrink-0 ml-2"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium text-sm sm:text-base">
                {userRole === 'vendor' 
                  ? 'Support request submitted successfully! We\'ll get back to you soon.'
                  : 'Thank you for your feedback! We\'ll review it shortly.'}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div 
            ref={errorRef}
            className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`p-2 sm:p-3 border-2 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm ${
                    formData.category === cat.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief summary of your feedback"
              maxLength={255}
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.subject.length}/255 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please provide details..."
              rows={5}
              maxLength={2000}
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none text-sm sm:text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/2000 characters (minimum 10)
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="feedback-image" className="block text-sm font-medium text-gray-700 mb-2">
              Screenshot/Image (Optional)
            </label>
            <div className="space-y-2">
              <input
                type="file"
                id="feedback-image"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF, WEBP (max 10MB)
              </p>
              {imagePreview && (
                <div className="relative inline-block mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-48 rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs sm:text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Your feedback will be reviewed by our team</li>
                  <li>We'll respond within 24-48 hours</li>
                  <li>You can check the status in your account settings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.subject.trim() || !formData.description.trim()}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit {userRole === 'vendor' ? 'Request' : 'Feedback'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;

