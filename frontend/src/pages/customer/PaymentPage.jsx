import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        alert('Please log in to view payment details');
        navigate('/login');
        return;
      }

      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/orders/customer/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const orderData = response.data.orders.find(o => o.order_id == orderId);
        if (orderData) {
          setOrder(orderData);
        } else {
          alert('Order not found');
          navigate('/customer');
        }
      } else {
        alert('Error loading order details');
        navigate('/customer');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Error loading order details');
      navigate('/customer');
    } finally {
      setLoading(false);
    }
  }, [navigate, orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      await axios.put(`${apiBase}/api/orders/${orderId}/payment-status`, 
        { payment_status: 'paid' },
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );

      navigate('/customer?view=orders');
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/customer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Order not found</p>
          <button 
            onClick={() => navigate('/customer')}
            className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Confirmation</h1>
            <p className="text-gray-600">Please review your order details before proceeding with payment</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">#{order.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vendor:</span>
              <span className="font-medium">{order.vendor_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-green-600">₱{parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Type:</span>
              <span className="font-medium">{order.payment_type === 'downpayment' ? '50% Down Payment' : 'Full Payment'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-orange-600">{order.status}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="text-gray-600 text-sm mb-1">Delivery Address:</div>
              <div className="text-sm font-medium">{order.delivery_address}</div>
            </div>
            <div className="pt-3 border-t">
              <div className="text-gray-600 text-sm mb-1">Delivery Date & Time:</div>
              <div className="text-sm font-medium">{new Date(order.delivery_datetime).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            GCash Payment Instructions
          </h3>
          <div className="text-blue-700 space-y-2">
            <p>1. Open your GCash app</p>
            <p>2. Go to "Send Money" or "Pay Bills"</p>
            <p>3. Enter the amount: <strong>₱{parseFloat(order.total_amount).toFixed(2)}</strong></p>
            <p>4. Complete the payment process</p>
            <p>5. Click "Confirm Payment" below</p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium">Important Notice</p>
              <ul className="text-yellow-700 mt-2 space-y-1">
                <li>• This will charge your GCash account</li>
                <li>• The vendor will be notified to start preparing your order</li>
                <li>• You cannot cancel after payment is processed</li>
                <li>• Payment confirmation will be sent to your email</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-4">
            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Payment
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={processing}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 py-4 px-6 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/customer')}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

    </div>
  );
};

export default PaymentPage;
