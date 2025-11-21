import React, { useState } from 'react';
import axios from 'axios';

const PaymentTest = () => {
  const [orderId, setOrderId] = useState('292');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testCompletePayment = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      console.log('🧪 Testing payment completion for order:', orderId);
      
      const response = await axios.post(`${apiBase}/api/test-payment/complete-payment/${orderId}`);
      
      console.log('✅ Response:', response.data);
      setResult(response.data);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        error: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const checkOrderStatus = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/test-payment/order-status/${orderId}`);
      
      console.log('📊 Order status:', response.data);
      setResult(response.data);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        error: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">🧪 Payment Test Page</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID to Test:
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter order ID (e.g., 292)"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={testCompletePayment}
                disabled={loading || !orderId}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Processing...' : '✅ Mark as Paid'}
              </button>
              
              <button
                onClick={checkOrderStatus}
                disabled={loading || !orderId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Checking...' : '📊 Check Status'}
              </button>
            </div>

            {result && (
              <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`font-medium mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '✅ Success' : '❌ Error'}
                </h3>
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">🔧 How to Use:</h4>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. Enter an order ID (like 292, 293, etc.)</li>
                <li>2. Click "✅ Mark as Paid" to simulate payment completion</li>
                <li>3. Click "📊 Check Status" to verify the order is now paid</li>
                <li>4. Go back to customer orders to see the updated status</li>
              </ol>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">🎯 Expected Result:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• payment_status: "unpaid" → "paid"</li>
                <li>• status: "pending" → "confirmed" (if was pending)</li>
                <li>• payment_method: "gcash_integrated"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;
