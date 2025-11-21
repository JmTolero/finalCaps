import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';

const RemainingBalancePayment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/orders/${orderId}`);
      
      if (response.data.success) {
        const orderData = response.data.order;
        
        // Verify this order has remaining balance
        if (orderData.payment_status !== 'partial' || !orderData.payment_amount) {
          setError('This order does not have a remaining balance to pay.');
          return;
        }
        
        setOrder(orderData);
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

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
  };

  const handleConfirm = () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    if (selectedMethod === 'gcash') {
      // Navigate to integrated GCash payment for remaining balance
      navigate(`/customer/integrated-gcash-payment/${orderId}?remaining=true`);
    } else if (selectedMethod === 'cod') {
      // Select COD for remaining balance
      handleSelectCOD();
    }
  };

  const handleSelectCOD = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      await axios.post(`${apiBase}/api/orders/${orderId}/select-remaining-payment-method`, {
        payment_method: 'cod'
      });

      // Show success message and redirect
      alert('✅ Cash on Delivery selected for remaining balance. You will pay when your order arrives.');
      navigate('/customer?view=orders');
    } catch (err) {
      console.error('Error selecting COD:', err);
      alert(err.response?.data?.error || 'Failed to select payment method');
    }
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

  if (!order) return null;

  const totalAmount = parseFloat(order.total_amount || 0);
  const paidAmount = parseFloat(order.payment_amount || 0);
  const remainingBalance = totalAmount - paidAmount;

  return (
    <>
      <NavWithLogo />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Orders</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pay Remaining Balance</h1>
            <p className="text-gray-600">Order #{order.order_id}</p>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">₱{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid (50%):</span>
                <span className="text-green-600 font-semibold">₱{paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span>Remaining Balance:</span>
                <span className="text-orange-600">₱{remainingBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Payment Method</h2>
            <p className="text-gray-600 mb-6">Choose how you'd like to pay the remaining balance of ₱{remainingBalance.toFixed(2)}</p>

            <div className="space-y-4">
              {/* GCash Option */}
              <div
                onClick={() => handleSelectMethod('gcash')}
                className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                  selectedMethod === 'gcash'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    selectedMethod === 'gcash'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'gcash' && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-3xl">📱</span>
                      <h3 className="text-lg font-bold text-gray-900">Pay via GCash</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pay instantly using integrated GCash payment. Opens your GCash app automatically.
                    </p>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">You'll pay:</span>
                        <span className="text-lg font-bold text-green-600">₱{remainingBalance.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">3% platform fee included</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* COD Option */}
              <div
                onClick={() => handleSelectMethod('cod')}
                className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                  selectedMethod === 'cod'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    selectedMethod === 'cod'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'cod' && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-3xl">💵</span>
                      <h3 className="text-lg font-bold text-gray-900">Cash on Delivery (COD)</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pay with cash when your order arrives. No online payment needed.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">You'll pay:</span>
                        <span className="text-lg font-bold text-blue-600">₱{remainingBalance.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">No platform fee</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedMethod}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RemainingBalancePayment;

