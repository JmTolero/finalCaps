import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav';

const CustomerGCashAccount = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isRemainingPayment = new URLSearchParams(location.search).get('remaining') === 'true';
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

  const fetchOrderAndQR = useCallback(async () => {
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
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderAndQR();
    }
  }, [orderId, fetchOrderAndQR]);

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

      // Use different endpoint for remaining balance payment
      if (isRemainingPayment) {
        // Pay remaining balance
        await axios.post(`${apiBase}/api/orders/${orderId}/pay-remaining-balance-gcash`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Regular payment
        await axios.put(`${apiBase}/api/orders/${orderId}/payment`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
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

  const handleDownloadQRCode = async () => {
    if (!vendorQR?.qr_code_image) return;
    
    try {
      // Fetch the image
      const response = await fetch(vendorQR.qr_code_image);
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `GCash-QR-Code-${orderId || 'payment'}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      // Fallback: try direct download
      const link = document.createElement('a');
      link.href = vendorQR.qr_code_image;
      link.download = `GCash-QR-Code-${orderId || 'payment'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Helper function to get the amount to pay
  const getAmountToPay = () => {
    if (!order) return 0;
    
    // If paying remaining balance
    if (isRemainingPayment && order.remaining_balance > 0) {
      return parseFloat(order.remaining_balance);
    }
    
    // If partial payment (50% option), use payment_amount
    // Check if payment_amount is less than total_amount (indicates 50% payment)
    if (order.payment_amount && parseFloat(order.payment_amount) < parseFloat(order.total_amount)) {
      return parseFloat(order.payment_amount);
    }
    
    // Otherwise use total amount (full payment)
    return parseFloat(order.total_amount);
  };

  if (loading) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 mt-16">
          <div className="max-w-2xl mx-auto px-3 sm:px-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-700 text-sm sm:text-base">Loading payment information...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 mt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 md:p-8">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-8 w-8 sm:h-9 sm:w-9 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                
                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Payment Error</h2>
                
                {/* Error Message */}
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed break-words px-2">
                  {error}
                </p>
                
                {/* My Orders Button */}
                <button
                  onClick={() => navigate('/customer?view=orders')}
                  className="w-full sm:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 text-base shadow-sm"
                >
                  My Orders
                </button>
              </div>
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
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 mt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 md:p-8">
              <div className="text-center">
                {/* Warning Icon */}
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-orange-100 mb-4">
                  <svg className="h-8 w-8 sm:h-9 sm:w-9 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Invalid Order</h2>
                
                {/* Error Message */}
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                  No order ID provided
                </p>
                
                {/* My Orders Button */}
                <button
                  onClick={() => navigate('/customer?view=orders')}
                  className="w-full sm:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 text-base shadow-sm"
                >
                  My Orders
                </button>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 mt-16">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                onClick={() => navigate('/customer?view=orders')}
                className="flex items-center space-x-1 sm:space-x-2 text-blue-600 hover:text-blue-700 transition-colors text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span className="font-medium">My Orders</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">GCash QR Payment</h1>
            <p className="text-sm sm:text-base text-gray-600">Pay directly to vendor using GCash QR code</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Order Summary</h2>
              
              {order && (
                <div className="space-y-4">
                  {/* Payment Type Badge */}
                  <div className="mb-4">
                    {isRemainingPayment && order.remaining_balance > 0 ? (
                      <div className="inline-flex items-center bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">Remaining Balance Payment</span>
                      </div>
                    ) : (order.payment_amount && parseFloat(order.payment_amount) < parseFloat(order.total_amount)) ? (
                      <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">Initial Payment (50%)</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1.5 rounded-full">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">Full Payment</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">#{order.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor:</span>
                    <span className="font-medium">{order.business_name || order.vendor_name}</span>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    {/* Subtotal and Delivery Fee Breakdown */}
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal (Items):</span>
                        <span className="font-medium">₱{parseFloat(order.subtotal || (order.total_amount - (order.delivery_fee || 0))).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <span className={`font-medium ${parseFloat(order.delivery_fee || 0) === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {parseFloat(order.delivery_fee || 0) === 0 ? 'FREE' : `₱${parseFloat(order.delivery_fee).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-semibold">
                        <span className="text-gray-700">Order Total:</span>
                        <span className="text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Amount Section */}
                    {isRemainingPayment && order.remaining_balance > 0 ? (
                      <>
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-gray-600">Already Paid (Initial):</span>
                          <span className="font-medium text-green-600">-₱{parseFloat(order.payment_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-800 font-semibold">Remaining Balance to Pay:</span>
                            <span className="font-bold text-orange-600 text-xl">₱{parseFloat(order.remaining_balance).toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Pay before or on delivery</p>
                        </div>
                      </>
                    ) : (order.payment_amount && parseFloat(order.payment_amount) < parseFloat(order.total_amount)) ? (
                      <>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-800 font-semibold">Initial Payment (50%):</span>
                            <span className="font-bold text-blue-600 text-xl">₱{parseFloat(order.payment_amount).toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-600">Pay now to confirm order</p>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mt-3 bg-gray-50 p-2 rounded">
                          <span>Balance Due on Delivery:</span>
                          <span className="font-semibold">₱{parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-800 font-semibold">Total Amount to Pay:</span>
                          <span className="font-bold text-green-600 text-xl">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Full payment - pay in full now</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* QR Payment Section */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">GCash QR Payment</h2>
              
              {vendorQR ? (
                <div className="space-y-6">
                  {/* QR Code Display */}
                  <div className="text-center">
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-6 mb-3 sm:mb-4">
                      <img 
                        src={vendorQR.qr_code_image} 
                        alt="GCash QR Code" 
                        className="w-48 h-48 sm:w-64 sm:h-64 mx-auto border-2 border-gray-200 rounded-lg"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Scan this QR code with your GCash app</p>
                    
                    {/* Payment Amount with Type Indicator */}
                    {isRemainingPayment && order.remaining_balance > 0 ? (
                      <div className="mb-3 sm:mb-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                          <p className="text-xs text-orange-800 font-medium mb-1">REMAINING BALANCE</p>
                          <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                            ₱{getAmountToPay().toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Already paid ₱{parseFloat(order.payment_amount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : (order.payment_amount && parseFloat(order.payment_amount) < parseFloat(order.total_amount)) ? (
                      <div className="mb-3 sm:mb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                          <p className="text-xs text-blue-800 font-medium mb-1">INITIAL PAYMENT (50%)</p>
                          <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                            ₱{getAmountToPay().toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            ₱{parseFloat(order.remaining_balance || (order.total_amount - order.payment_amount)).toFixed(2)} due on delivery
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 sm:mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                          <p className="text-xs text-green-800 font-medium mb-1">FULL PAYMENT</p>
                          <p className="text-2xl sm:text-3xl font-bold text-green-600">
                            ₱{getAmountToPay().toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Complete order payment
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* View Full Image and Download Buttons */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                      >
                        View Full Image
                      </button>
                      <button
                        onClick={handleDownloadQRCode}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
                        title="Download QR Code"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">📱 How to Pay:</h4>
                    <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
                      <li>1. Open your GCash app</li>
                      <li>2. Tap "Scan QR"</li>
                      <li>3. Scan the QR code above</li>
                      <li>4. Enter the exact amount: ₱{getAmountToPay().toFixed(2)}</li>
                      <li>5. Complete the payment</li>
                      <li>6. Take a screenshot of payment confirmation</li>
                    </ol>
                  </div>

                  {/* Payment Confirmation */}
                  {paymentStatus === 'pending' && (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Upload Payment Confirmation Screenshot
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isPaymentConfirmed}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Additional Notes (Optional)
                        </label>
                        <textarea
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          placeholder="Any additional information about your payment..."
                          disabled={isPaymentConfirmed}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm"
                          rows="3"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate('/customer?view=orders')}
                          disabled={submitting || isPaymentConfirmed}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                        >
                          Pay Later
                        </button>
                        <button
                          onClick={handlePaymentConfirmation}
                          disabled={submitting || !paymentImage || isPaymentConfirmed}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                        >
                          {submitting ? 'Confirming Payment...' : isPaymentConfirmed ? 'Payment Already Confirmed' : 'Confirm Payment'}
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentStatus === 'completed' && (
                    <div className="text-center bg-green-50 rounded-lg p-4 sm:p-6">
                      <div className="text-green-500 text-3xl sm:text-4xl mb-3 sm:mb-4">✅</div>
                      <h3 className="text-base sm:text-lg font-bold text-green-800 mb-2">Payment Confirmed!</h3>
                      <p className="text-sm sm:text-base text-green-700">Your payment has been confirmed. Redirecting...</p>
                    </div>
                  )}

                  {isPaymentConfirmed && paymentStatus !== 'completed' && (
                    <div className="text-center bg-blue-50 rounded-lg p-4 sm:p-6">
                      <div className="text-blue-500 text-3xl sm:text-4xl mb-3 sm:mb-4">💰</div>
                      <h3 className="text-base sm:text-lg font-bold text-blue-800 mb-2">Payment Already Confirmed</h3>
                      <p className="text-sm sm:text-base text-blue-700 mb-3 sm:mb-4">This order has already been paid and cannot be modified.</p>
                      <button
                        onClick={() => navigate(`/customer/payment/success/${orderId}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
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
                    <span className="font-medium">Amount to Pay:</span> ₱{getAmountToPay().toFixed(2)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Confirm Payment Submission</h3>
              <button
                onClick={handleCancelConfirm}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {/* Warning Icon */}
                <div className="flex items-center justify-center">
                  <div className="bg-yellow-100 rounded-full p-2 sm:p-3">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                
                {/* Warning Message */}
                <div className="text-center">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Please Verify Your Payment Screenshot</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Before submitting, please double-check that your payment screenshot shows:
                  </p>
                </div>
                
                {/* Checklist */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 break-words">Correct GCash number: {vendorQR?.gcash_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700">Correct amount: ₱{getAmountToPay().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700">Clear and readable screenshot</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700">Transaction shows as successful</span>
                  </div>
                </div>
                
                {/* Final Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Important:</strong> Once submitted, you cannot modify your payment confirmation. 
                    Make sure your screenshot is correct before proceeding.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4 border-t">
              <button
                onClick={handleCancelConfirm}
                className="w-full sm:flex-1 px-3 sm:px-4 py-2 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="w-full sm:flex-1 px-3 sm:px-4 py-2 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium"
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