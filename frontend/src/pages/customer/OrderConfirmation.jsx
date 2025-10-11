import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav';

export const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Get order details from location state or session storage
    if (location.state?.orderDetails) {
      setOrderDetails(location.state.orderDetails);
    } else {
      // Fallback: get from session storage if available
      const savedOrder = sessionStorage.getItem('lastOrder');
      if (savedOrder) {
        setOrderDetails(JSON.parse(savedOrder));
      }
    }
  }, [location.state]);

  const handleGoHome = () => {
    navigate('/customer');
  };

  const handleViewOrders = () => {
    navigate('/customer?view=orders');
  };

  return (
    <>
      <NavWithLogo />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-2xl mx-auto px-6">
          {/* Confirmation Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Main Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You for Your Order!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Your order has been successfully placed and is waiting for vendor approval.
            </p>

            {/* Order Details */}
            {orderDetails && (
              <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
                
                {orderDetails.vendorName && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Vendor: </span>
                    <span className="text-blue-600">{orderDetails.vendorName}</span>
                  </div>
                )}
                
                {orderDetails.totalAmount && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Total Amount: </span>
                    <span className="text-green-600 font-semibold">₱{orderDetails.totalAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {orderDetails.deliveryAddress && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Delivery Address: </span>
                    <span className="text-gray-600">{orderDetails.deliveryAddress}</span>
                  </div>
                )}
                
                {orderDetails.deliveryDateTime && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Delivery Date & Time: </span>
                    <span className="text-gray-600">{orderDetails.deliveryDateTime}</span>
                  </div>
                )}
              </div>
            )}

            {/* Status Information */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-orange-800">What's Next?</h3>
              </div>
              
              <div className="text-sm text-orange-700 space-y-2">
                <p>• Your order is being reviewed by the vendor</p>
                <p>• You will receive a notification once the vendor responds</p>
                <p>• Payment will be required after order approval</p>
                <p>• You can track your order status in "My Orders"</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleGoHome}
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-6 rounded-lg border-2 border-blue-200 transition-colors duration-200 shadow-md"
              >
                Browse Flavors
              </button>
              
              <button
                onClick={handleViewOrders}
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-6 rounded-lg border-2 border-blue-200 transition-colors duration-200 shadow-md"
              >
                My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmation;
