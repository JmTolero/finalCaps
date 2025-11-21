import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';

const CustomerPayment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [vendorHasGCash, setVendorHasGCash] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(true);
  
  // Check if this is a remaining balance payment
  const isRemainingPayment = new URLSearchParams(location.search).get('remaining') === 'true';

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        throw new Error('User not logged in');
      }

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/orders/${orderId}`);
      
      if (response.data.success) {
        const orderData = response.data.order;
        
        // Verify this order belongs to the current user
        if (orderData.customer_id !== user.id) {
          throw new Error('Unauthorized access to order');
        }
        
        // Check if order is eligible for payment
        if (orderData.payment_status === 'paid') {
          setError('This order has already been paid');
          return;
        }
        
        setOrder(orderData);
        
        // Check if vendor has GCash set up for integrated payment
        try {
          setCheckingVendor(true);
          const vendorResponse = await axios.get(`${apiBase}/api/vendor/${orderData.vendor_id}/qr-code`);
          if (vendorResponse.data.success) {
            setVendorHasGCash(true);
          }
        } catch (vendorErr) {
          console.log('Vendor does not have GCash set up for integrated payment');
          setVendorHasGCash(false);
        } finally {
          setCheckingVendor(false);
        }
        
      } else {
        throw new Error(response.data.error || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavWithLogo />
        <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading payment information...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavWithLogo />
        <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 md:p-8">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-8 w-8 sm:h-9 sm:w-9 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Payment Error</h2>
                
                {/* Error Message */}
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed break-words px-2">
                  {error}
                </p>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/customer')}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 text-sm sm:text-base shadow-sm"
                  >
                    Back to Orders
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 text-sm sm:text-base shadow-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <NavWithLogo />
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/customer?view=orders')}
              className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Orders</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isRemainingPayment ? 'Pay Remaining Balance' : 'Complete Payment'}
            </h1>
            <p className="text-gray-700">
              {isRemainingPayment 
                ? `Complete payment for remaining balance - Order #${orderId}`
                : `Pay for Order #${orderId} with integrated GCash payment`
              }
            </p>
          </div>

          {/* Order Summary Card */}
          {order && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">#{order.order_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium">{order.vendor_name || order.store_name}</span>
                </div>
                  <div className="border-t pt-3">
                  {isRemainingPayment && order.remaining_balance ? (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Total Order:</span>
                        <span>₱{parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Already Paid:</span>
                        <span className="text-green-600">-₱{parseFloat(order.payment_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-orange-600 pt-2 border-t">
                        <span>Remaining Balance:</span>
                        <span>₱{parseFloat(order.remaining_balance).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Options */}
          {checkingVendor ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment options...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Integrated GCash Payment */}
              {vendorHasGCash ? (
                <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-500 relative">
                  {/* Available Badge */}
                  <div className="absolute -top-3 left-6">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                      ✨ AVAILABLE
                    </span>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">📱</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Instant GCash Payment
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Fast, secure, and automatic verification
                      </p>
                      
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2 text-sm">✨ Benefits:</h4>
                        <ul className="space-y-1 text-sm text-blue-800">
                          <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Opens GCash app automatically on mobile
                          </li>
                          <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Instant order confirmation (no waiting)
                          </li>
                          <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            No screenshot upload needed
                          </li>
                          <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                            Secure payment via Xendit
                          </li>
                        </ul>
              </div>

                      <button
                        onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}${isRemainingPayment ? '?remaining=true' : ''}`)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center space-x-2"
                      >
                        <span className="text-2xl">📱</span>
                        <span>Pay with GCash (Instant)</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
              </div>
            </div>
          </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Not Available</h3>
                  <p className="text-gray-600 mb-4">
                    This vendor has not set up integrated GCash payment yet.
                  </p>
                  <p className="text-sm text-gray-500">
                    Please contact the vendor to complete your payment, or try again later.
                  </p>
                  <button
                    onClick={() => navigate('/customer?view=orders')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Back to Orders
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPayment;