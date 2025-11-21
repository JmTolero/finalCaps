import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const IntegratedGCashPayment = ({
  orderId,
  amount,
  customerInfo,
  items = [],
  isPartialPayment = false,
  isRemainingPayment = false,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}) => {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [pollingInterval, setPollingInterval] = useState(null);

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobile);
      console.log('📱 Device type:', mobile ? 'Mobile' : 'Desktop');
    };
    checkMobile();
  }, []);

  const initializePayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const paymentAmount = parseFloat(amount);
      
      console.log('💳 Initializing integrated GCash payment...', {
        orderId,
        requestedAmount: amount,
        parsedAmount: paymentAmount,
        isPartialPayment,
        isRemainingPayment,
        customerInfo
      });

      const response = await axios.post(
        `${apiBase}/api/payment/create-integrated-gcash-payment`,
        {
          order_id: orderId,
          amount: paymentAmount,
          customer_name: customerInfo?.name || 'Customer',
          customer_email: customerInfo?.email || 'customer@example.com',
          customer_phone: customerInfo?.phone || '+639123456789',
          items: items,
          commission_rate: 3.0 // 3% platform commission
        }
      );

      if (response.data.success) {
        const invoiceData = response.data.invoice;
        setPaymentData(invoiceData);
        
        console.log('✅ Payment initialized:', {
          invoice_id: invoiceData.id,
          amount: invoiceData.amount,
          mobile_url: invoiceData.mobile_url
        });

        // Auto-redirect for mobile users
        if (isMobile && invoiceData.mobile_url) {
          console.log('📱 Mobile device detected, redirecting to payment...');
          setTimeout(() => {
            window.location.href = invoiceData.mobile_url;
          }, 1000);
        } else {
          setShowQR(true);
        }
      } else {
        throw new Error(response.data.error || 'Failed to initialize payment');
      }

    } catch (err) {
      console.error('❌ Payment initialization error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initialize payment';
      setError(errorMessage);
      
      if (onPaymentError) {
        onPaymentError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, amount, isMobile, isPartialPayment, isRemainingPayment, items, customerInfo, onPaymentError]);

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentData?.id) return;

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(
        `${apiBase}/api/payment/status/${paymentData.id}`
      );

      if (response.data.success) {
        const status = response.data.invoice.status;
        
        if (status === 'PAID' || status === 'SETTLED') {
          console.log('✅ Payment successful!');
          setPaymentStatus('success');
          
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
          
          if (onPaymentSuccess) {
            onPaymentSuccess(response.data.invoice);
          }
        } else if (status === 'EXPIRED') {
          console.log('⏰ Payment expired');
          setPaymentStatus('expired');
          setError('Payment link has expired. Please try again.');
          
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
        }
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
    }
  }, [paymentData, pollingInterval, onPaymentSuccess]);

  // Initialize payment
  useEffect(() => {
    if (orderId && amount) {
      initializePayment();
    }
  }, [orderId, amount, initializePayment]);

  // Poll for payment status
  useEffect(() => {
    if (paymentData && paymentStatus === 'pending') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000); // Check every 5 seconds
      
      setPollingInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [paymentData, paymentStatus, checkPaymentStatus]);

  const handleOpenGCash = () => {
    if (paymentData?.mobile_url) {
      window.location.href = paymentData.mobile_url;
    }
  };

  const handleCancel = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    if (onCancel) {
      onCancel();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-center">Initializing GCash payment...</p>
        <p className="text-sm text-gray-500 text-center mt-2">Please wait</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Error</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-500 text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h3>
        <p className="text-green-700 mb-4">Your payment has been confirmed.</p>
        <p className="text-sm text-gray-600">Redirecting to order confirmation...</p>
      </div>
    );
  }

  if (isMobile && paymentData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📱</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Pay with GCash</h3>
          <p className="text-gray-600 text-sm">Click the button below to open GCash app</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Amount to Pay:</span>
            <span className="text-2xl font-bold text-blue-600">₱{parseFloat(amount).toFixed(2)}</span>
          </div>
          {paymentData.payment_details && (
            <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
              <div className="flex justify-between">
                <span>Vendor receives:</span>
                <span>₱{paymentData.payment_details.vendor_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee ({paymentData.payment_details.commission_rate}%):</span>
                <span>₱{paymentData.payment_details.platform_commission.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleOpenGCash}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg mb-3 flex items-center justify-center transition-colors"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Open GCash App
        </button>

        <button
          onClick={() => setShowQR(true)}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg mb-3 transition-colors text-sm"
        >
          Show QR Code Instead
        </button>

        <button
          onClick={handleCancel}
          className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 text-sm"
        >
          Cancel Payment
        </button>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-blue-800 text-center">
            💡 After completing payment in GCash, you will be automatically redirected back here.
          </p>
        </div>
      </div>
    );
  }

  if (showQR && paymentData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📱</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Scan to Pay with GCash</h3>
          <p className="text-gray-600 text-sm">Open your GCash app and scan the QR code</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex justify-center mb-4">
            {paymentData.qr_code_url ? (
              <img
                src={paymentData.qr_code_url}
                alt="GCash QR Code"
                className="w-64 h-64 border-2 border-gray-200 rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">QR Code</p>
                  <a
                    href={paymentData.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Click here to view payment page
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 mb-2">₱{parseFloat(amount).toFixed(2)}</p>
            <p className="text-xs text-gray-500">Amount to pay</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2 text-sm">📱 How to pay:</h4>
          <ol className="text-xs text-blue-800 space-y-1">
            <li>1. Open your GCash app</li>
            <li>2. Tap "Scan QR"</li>
            <li>3. Scan the QR code above</li>
            <li>4. Confirm payment of ₱{parseFloat(amount).toFixed(2)}</li>
            <li>5. Your order will be automatically confirmed</li>
          </ol>
        </div>

        {isMobile && (
          <button
            onClick={handleOpenGCash}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mb-3 transition-colors"
          >
            Open GCash App Instead
          </button>
        )}

        <button
          onClick={handleCancel}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg mb-3 transition-colors"
        >
          Cancel Payment
        </button>

        {/* TEST BUTTON - Only show in development (automatically hidden in production/Vercel) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={async () => {
              try {
                console.log('🧪 Testing payment completion for order:', orderId, {
                  isRemainingPayment,
                  isPartialPayment,
                  amount
                });
                const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
                const response = await fetch(`${apiBase}/api/test-payment/complete-payment/${orderId}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    isRemainingPayment,
                    isPartialPayment,
                    amount
                  })
                });
                const data = await response.json();
                console.log('🧪 Test payment response:', data);
                
                if (data.success) {
                  console.log('✅ Payment marked as completed!', {
                    payment_status: data.order.new_payment_status,
                    is_partial: data.order.is_partial
                  });
                  setPaymentStatus('success');
                  
                  // Clear polling interval
                  if (pollingInterval) {
                    clearInterval(pollingInterval);
                  }
                  
                  if (onPaymentSuccess) {
                    onPaymentSuccess({ 
                      id: 'test_payment', 
                      status: 'PAID',
                      order_id: orderId 
                    });
                  }
                } else {
                  console.error('❌ Test payment failed:', data.error);
                  alert(`Test payment failed: ${data.error}`);
                }
              } catch (error) {
                console.error('❌ Test payment error:', error);
                alert(`Test payment error: ${error.message}`);
              }
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm"
          >
            🧪 TEST: Complete Payment (Dev Only)
          </button>
        )}

        <div className="mt-6 text-center">
          <div className="inline-flex items-center text-sm text-gray-600">
            <div className="animate-pulse mr-2">⏱</div>
            Waiting for payment confirmation...
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default IntegratedGCashPayment;

