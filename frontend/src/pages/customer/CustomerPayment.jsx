import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';
import GCashPayment from '../../components/payment/GCashPayment';
import paymongoService from '../../services/paymongoService';

const CustomerPayment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
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
        if (orderData.status !== 'confirmed' || orderData.payment_status === 'paid') {
          throw new Error('Order is not eligible for payment');
        }
        
        setOrder(orderData);
      } else {
        throw new Error(response.data.error || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      console.log('✅ Payment successful:', paymentResult);
      setIsProcessingPayment(false);
      setPaymentError(null);
      
      // Update order payment status
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      await axios.put(`${apiBase}/api/orders/${orderId}/payment`, {
        payment_status: 'paid',
        payment_method: 'gcash',
        payment_intent_id: paymentResult.payment_intent_id,
        payment_reference: paymentResult.id
      });
      
      // Update order status to preparing
      await axios.put(`${apiBase}/api/orders/${orderId}/status`, {
        status: 'preparing'
      });
      
      console.log('✅ Order payment status updated');
      
      // Show receipt
      setShowReceipt(true);
      
    } catch (error) {
      console.error('Error processing payment success:', error);
      setPaymentError('Payment successful but failed to update order. Please contact support.');
    }
  };

  const handlePaymentError = (error) => {
    console.error('❌ Payment failed:', error);
    setIsProcessingPayment(false);
    setPaymentError(error.message || 'Payment failed. Please try again.');
  };

  const handlePaymentCancel = () => {
    console.log('🚫 Payment cancelled by user');
    setIsProcessingPayment(false);
    setPaymentError(null);
  };

  const generateReceipt = () => {
    if (!order) return null;

    const receiptData = {
      orderId: order.order_id,
      customerName: `${order.customer_fname} ${order.customer_lname}`,
      vendorName: order.vendor_name,
      orderDate: new Date(order.created_at).toLocaleDateString(),
      deliveryDate: order.delivery_datetime ? new Date(order.delivery_datetime).toLocaleDateString() : 'TBD',
      deliveryTime: order.delivery_datetime ? new Date(order.delivery_datetime).toLocaleTimeString() : 'TBD',
      deliveryAddress: order.delivery_address,
      flavors: order.flavors || [],
      totalAmount: order.total_amount,
      deliveryFee: order.delivery_fee || 0,
      paymentMethod: 'GCash',
      paymentStatus: 'Paid',
      paymentDate: new Date().toLocaleDateString(),
      paymentTime: new Date().toLocaleTimeString()
    };

    return receiptData;
  };

  const downloadReceipt = () => {
    const receipt = generateReceipt();
    if (!receipt) return;

    // Create receipt HTML
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${receipt.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍦 Ice Cream Delivery Receipt</h1>
          <h2>Order #${receipt.orderId}</h2>
        </div>
        
        <div class="section">
          <h3>Order Details</h3>
          <div class="item"><span>Order Date:</span><span>${receipt.orderDate}</span></div>
          <div class="item"><span>Delivery Date:</span><span>${receipt.deliveryDate}</span></div>
          <div class="item"><span>Delivery Time:</span><span>${receipt.deliveryTime}</span></div>
          <div class="item"><span>Customer:</span><span>${receipt.customerName}</span></div>
          <div class="item"><span>Vendor:</span><span>${receipt.vendorName}</span></div>
        </div>
        
        <div class="section">
          <h3>Delivery Address</h3>
          <p>${receipt.deliveryAddress}</p>
        </div>
        
        <div class="section">
          <h3>Ice Cream Flavors</h3>
          ${receipt.flavors.map(flavor => `
            <div class="item">
              <span>${flavor.flavor_name} (${flavor.size})</span>
              <span>₱${flavor.price.toFixed(2)} x ${flavor.quantity}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h3>Payment Summary</h3>
          <div class="item"><span>Subtotal:</span><span>₱${(parseFloat(receipt.totalAmount) - parseFloat(receipt.deliveryFee)).toFixed(2)}</span></div>
          <div class="item"><span>Delivery Fee:</span><span>₱${parseFloat(receipt.deliveryFee).toFixed(2)}</span></div>
          <div class="item total"><span>Total Amount:</span><span>₱${parseFloat(receipt.totalAmount).toFixed(2)}</span></div>
        </div>
        
        <div class="section">
          <h3>Payment Information</h3>
          <div class="item"><span>Payment Method:</span><span>${receipt.paymentMethod}</span></div>
          <div class="item"><span>Payment Status:</span><span>${receipt.paymentStatus}</span></div>
          <div class="item"><span>Payment Date:</span><span>${receipt.paymentDate}</span></div>
          <div class="item"><span>Payment Time:</span><span>${receipt.paymentTime}</span></div>
        </div>
        
        <div class="footer">
          <p>Thank you for your order! 🍦</p>
          <p>Your ice cream will be prepared and delivered as scheduled.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.orderId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavWithLogo />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading order details...</p>
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
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-medium text-red-800">Error</h3>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => navigate('/customer')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavWithLogo />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Order Not Found</h3>
              <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
              <button
                onClick={() => navigate('/customer')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavWithLogo />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment for Order #{order.order_id}</h1>
                <p className="text-gray-600 mt-1">Complete your payment to start ice cream production</p>
              </div>
              <button
                onClick={() => navigate('/customer')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Order Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">#{order.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendor:</span>
                      <span className="font-medium">{order.vendor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Date:</span>
                      <span className="font-medium">
                        {order.delivery_datetime ? new Date(order.delivery_datetime).toLocaleDateString() : 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Delivery Address</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{order.delivery_address}</p>
                  </div>
                </div>

                {/* Ice Cream Flavors */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ice Cream Flavors</h3>
                  <div className="space-y-2">
                    {order.flavors && order.flavors.map((flavor, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{flavor.flavor_name}</p>
                            <p className="text-sm text-gray-600">Size: {flavor.size}</p>
                            <p className="text-sm text-gray-600">Quantity: {flavor.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">₱{flavor.price.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">each</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Summary */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₱{(parseFloat(order.total_amount || 0) - parseFloat(order.delivery_fee || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className="font-medium">₱{parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total Amount:</span>
                        <span className="font-bold text-lg text-blue-600">₱{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment</h2>
              
              {/* Payment Error Display */}
              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-700 text-sm">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* GCash Payment Component */}
              <GCashPayment
                orderData={{
                  order_id: order.order_id,
                  customer_id: order.customer_id,
                  vendor_id: order.vendor_id,
                  items: order.items || []
                }}
                totalAmount={parseFloat(order.total_amount || 0)}
                deliveryFee={parseFloat(order.delivery_fee || 0)}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h2>
                <p className="text-gray-600">Your order is now being prepared</p>
              </div>

              {/* Receipt Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Receipt Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">#{order.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">₱{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">GCash</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Next Steps</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Your ice cream is now being prepared</p>
                  <p>• You'll receive updates on your order status</p>
                  <p>• Delivery will be made as scheduled</p>
                  <p>• Keep this receipt for your records</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={downloadReceipt}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  📄 Download Receipt
                </button>
                <button
                  onClick={() => navigate('/customer')}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayment;
