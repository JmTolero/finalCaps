import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError('Order ID not provided');
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/orders/${orderId}`);
      
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    try {
      setDownloading(true);
      
      // Create canvas for receipt generation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size (600x800 for A4-like receipt)
      canvas.width = 600;
      canvas.height = 800;
      
      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set font styles
      const titleFont = 'bold 24px Arial';
      const headerFont = 'bold 18px Arial';
      const normalFont = '14px Arial';
      const smallFont = '12px Arial';
      
      let yPosition = 40;
      
      // Header
      ctx.font = titleFont;
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      ctx.fillText('ChillNet', canvas.width / 2, yPosition);
      
      yPosition += 30;
      ctx.font = smallFont;
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Ice Cream Delivery Service', canvas.width / 2, yPosition);
      
      yPosition += 40;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(50, yPosition, canvas.width - 100, 2);
      
      yPosition += 30;
      ctx.font = headerFont;
      ctx.fillStyle = '#1f2937';
      ctx.fillText('Payment Receipt', canvas.width / 2, yPosition);
      
      yPosition += 40;
      
      // Order details
      ctx.font = normalFont;
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'left';
      
      const orderDetails = [
        `Order ID: #${order.order_id}`,
        `Vendor ID: #${order.vendor_id}`,
        `Date: ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`
      ];
      
      orderDetails.forEach(detail => {
        ctx.fillText(detail, 50, yPosition);
        yPosition += 25;
      });
      
      yPosition += 20;
      
      // Payment details
      const paymentDetails = [
        'Payment Status: Paid',
        'Payment Method: GCash QR'
      ];
      
      paymentDetails.forEach(detail => {
        ctx.fillText(detail, 50, yPosition);
        yPosition += 25;
      });
      
      yPosition += 30;
      
      // Delivery information
      ctx.font = headerFont;
      ctx.fillText('Delivery Information', 50, yPosition);
      yPosition += 30;
      
      ctx.font = normalFont;
      const deliveryInfo = [
        `Scheduled Delivery: ${order.delivery_datetime ? new Date(order.delivery_datetime).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'TBD'}`,
        `Address: ${order.delivery_address || 'Not specified'}`
      ];
      
      deliveryInfo.forEach(info => {
        // Handle long text wrapping
        const words = info.split(' ');
        let line = '';
        const maxWidth = canvas.width - 100;
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, 50, yPosition);
            line = word + ' ';
            yPosition += 20;
          } else {
            line = testLine;
          }
        });
        
        if (line) {
          ctx.fillText(line, 50, yPosition);
          yPosition += 25;
        }
      });
      
      yPosition += 20;
      
      // Order items
      if (order.items && order.items.length > 0) {
        ctx.font = headerFont;
        ctx.fillText('Order Items', 50, yPosition);
        yPosition += 30;
        
        ctx.font = normalFont;
        order.items.forEach(item => {
          const flavorName = item.flavor_description || item.flavor_name || 'Ice Cream Flavor';
          const size = item.drum_size ? ` - ${item.drum_size}` : '';
          const quantity = ` x${item.quantity}`;
          const price = `₱${parseFloat(item.price || 0).toFixed(2)}`;
          
          ctx.fillText(`${flavorName}${size}${quantity}`, 50, yPosition);
          ctx.textAlign = 'right';
          ctx.fillText(price, canvas.width - 50, yPosition);
          ctx.textAlign = 'left';
          yPosition += 25;
        });
      }
      
      yPosition += 30;
      
      // Total
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(50, yPosition, canvas.width - 100, 2);
      yPosition += 30;
      
      ctx.font = headerFont;
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      ctx.fillText(`Total Amount: ₱${parseFloat(order.total_amount || 0).toFixed(2)}`, canvas.width / 2, yPosition);
      
      yPosition += 40;
      
      // Footer
      ctx.font = smallFont;
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Thank you for choosing ChillNet!', canvas.width / 2, yPosition);
      yPosition += 20;
      ctx.fillText('Your order is being prepared.', canvas.width / 2, yPosition);
      
      // Convert canvas to PNG and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-order-${orderId}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
      
    } catch (err) {
      console.error('Error generating receipt:', err);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-300">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/customer')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-300 py-8">
      <div className="max-w-4xl mx-auto px-4">
          {/* Success Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Your payment has been confirmed and your order is being processed.</p>
          </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Order Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Order Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b pb-2">Order Details</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="font-medium text-gray-600">Order ID:</span>
                  <span className="font-bold text-gray-900">#{order.order_id}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="font-medium text-gray-600">Vendor ID:</span>
                  <span className="font-bold text-gray-900">#{order.vendor_id}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="font-medium text-gray-600">Total Amount:</span>
                  <span className="font-bold text-green-600 text-base sm:text-lg">₱{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="font-medium text-gray-600">Payment Status:</span>
                  <span className="font-bold text-green-600 bg-green-100 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'Paid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b pb-2">Delivery Details</h3>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <span className="font-medium text-gray-600 block text-sm sm:text-base">Scheduled Delivery:</span>
                  <span className="font-bold text-gray-900 text-sm sm:text-base">
                    {order.delivery_datetime ? new Date(order.delivery_datetime).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 block text-sm sm:text-base">Delivery Address:</span>
                  <span className="font-bold text-gray-900 break-words text-sm sm:text-base">{order.delivery_address || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flavor Details */}
          {order.items && order.items.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b pb-2 mb-3 sm:mb-4">Order Items</h3>
              <div className="space-y-2 sm:space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {item.flavor_description || item.flavor_name || 'Ice Cream Flavor'}
                          </h4>
                        {item.drum_size && (
                          <p className="text-xs sm:text-sm text-gray-600">Size: {item.drum_size}</p>
                        )}
                        <p className="text-xs sm:text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-sm sm:text-base">₱{parseFloat(item.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center">
            <button
              onClick={downloadReceipt}
              disabled={downloading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Download Receipt</span>
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/customer')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;
