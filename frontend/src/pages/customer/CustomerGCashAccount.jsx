import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav';

const CustomerGCashAccount = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [vendorQR, setVendorQR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentImage, setPaymentImage] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderAndQR();
    }
  }, [orderId]);

  const fetchOrderAndQR = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      console.log('🔍 Fetching order details for order ID:', orderId);
      
      // Fetch order details
      const orderResponse = await axios.get(`${apiBase}/api/orders/${orderId}`);
      console.log('📦 Order response:', orderResponse.data);
      
      if (orderResponse.data.success) {
        setOrder(orderResponse.data.order);
        
        // Check if payment is already confirmed
        if (orderResponse.data.order.payment_status === 'paid') {
          setIsPaymentConfirmed(true);
          setPaymentStatus('completed');
        }
        
        console.log('🔍 Fetching QR code for vendor ID:', orderResponse.data.order.vendor_id);
        
        // Fetch vendor QR code
        const qrResponse = await axios.get(`${apiBase}/api/vendor/${orderResponse.data.order.vendor_id}/qr-code`);
        console.log('📱 QR response:', qrResponse.data);
        
        if (qrResponse.data.success) {
          setVendorQR(qrResponse.data.qrCode);
        } else {
          setError('Vendor QR code not found. Please contact the vendor.');
        }
      } else {
        setError(orderResponse.data.error || 'Failed to load order details');
      }
    } catch (err) {
      console.error('❌ Error fetching order and QR code:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirmation = () => {
    // Show confirmation dialog first
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      setShowConfirmDialog(false);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const formData = new FormData();
      formData.append('payment_status', 'completed');
      formData.append('payment_method', 'gcash_qr');
      formData.append('customer_notes', customerNotes);
      
      // Convert base64 image to blob and append to FormData
      if (paymentImage) {
        const response = await fetch(paymentImage);
        const blob = await response.blob();
        formData.append('payment_confirmation_image', blob, 'payment-proof.jpg');
      }

      await axios.put(`${apiBase}/api/orders/${orderId}/payment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setPaymentStatus('completed');
      setIsPaymentConfirmed(true);
      
      // Redirect to order confirmation
      setTimeout(() => {
        navigate(`/customer/payment/success/${orderId}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error confirming payment:', err);
      const errorMessage = err.response?.data?.error || 'Failed to confirm payment';
      
      // Check if payment is already confirmed
      if (errorMessage.includes('Payment already confirmed')) {
        setIsPaymentConfirmed(true);
        setPaymentStatus('completed');
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) {
      setShowImageModal(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-700">Loading payment information...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/customer')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Add fallback for unexpected states
  if (!orderId) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Order</h2>
              <p className="text-gray-600 mb-6">No order ID provided</p>
              <button
                onClick={() => navigate('/customer')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavWithLogo />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/customer')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">GCash QR Payment</h1>
            <p className="text-gray-600">Pay directly to vendor using GCash QR code</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
              
              {order && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">#{order.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor:</span>
                    <span className="font-medium">{order.business_name || order.vendor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-green-600 text-xl">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="font-medium">₱{parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* QR Payment Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">GCash QR Payment</h2>
              
              {vendorQR ? (
                <div className="space-y-6">
                  {/* QR Code Display */}
                  <div className="text-center">
                    <div className="bg-gray-50 rounded-lg p-6 mb-4">
                      <img 
                        src={vendorQR.qr_code_image} 
                        alt="GCash QR Code" 
                        className="w-64 h-64 mx-auto border-2 border-gray-200 rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Scan this QR code with your GCash app</p>
                    <p className="text-lg font-bold text-green-600 mb-4">₱{order ? parseFloat(order.total_amount).toFixed(2) : '0.00'}</p>
                    
                    {/* View Full Image Button */}
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      View Full Image
                    </button>
                  </div>

                  {/* Payment Instructions */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📱 How to Pay:</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Open your GCash app</li>
                      <li>2. Tap "Scan QR"</li>
                      <li>3. Scan the QR code above</li>
                      <li>4. Enter the exact amount: ₱{order ? parseFloat(order.total_amount).toFixed(2) : '0.00'}</li>
                      <li>5. Complete the payment</li>
                      <li>6. Take a screenshot of payment confirmation</li>
                    </ol>
                  </div>

                  {/* Payment Confirmation */}
                  {paymentStatus === 'pending' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Payment Confirmation Screenshot
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isPaymentConfirmed}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Notes (Optional)
                        </label>
                        <textarea
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          placeholder="Any additional information about your payment..."
                          disabled={isPaymentConfirmed}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          rows="3"
                        />
                      </div>

                      <button
                        onClick={handlePaymentConfirmation}
                        disabled={submitting || !paymentImage || isPaymentConfirmed}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        {submitting ? 'Confirming Payment...' : isPaymentConfirmed ? 'Payment Already Confirmed' : 'Confirm Payment'}
                      </button>
                    </div>
                  )}

                  {paymentStatus === 'completed' && (
                    <div className="text-center bg-green-50 rounded-lg p-6">
                      <div className="text-green-500 text-4xl mb-4">✅</div>
                      <h3 className="text-lg font-bold text-green-800 mb-2">Payment Confirmed!</h3>
                      <p className="text-green-700">Your payment has been confirmed. Redirecting...</p>
                    </div>
                  )}

                  {isPaymentConfirmed && paymentStatus !== 'completed' && (
                    <div className="text-center bg-blue-50 rounded-lg p-6">
                      <div className="text-blue-500 text-4xl mb-4">💰</div>
                      <h3 className="text-lg font-bold text-blue-800 mb-2">Payment Already Confirmed</h3>
                      <p className="text-blue-700 mb-4">This order has already been paid and cannot be modified.</p>
                      <button
                        onClick={() => navigate(`/customer/payment/success/${orderId}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        View Order Details
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>QR code not available for this vendor</p>
                </div>
              )}
            </div>
          </div>

          {/* Information */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">💡 Direct Payment Benefits:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Pay directly to vendor - no platform fees</li>
                <li>• Vendor receives 100% of payment</li>
                <li>• Faster payment processing</li>
                <li>• Secure GCash to GCash transfer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* View Full Image Modal */}
      {showImageModal && vendorQR && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          onClick={handleModalClose}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-full overflow-y-auto my-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">GCash QR Code</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-3 sm:p-4">
              <div className="text-center">
                <img 
                  src={vendorQR.qr_code_image} 
                  alt="GCash QR Code Full Size" 
                  className="w-full max-w-md sm:max-w-lg mx-auto border border-gray-200 rounded-lg"
                />
                <div className="mt-3 sm:mt-4 space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600 break-all">
                    <span className="font-medium">GCash Number:</span> {vendorQR.gcash_number}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                    <span className="font-medium">Shop Name:</span> {vendorQR.business_name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Amount to Pay:</span> ₱{order ? parseFloat(order.total_amount).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end p-3 sm:p-4 border-t">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Payment Submission</h3>
              <button
                onClick={handleCancelConfirm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4">
              <div className="space-y-4">
                {/* Warning Icon */}
                <div className="flex items-center justify-center">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                
                {/* Warning Message */}
                <div className="text-center">
                  <h4 className="text-base font-semibold text-gray-900 mb-2">Please Verify Your Payment Screenshot</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Before submitting, please double-check that your payment screenshot shows:
                  </p>
                </div>
                
                {/* Checklist */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">Correct GCash number: {vendorQR?.gcash_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">Correct amount: ₱{order ? parseFloat(order.total_amount).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">Clear and readable screenshot</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">Transaction shows as successful</span>
                  </div>
                </div>
                
                {/* Final Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Important:</strong> Once submitted, you cannot modify your payment confirmation. 
                    Make sure your screenshot is correct before proceeding.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 border-t">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Yes, Submit Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerGCashAccount;