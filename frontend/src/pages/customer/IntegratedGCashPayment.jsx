import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';
import IntegratedGCashPayment from '../../components/payment/IntegratedGCashPayment';

const IntegratedGCashPaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if this is a remaining balance payment
  const isRemainingPayment = location.search.includes('remaining=true');
  
  // Calculate payment amount
  const getPaymentAmount = useCallback(() => {
    if (!order) return 0;
    
    if (isRemainingPayment) {
      // Pay remaining balance
      const totalAmount = parseFloat(order.total_amount || 0);
      const paidAmount = parseFloat(order.payment_amount || 0);
      return totalAmount - paidAmount;
    } else {
      // Check if order allows partial payment (50%)
      const totalAmount = parseFloat(order.total_amount || 0);
      const existingPaymentAmount = parseFloat(order.payment_amount || 0);
      
      // Check if this is a planned 50% payment
      const isPlanned50Percent = existingPaymentAmount > 0 && 
                                  totalAmount > 0 &&
                                  Math.abs(existingPaymentAmount - totalAmount * 0.5) < (totalAmount * 0.01);
      
      // For new unpaid orders, check if 50% payment was selected
      if (order.payment_status === 'unpaid' || !order.payment_status) {
        // PRIORITY 1: If initial_payment_method is 'GCash', this is a 50% payment order
        if (order.initial_payment_method === 'GCash') {
          // Use payment_amount if set, otherwise calculate 50%
          if (existingPaymentAmount > 0) {
            console.log('✅ 50% payment order - Using order payment_amount:', existingPaymentAmount);
            return existingPaymentAmount;
          } else {
            const calculated50Percent = totalAmount * 0.5;
            console.log('✅ 50% payment order - Calculating 50%:', calculated50Percent);
            return calculated50Percent;
          }
        }
        
        // PRIORITY 2: If payment_amount is set and it's approximately 50%, use it
        if (isPlanned50Percent) {
          console.log('✅ Using planned 50% payment amount:', existingPaymentAmount);
          return existingPaymentAmount;
        }
        
        // PRIORITY 3: If payment_amount is set (but not 50%), use it
        if (existingPaymentAmount > 0) {
          console.log('⚠️ Using existing payment_amount (not 50%):', existingPaymentAmount);
          return existingPaymentAmount;
        }
        
        // PRIORITY 4: No payment_amount set and no 50% indicator - use FULL payment
        console.log('✅ No 50% indicator - Using FULL payment:', totalAmount);
        return totalAmount;
      } else {
        // Full payment for paid/partial orders
        console.log('✅ Full payment (order already paid/partial):', totalAmount);
        return totalAmount;
      }
    }
  }, [order, isRemainingPayment]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/orders/${orderId}`);
      
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.response?.data?.error || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Debug: Log order details
  useEffect(() => {
    if (order) {
      const calculatedAmount = getPaymentAmount();
      const totalAmount = parseFloat(order.total_amount || 0);
      const existingPaymentAmount = parseFloat(order.payment_amount || 0);
      const is50Percent = Math.abs(calculatedAmount - totalAmount * 0.5) < totalAmount * 0.01;
      
      console.log('📦 Order details:', {
        order_id: order.order_id,
        payment_status: order.payment_status,
        payment_amount: order.payment_amount,
        total_amount: order.total_amount,
        existingPaymentAmount,
        isRemainingPayment,
        calculatedAmount,
        is50Percent,
        shouldPay50Percent: is50Percent ? 'YES - 50%' : `NO - Full (${calculatedAmount})`
      });
      
      // Warn if 50% was selected but full amount is being charged
      if (!isRemainingPayment && 
          (order.payment_status === 'unpaid' || !order.payment_status) &&
          !is50Percent && 
          calculatedAmount === totalAmount) {
        console.warn('⚠️ WARNING: Order should be 50% payment but calculating full amount!', {
          totalAmount,
          calculatedAmount,
          existingPaymentAmount
        });
      }
    }
  }, [order, isRemainingPayment, getPaymentAmount]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  const handlePaymentSuccess = (invoice) => {
    console.log('✅ Payment successful:', invoice);
    
    // Redirect to success page
    setTimeout(() => {
      navigate(`/customer/payment/success/${orderId}`);
    }, 2000);
  };

  const handlePaymentError = (error) => {
    console.error('❌ Payment error:', error);
    setError(error.message || 'Payment failed');
  };

  const handleCancel = () => {
    navigate('/customer?view=orders');
  };

  if (loading) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-700">Loading order details...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error && !order) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => navigate('/customer?view=orders')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Back to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Get customer info from session or order
  const customerInfo = {
    name: order?.customer_fname || 'Customer',
    email: order?.customer_email || 'customer@example.com',
    phone: order?.customer_contact || '+639123456789'
  };

  // Prepare items for payment
  const items = order?.items || [];

  return (
    <>
      <NavWithLogo />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/customer?view=orders')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Orders</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">GCash Payment</h1>
            <p className="text-gray-600">Secure payment powered by Xendit</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              
              {order && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">#{order.order_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vendor:</span>
                    <span className="font-medium">{order.vendor_name || order.store_name}</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>₱{parseFloat(order.subtotal || order.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span>{parseFloat(order.delivery_fee || 0) === 0 ? 'FREE' : `₱${parseFloat(order.delivery_fee).toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-blue-600">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                    
                    {/* Show payment breakdown for partial payments */}
                    {order.payment_status === 'partial' && order.payment_amount && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="text-green-600 font-semibold">₱{parseFloat(order.payment_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Remaining Balance:</span>
                          <span className="text-orange-600 font-semibold">₱{(parseFloat(order.total_amount) - parseFloat(order.payment_amount)).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Show payment amount for this transaction */}
                    {isRemainingPayment && (
                      <div className="mt-3 pt-3 border-t bg-blue-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Amount to Pay Now:</span>
                          <span className="text-lg font-bold text-blue-600">₱{getPaymentAmount().toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Remaining balance payment</p>
                      </div>
                    )}
                    
                    {/* Show 50% downpayment option - for new unpaid orders with 50% selected */}
                    {!isRemainingPayment && 
                     (order.payment_status === 'unpaid' || !order.payment_status) && 
                     (order.initial_payment_method === 'GCash' || 
                      (() => {
                        const totalAmount = parseFloat(order.total_amount || 0);
                        const paymentAmount = getPaymentAmount();
                        // Check if payment amount is approximately 50% of total (within 1% tolerance)
                        return totalAmount > 0 && Math.abs(paymentAmount - totalAmount * 0.5) < totalAmount * 0.01;
                      })()) && (
                      <div className="mt-3 pt-3 border-t bg-yellow-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">50% Downpayment:</span>
                          <span className="text-lg font-bold text-yellow-600">₱{getPaymentAmount().toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-600">Remaining balance (₱{(parseFloat(order.total_amount) - getPaymentAmount()).toFixed(2)}) will be collected on delivery</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm">✨ Integrated Payment</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Secure payment via Xendit</li>
                      <li>• Automatic payment verification</li>
                      <li>• Instant order confirmation</li>
                      <li>• No screenshot uploads needed</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Component */}
            <div>
              {order && (
                <IntegratedGCashPayment
                  orderId={order.order_id}
                  amount={getPaymentAmount()}
                  customerInfo={customerInfo}
                  items={items}
                  isPartialPayment={(() => {
                    if (isRemainingPayment) return false;
                    if (order.payment_status !== 'unpaid' && order.payment_status) return false;
                    const totalAmount = parseFloat(order.total_amount || 0);
                    const paymentAmount = getPaymentAmount();
                    // Check if payment amount is approximately 50% of total
                    return totalAmount > 0 && Math.abs(paymentAmount - totalAmount * 0.5) < totalAmount * 0.01;
                  })()}
                  isRemainingPayment={isRemainingPayment}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  onCancel={handleCancel}
                />
              )}
            </div>
          </div>

          {/* Information Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Why choose integrated GCash payment?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🔒</div>
                <div>
                  <h4 className="font-medium text-gray-900">Secure & Safe</h4>
                  <p className="text-sm text-gray-600">Payment processed through Xendit's secure platform</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <h4 className="font-medium text-gray-900">Instant Confirmation</h4>
                  <p className="text-sm text-gray-600">Order confirmed automatically after payment</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">📱</div>
                <div>
                  <h4 className="font-medium text-gray-900">Mobile Optimized</h4>
                  <p className="text-sm text-gray-600">Opens GCash app directly on mobile devices</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h4 className="font-medium text-gray-900">No Manual Verification</h4>
                  <p className="text-sm text-gray-600">No need to upload payment screenshots</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IntegratedGCashPaymentPage;

