import React, { useState, useEffect } from 'react';
import xenditService from '../../services/xenditService';

const GCashPayment = ({ 
  orderData, 
  totalAmount, 
  deliveryFee, 
  onPaymentSuccess, 
  onPaymentError,
  onCancel 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize payment when component mounts
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Initializing GCash payment...', {
        order_id: orderData.order_id,
        amount: totalAmount,
        items: orderData.items
      });

      const paymentData = {
        amount: totalAmount,
        currency: 'PHP',
        description: `Ice Cream Delivery - Order #${orderData.order_id}`,
        order_id: orderData.order_id,
        customer_id: orderData.customer_id,
        vendor_id: orderData.vendor_id,
        delivery_fee: deliveryFee,
        items: orderData.items,
        items_count: orderData.items.length.toString(),
        items_summary: orderData.items.map(item => 
          `${item.flavor_name || item.name || 'Ice Cream'} x${item.quantity || 1}`
        ).join(', '),
        customer_name: orderData.customer_name || 'Customer',
        customer_email: orderData.customer_email || 'customer@example.com',
        customer_phone: orderData.customer_phone || '+639123456789'
      };

      console.log('📤 Sending payment data:', paymentData);

      const result = await xenditService.createInvoice(paymentData);
      
      if (result.success) {
        setInvoice(result.invoice);
        console.log('✅ Invoice created:', result.invoice.id);
      } else {
        throw new Error(result.error || 'Failed to create invoice');
      }

    } catch (error) {
      console.error('❌ Payment initialization failed:', error);
      setError(error.message || 'Failed to initialize payment');
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!invoice) {
        throw new Error('Invoice not initialized');
      }

      console.log('🔄 Processing payment via Xendit...', invoice.id);

      // Process payment using Xendit
      const result = await xenditService.processPayment(invoice);

      if (result.success) {
        console.log('✅ Payment successful:', result);
        if (onPaymentSuccess) {
          onPaymentSuccess(result);
        }
      } else {
        throw new Error(result.error || 'Payment was not successful');
      }

    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      setError(error.message || 'Payment processing failed');
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const formatAmount = (amount) => {
    return `₱${parseFloat(amount).toFixed(2)}`;
  };

  if (isLoading && !invoice) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing GCash payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Payment Error</h3>
          </div>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex space-x-3">
          <button
            onClick={initializePayment}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Try Again
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* GCash Header */}
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold text-lg">G</span>
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">GCash Payment</h3>
          <p className="text-sm text-gray-600">Pay securely with GCash via Xendit</p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Order Total:</span>
            <span className="font-medium">{formatAmount(totalAmount - deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-medium">{formatAmount(deliveryFee)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-lg font-semibold text-gray-900">{formatAmount(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Info */}
      {invoice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              Invoice ID: {invoice.id}
            </p>
          </div>
          {invoice.expiry_date && (
            <p className="text-xs text-blue-600 mt-1">
              Expires: {new Date(invoice.expiry_date).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Payment Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-yellow-800 mb-2">🍦 How to pay with GCash:</h4>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Click "Pay with GCash" button below</li>
          <li>You'll be redirected to Xendit payment page</li>
          <li>Choose GCash as your payment method</li>
          <li>Complete the payment using your GCash account</li>
          <li>Your ice cream will start being prepared immediately</li>
          <li>You'll receive a receipt and order confirmation</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handlePayment}
          disabled={isLoading || !invoice}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            'Pay with GCash'
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          🔒 Your payment is secured by Xendit and GCash
        </p>
      </div>
    </div>
  );
};

export default GCashPayment;