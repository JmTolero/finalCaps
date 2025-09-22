import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  // const [deliveryAvailable, setDeliveryAvailable] = useState(true); // Removed unused variable
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'downpayment'
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const receiptRef = useRef(null);

  // Debug receipt state changes
  useEffect(() => {
    console.log('🔍 Receipt state changed:', showReceipt);
  }, [showReceipt]);

  const fetchUserAddress = useCallback(async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        
        // Get all addresses for the user
        const response = await axios.get(`${apiBase}/api/addresses/user/${user.id}/addresses`);
        
        if (response.data && response.data.length > 0) {
          // Get the primary address first, then default, then first address
          const primaryAddress = response.data.find(addr => addr.is_primary) || 
                                response.data.find(addr => addr.is_default) || 
                                response.data[0];
          
          const addressString = [
            primaryAddress.unit_number,
            primaryAddress.street_name,
            primaryAddress.barangay,
            primaryAddress.cityVillage,
            primaryAddress.province,
            primaryAddress.region,
            primaryAddress.postal_code
          ].filter(Boolean).join(', ');
          
          setUserAddress(addressString);
          setDeliveryAddress(addressString);
          
          // Fetch delivery price for this location
          if (orderData?.vendorId && primaryAddress.cityVillage && primaryAddress.province) {
            fetchDeliveryPrice(orderData.vendorId, primaryAddress.cityVillage, primaryAddress.province);
          }
        } else {
          // No addresses found - user needs to add one
          setUserAddress('');
          setDeliveryAddress('');
          console.warn('No addresses found for user. User needs to add an address.');
        }
      }
    } catch (error) {
      console.error('Error fetching user address:', error);
      // Set empty address if fetch fails
      setUserAddress('');
      setDeliveryAddress('');
    }
  }, [orderData]);

  useEffect(() => {
    // Get order data from location state
    if (location.state) {
      setOrderData(location.state);
      // Format delivery date and time
      if (location.state.deliveryDate && location.state.deliveryTime) {
        const date = new Date(location.state.deliveryDate);
        const time = location.state.deliveryTime;
        const formattedDate = date.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
        const formattedTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : '';
        setDeliveryDateTime(`${formattedDate} ${formattedTime}`);
      }
    } else {
      // If no data, redirect back to customer page
      navigate('/customer');
    }
    
    // Fetch user's address
    fetchUserAddress();
  }, [location.state, navigate, fetchUserAddress]);

  const fetchDeliveryPrice = async (vendorId, city, province) => {
    if (!vendorId || !city || !province) {
      return;
    }
    
    setDeliveryLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const url = `${apiBase}/api/vendor/delivery/${vendorId}/price?city=${encodeURIComponent(city)}&province=${encodeURIComponent(province)}`;
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        setDeliveryPrice(response.data.delivery_available ? response.data.delivery_price : 0);
      } else {
        setDeliveryPrice(0);
      }
    } catch (error) {
      console.error('Error fetching delivery price:', error);
      setDeliveryPrice(0);
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleNext = async () => {
    try {
      // Validate required fields before proceeding
      const finalDeliveryAddress = deliveryAddress || userAddress;
      if (!finalDeliveryAddress || finalDeliveryAddress.trim() === '') {
        setShowAddressModal(true);
        return;
      }
      
      if (!orderData.deliveryDate || !orderData.deliveryTime) {
        alert('Please set a delivery date and time before placing the order.');
        return;
      }
      
      // Place the order without payment first
      console.log('Placing order:', orderData);
      console.log('Delivery address:', finalDeliveryAddress);
      console.log('Delivery date/time:', deliveryDateTime);
      console.log('Payment type:', paymentType);
      
      // Here you would typically send the order to the backend
      // For now, we'll simulate placing the order and show confirmation
      
      // Show order confirmation receipt
      console.log('🟢 Order placed - showing confirmation');
      setShowReceipt(true);
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleReceiptClose = async () => {
    try {
      // Save order to database
      const orderId = await saveOrderToDatabase();
      setSavedOrderId(orderId);
      setShowReceipt(false);
      
      // Navigate directly to customer dashboard
      navigate('/customer');
    } catch (error) {
      console.error('Error saving order:', error);
      setShowReceipt(false);
      alert('Failed to save order. Please try again.');
    }
  };

  const saveOrderToDatabase = async () => {
    try {
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Convert delivery date and time to proper MySQL DATETIME format
      let mysqlDateTime = null;
      if (orderData.deliveryDate && orderData.deliveryTime) {
        const date = new Date(orderData.deliveryDate);
        const [hours, minutes] = orderData.deliveryTime.split(':');
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        mysqlDateTime = date.toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:MM:SS
      }
      
      // Validate delivery address
      const finalDeliveryAddress = deliveryAddress || userAddress;
      if (!finalDeliveryAddress || finalDeliveryAddress.trim() === '') {
        throw new Error('Delivery address is required. Please add an address in your profile settings.');
      }

      const orderPayload = {
        customer_id: user.id,
        vendor_id: orderData.vendorId, // Assuming this exists in orderData
        delivery_address: finalDeliveryAddress,
        delivery_datetime: mysqlDateTime,
        payment_method: paymentMethod,
        payment_type: paymentType, // 'full' or 'downpayment'
        subtotal: parseFloat(orderData.totalPrice),
        delivery_fee: deliveryPrice || 0,
        total_amount: parseFloat(orderData.totalPrice) + (deliveryPrice || 0),
        status: 'pending', // Order status pending vendor approval
        payment_status: 'unpaid', // Payment pending until after approval
        items: orderData.items || []
      };

      console.log('Saving order to database:', orderPayload);
      console.log('Delivery details debug:', {
        deliveryAddress: deliveryAddress,
        userAddress: userAddress,
        deliveryDateTime: deliveryDateTime,
        mysqlDateTime: mysqlDateTime,
        originalDeliveryDate: orderData.deliveryDate,
        originalDeliveryTime: orderData.deliveryTime,
        finalAddress: deliveryAddress || userAddress,
        finalDateTime: mysqlDateTime
      });
      
      const response = await axios.post(`${apiBase}/api/orders`, orderPayload);
      
      if (response.data.success) {
        console.log('Order saved successfully:', response.data.order_id);
        return response.data.order_id;
      } else {
        throw new Error(response.data.error || 'Failed to save order');
      }
    } catch (error) {
      console.error('Error in saveOrderToDatabase:', error);
      throw error;
    }
  };

  const downloadReceipt = async () => {
    try {
      // Try to use html2canvas if available
      if (window.html2canvas) {
        const canvas = await window.html2canvas(receiptRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `GCash-Receipt-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // Fallback: Create a simple text receipt
        const receiptText = generateTextReceipt();
        const blob = new Blob([receiptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `GCash-Receipt-${Date.now()}.txt`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  const generateTextReceipt = () => {
    const orderId = Date.now().toString().slice(-8);
    const totalAmount = parseFloat(orderData.totalPrice) + (deliveryPrice || 0);
    const amountToPay = paymentType === 'downpayment' ? totalAmount * 0.5 : totalAmount;
    
    return `
=================================
       ORDER CONFIRMATION
=================================

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Status: PENDING VENDOR APPROVAL

---------------------------------
PAYMENT INFORMATION
---------------------------------
GCash - ${paymentType === 'downpayment' ? '50% Down Payment' : 'Full Payment'}
Note: Payment required after vendor approval

---------------------------------
ORDER SUMMARY
---------------------------------
${orderData.items?.map(item => 
  `${item.name} x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}`
).join('\n') || 'No items'}

${deliveryPrice > 0 ? `Delivery Fee: ₱${deliveryPrice.toFixed(2)}` : ''}

Grand Total: ₱${totalAmount.toFixed(2)}
${paymentType === 'downpayment' ? `Estimated Down Payment: ₱${(totalAmount * 0.5).toFixed(2)}` : ''}
${paymentType === 'downpayment' ? `Remaining Balance: ₱${(totalAmount * 0.5).toFixed(2)}` : ''}

ESTIMATED ${paymentType === 'downpayment' ? 'DOWN PAYMENT' : 'TOTAL'}: ₱${amountToPay.toFixed(2)}

---------------------------------
DELIVERY INFORMATION
---------------------------------
Address: ${deliveryAddress || userAddress}
Date & Time: ${deliveryDateTime}

---------------------------------
NEXT STEPS
---------------------------------
• Your order has been sent to the vendor for approval
• You will receive a notification once the vendor responds
• Payment via GCash will be required after order approval
• Keep this confirmation for your records
${paymentType === 'downpayment' ? '• You can pay 50% down payment first, remaining balance on delivery' : ''}

=================================
        Thank you for your order!
=================================
    `;
  };

  if (!orderData) {
    return (
      <>
        <NavWithLogo />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-700">Loading checkout...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavWithLogo />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
          </div>

          {/* Main Checkout Card */}
          <div className="bg-sky-100 rounded-2xl shadow-xl p-8">
            {/* Back Button */}
            <button 
              onClick={handleBack}
              className="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {/* Item Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Item Details</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Item name</div>
                    <div className="text-gray-800">
                      {orderData.flavorName}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Quantity</div>
                    <div className="text-gray-800">{orderData.quantity}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Size</div>
                    <div className="text-gray-800 capitalize">{orderData.size}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Delivery Date & Time:</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">🕒</span>
                      <span className="font-medium text-gray-900">
                        {deliveryDateTime || 'No delivery time set'}
                      </span>
                    </div>
                    {!deliveryDateTime && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ No delivery time specified. Please go back and set a delivery schedule.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-600 w-32">Location :</label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={deliveryAddress}
                      readOnly
                      placeholder={userAddress ? "Your saved address" : "No saved address - Please add an address in your profile"}
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {userAddress 
                        ? "Note: To change your delivery address, go to Address Settings in your profile"
                        : "No saved address found. Please add an address in your profile settings for faster checkout."
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-600 w-32">Delivery :</label>
                  <div className="flex items-center space-x-2">
                    {deliveryLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (deliveryPrice || 0) > 0 ? (
                      <span className="text-blue-600 font-medium">₱{deliveryPrice.toFixed(2)}</span>
                    ) : (
                      <span className="text-green-600 font-medium">Free</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <span className="text-gray-700 font-medium">GCash Payment</span>
                </div>
                
                {/* Payment Type Options */}
                <div className="ml-11 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Payment Option:</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentType"
                        value="full"
                        checked={paymentType === 'full'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-gray-700">Full Payment</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentType"
                        value="downpayment"
                        checked={paymentType === 'downpayment'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-gray-700">50% Down Payment</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Total and Action Button */}
            <div className="flex justify-end items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Subtotal:</span>
                    <span>₱{orderData.totalPrice}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Delivery:</span>
                    <span>₱{(deliveryPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 border-t border-gray-300 pt-1 mt-1">
                    <span>Grand Total:</span>
                    <span>₱{(parseFloat(orderData.totalPrice) + (deliveryPrice || 0)).toFixed(2)}</span>
                  </div>
                  {paymentType === 'downpayment' && (
                    <>
                      <div className="flex items-center space-x-2 text-sm text-orange-600">
                        <span>50% Down Payment:</span>
                        <span>₱{((parseFloat(orderData.totalPrice) + (deliveryPrice || 0)) * 0.5).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Remaining Balance:</span>
                        <span>₱{((parseFloat(orderData.totalPrice) + (deliveryPrice || 0)) * 0.5).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center space-x-2 text-lg font-bold text-blue-600 border-t border-gray-300 pt-1 mt-1">
                    <span>Estimated {paymentType === 'downpayment' ? 'Down Payment' : 'Total'}:</span>
                    <span>₱{
                      paymentType === 'downpayment' 
                        ? ((parseFloat(orderData.totalPrice) + (deliveryPrice || 0)) * 0.5).toFixed(2)
                        : (parseFloat(orderData.totalPrice) + (deliveryPrice || 0)).toFixed(2)
                    }</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="px-8 py-3 text-white rounded-lg font-medium hover:opacity-80 transition-colors"
                style={{ backgroundColor: '#FFDDAE' }}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal for GCash Payment */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6" ref={receiptRef}>
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmation</h2>
                <p className="text-gray-600">Your order has been placed successfully</p>
              </div>

              {/* Receipt Content */}
              <div className="space-y-4 mb-6">
                {/* Order Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">G</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">GCash</span>
                        <p className="text-sm text-gray-600">
                          {paymentType === 'downpayment' ? '50% Down Payment' : 'Full Payment'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Payment will be required after vendor approves your order
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    {orderData.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name} x{item.quantity}</span>
                        <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {deliveryPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₱{deliveryPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Grand Total:</span>
                        <span>₱{(parseFloat(orderData.totalPrice) + (deliveryPrice || 0)).toFixed(2)}</span>
                      </div>
                      {paymentType === 'downpayment' && (
                        <>
                          <div className="flex justify-between text-sm text-orange-600">
                            <span>50% Down Payment:</span>
                            <span>₱{((parseFloat(orderData.totalPrice) + (deliveryPrice || 0)) * 0.5).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Remaining Balance:</span>
                            <span>₱{((parseFloat(orderData.totalPrice) + (deliveryPrice || 0)) * 0.5).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                        <span>Estimated {paymentType === 'downpayment' ? 'Down Payment' : 'Total'}:</span>
                        <span className="text-blue-600">₱{
                          paymentType === 'downpayment' 
                            ? ((parseFloat(orderData.totalPrice) + (deliveryPrice || 0)) * 0.5).toFixed(2)
                            : (parseFloat(orderData.totalPrice) + (deliveryPrice || 0)).toFixed(2)
                        }</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Delivery Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600"><strong>Address:</strong> {deliveryAddress || userAddress}</p>
                    <p className="text-gray-600"><strong>Date & Time:</strong> {deliveryDateTime}</p>
                  </div>
                </div>

                {/* Order Status Instructions */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Next Steps</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• Your order has been sent to the vendor for approval</p>
                    <p>• You will receive a notification once the vendor responds</p>
                    <p>• Payment via GCash will be required after order approval</p>
                    <p>• Keep this confirmation for your records</p>
                    {paymentType === 'downpayment' && (
                      <p>• You can pay 50% down payment first, remaining balance on delivery</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleReceiptClose}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Confirm Order
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Edit Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Required Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Address Required</h2>
                <p className="text-gray-600">Please add a delivery address in your profile settings before placing an order.</p>
              </div>

              {/* Content */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">How to add your address:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Go to your profile settings</li>
                      <li>• Navigate to Address Settings</li>
                      <li>• Add your delivery address</li>
                      <li>• Return here to place your order</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Got it
                </button>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    navigate('/customer?view=settings');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Go to Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
