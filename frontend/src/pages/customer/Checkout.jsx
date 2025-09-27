import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NavWithLogo } from '../../components/shared/nav';
import { useCart } from '../../contexts/CartContext';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  const [vendorDeliveryFees, setVendorDeliveryFees] = useState({});
  const [deliveryLoading, setDeliveryLoading] = useState({});
  const [isDeliveryInitialized, setIsDeliveryInitialized] = useState(false);
  const [deliveryCalculationComplete, setDeliveryCalculationComplete] = useState(false);
  const [deliveryCalculationStarted, setDeliveryCalculationStarted] = useState(false);
  const [addressFetchStarted, setAddressFetchStarted] = useState(false);
  const [forceRefreshDelivery, setForceRefreshDelivery] = useState(0);
  // const [deliveryAvailable, setDeliveryAvailable] = useState(true); // Removed unused variable
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'downpayment'
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const receiptRef = useRef(null);

  // Debug receipt state changes
  useEffect(() => {
    console.log('🔍 Receipt state changed:', showReceipt);
  }, [showReceipt]);

  // Separate delivery calculation service - runs independently with immediate fallback
  const calculateDeliveryFees = useCallback(async (vendors, city, province) => {
    console.log('🚀 Starting independent delivery calculation for vendors:', vendors.map(v => v.vendor_id));
    
    // Prevent multiple simultaneous calls
    if (deliveryCalculationStarted) {
      console.log('⚠️ Delivery calculation already in progress, skipping...');
      return {};
    }
    
      // Removed immediate fallback to allow API calls to complete properly
    
    const results = {};
    const promises = vendors.map(async (vendor) => {
      const vendorId = vendor.vendor_id;
      try {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
        const url = `${apiBase}/api/vendor/delivery/${vendorId}/price?city=${encodeURIComponent(city)}&province=${encodeURIComponent(province)}`;
        
        console.log(`🌐 Fetching delivery for vendor ${vendorId} from:`, url);
        console.log(`📍 Location: ${city}, ${province}`);
        console.log(`🔍 Vendor ID type:`, typeof vendorId, 'Value:', vendorId);
        const response = await axios.get(url, { timeout: 3000 });
        
        console.log(`📦 Response for vendor ${vendorId}:`, response.data);
        console.log(`🔍 Full response:`, JSON.stringify(response.data, null, 2));
        console.log(`💰 Delivery price from API:`, response.data.delivery_price);
        
        if (response.data && response.data.success) {
          // Use the actual delivery price from API (0 means free delivery)
          const fee = response.data.delivery_price || 0;
          results[vendorId] = fee;
          console.log(`✅ Vendor ${vendorId} delivery fee: ₱${fee} (${fee === 0 ? 'FREE' : 'PAID'})`);
        } else {
          results[vendorId] = 0; // Default to free delivery if API fails
          console.log(`❌ Vendor ${vendorId} API failed, using free delivery: ₱0`);
        }
      } catch (error) {
        results[vendorId] = 0; // Default to free delivery on error
        console.log(`💥 Error for vendor ${vendorId}:`, error.message, 'using free delivery: ₱0');
      }
    });

    try {
      // Wait for all promises to complete
      await Promise.allSettled(promises);
      
      console.log('🏁 All delivery calculations completed:', results);
      return results;
    } catch (error) {
      console.error('💥 Delivery calculation service failed:', error);
      
        const defaultResults = {};
        vendors.forEach(vendor => {
          defaultResults[vendor.vendor_id] = 0; // Default to free delivery
        });
        return defaultResults;
    }
  }, [deliveryCalculationStarted]);

  const fetchUserAddress = useCallback(async () => {
    // Prevent multiple calls
    if (addressFetchStarted) {
      console.log('⚠️ Address fetch already started, skipping...');
      return;
    }
    
    setAddressFetchStarted(true);
    console.log('🏠 Starting address fetch...');
    
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
          
          // Fetch delivery prices for all vendors in the order
          if (primaryAddress.cityVillage && primaryAddress.province) {
            console.log('📍 Address found:', { 
              cityVillage: primaryAddress.cityVillage, 
              province: primaryAddress.province,
              fullAddress: addressString 
            });
            
            // Store address data for later use when orderData is available
            setUserAddress(addressString);
            setDeliveryAddress(addressString);
          } else {
            console.log('⚠️ Missing address data:', { 
              cityVillage: primaryAddress?.cityVillage, 
              province: primaryAddress?.province 
            });
            setUserAddress('');
            setDeliveryAddress('');
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
  }, [addressFetchStarted]);

  // Separate useEffect to handle delivery calculation when both address and orderData are available
  useEffect(() => {
    if (orderData && userAddress && !deliveryCalculationStarted) {
      console.log('🚀 Starting delivery calculation with orderData and address');
      console.log('📦 OrderData:', orderData);
      console.log('📍 UserAddress:', userAddress);
      
      // Extract city and province from the address
      const addressParts = userAddress.split(', ');
      const city = addressParts[addressParts.length - 4] || ''; // Cordova (4th from end)
      const province = addressParts[addressParts.length - 3] || ''; // Cebu (3rd from end)
      
      console.log('🏙️ Extracted location:', { city, province });
      
      if (city && province) {
        setDeliveryCalculationStarted(true);
        
        if (orderData?.fromCart && orderData?.items) {
          console.log('🛒 Cart checkout detected, items:', orderData.items.length);
          // Handle cart checkout - use independent delivery calculation
          const vendorGroups = groupItemsByVendor(orderData.items);
          const vendors = Object.values(vendorGroups);
          
          console.log('🏪 Vendors in cart:', vendors.map(v => ({
            vendorId: v.vendor_id,
            vendorName: v.vendor_name,
            itemCount: v.items?.length
          })));
          console.log('🔍 Full vendor data:', JSON.stringify(vendors, null, 2));
          console.log('🔍 Vendor IDs being processed:', vendors.map(v => ({ id: v.vendor_id, type: typeof v.vendor_id, name: v.vendor_name })));
          
          // Set loading state for all vendors
          const loadingState = {};
          vendors.forEach(vendor => {
            loadingState[vendor.vendor_id] = true;
          });
          setDeliveryLoading(loadingState);
          setIsDeliveryInitialized(true);
          
          // Use independent delivery calculation service
          calculateDeliveryFees(vendors, city, province)
            .then(results => {
              console.log('🎉 Delivery calculation completed:', results);
              console.log('💰 Final delivery fees:', JSON.stringify(results, null, 2));
              setVendorDeliveryFees(results);
              setDeliveryLoading({}); // Clear all loading states
              setDeliveryCalculationComplete(true);
            })
            .catch(error => {
              console.error('💥 Delivery calculation failed:', error);
              // Set default fees for all vendors
              const defaultFees = {};
              vendors.forEach(vendor => {
                defaultFees[vendor.vendor_id] = 50;
              });
              setVendorDeliveryFees(defaultFees);
              setDeliveryLoading({});
              setDeliveryCalculationComplete(true);
            });
            
        } else if (orderData?.vendorId) {
          console.log('🛍️ Single item checkout for vendor:', orderData.vendorId);
          // Handle single item checkout
          const vendor = { vendor_id: orderData.vendorId, vendor_name: orderData.vendorName };
          setDeliveryLoading({ [orderData.vendorId]: true });
          setIsDeliveryInitialized(true);
          
          // Use independent delivery calculation service
          calculateDeliveryFees([vendor], city, province)
            .then(results => {
              console.log('🎉 Single vendor delivery calculation completed:', results);
              setVendorDeliveryFees(results);
              setDeliveryPrice(results[orderData.vendorId] || 0);
              setDeliveryLoading({});
              setDeliveryCalculationComplete(true);
            })
            .catch(error => {
              console.error('💥 Single vendor delivery calculation failed:', error);
              setVendorDeliveryFees({ [orderData.vendorId]: 0 }); // Default to free delivery
              setDeliveryPrice(0);
              setDeliveryLoading({});
              setDeliveryCalculationComplete(true);
            });
        }
        
        // Mark delivery as initialized
        setIsDeliveryInitialized(true);
      } else {
        console.log('⚠️ Missing city/province data for delivery calculation');
      }
    }
  }, [orderData, userAddress, deliveryCalculationStarted]);

  useEffect(() => {
    console.log('🔄 Main useEffect triggered');
    // Get order data from location state
    if (location.state) {
      if (location.state.fromCart && location.state.items && location.state.items.length > 0) {
        // Handle cart checkout
        const cartOrderData = {
          fromCart: true,
          items: location.state.items,
          totalPrice: location.state.totalPrice,
          vendorId: location.state.items[0]?.vendor_id,
          vendorName: location.state.items[0]?.vendor_name,
          deliveryDate: location.state.deliveryDate,
          deliveryTime: location.state.deliveryTime
        };
        setOrderData(cartOrderData);
      } else {
        // Handle single item checkout
      setOrderData(location.state);
      }
      
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
  }, [location.state, navigate]); // Removed fetchUserAddress from dependencies to prevent loops

  // Helper function to group items by vendor
  const groupItemsByVendor = useCallback((items) => {
    if (!items || !Array.isArray(items)) return {};
    
    return items.reduce((groups, item) => {
      const vendorId = item.vendor_id;
      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendor_id: vendorId,
          vendor_name: item.vendor_name,
          items: [],
          total_price: 0
        };
      }
      groups[vendorId].items.push(item);
      groups[vendorId].total_price += item.price * item.quantity;
      return groups;
    }, {});
  }, []);

  // Memoized grouped vendors to prevent unnecessary re-renders
  const groupedVendors = useMemo(() => {
    if (!orderData?.items) return [];
    const groups = groupItemsByVendor(orderData.items);
    return Object.values(groups);
  }, [orderData?.items, groupItemsByVendor]);

  // Emergency fallback - removed to prevent interference with actual API calls

  // Simple delivery completion monitoring
  useEffect(() => {
    if (deliveryCalculationComplete) {
      console.log('✅ Delivery calculation process completed');
    }
  }, [deliveryCalculationComplete]);

  // Helper function to calculate total delivery fees
  const getTotalDeliveryFee = () => {
    return Object.values(vendorDeliveryFees).reduce((total, fee) => total + (fee || 0), 0);
  };

  // Helper function to get vendor delivery fee
  const getVendorDeliveryFee = (vendorId) => {
    return vendorDeliveryFees[vendorId] || 0;
  };

  // Helper function to get total amount including delivery fees
  const getTotalAmount = () => {
    const subtotal = parseFloat(orderData?.totalPrice || 0);
    const totalDeliveryFee = orderData?.fromCart ? getTotalDeliveryFee() : (deliveryPrice || 0);
    return subtotal + totalDeliveryFee;
  };

  // Old fetchDeliveryPrice function removed - now using calculateDeliveryFees service

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
      
      // Place the order(s) to the backend
      console.log('Placing order:', orderData);
      console.log('Delivery address:', finalDeliveryAddress);
      console.log('Delivery date/time:', deliveryDateTime);
      console.log('Payment type:', paymentType);
      
      // Show order confirmation receipt first
      setShowReceipt(true);
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleReceiptClose = async () => {
    try {
      // Only save order to database if not already saved
      if (!savedOrderId) {
        console.log('💾 Saving order to database...');
        const orderId = await saveOrderToDatabase();
        setSavedOrderId(orderId);
        console.log('✅ Order saved successfully:', orderId);
      } else {
        console.log('⚠️ Order already saved, skipping save operation');
      }
      
      // Clear cart if this was a cart checkout
      if (orderData?.fromCart) {
        clearCart();
      }
      
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
        // Create date in local timezone to avoid timezone conversion issues
        const date = new Date(orderData.deliveryDate);
        const [hours, minutes] = orderData.deliveryTime.split(':');
        
        // Set the time in local timezone without converting to UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(parseInt(hours)).padStart(2, '0');
        const minute = String(parseInt(minutes)).padStart(2, '0');
        
        // Format: YYYY-MM-DD HH:MM:SS (local time, not UTC)
        mysqlDateTime = `${year}-${month}-${day} ${hour}:${minute}:00`;
        
        console.log('🕒 Delivery time conversion:', {
          originalDate: orderData.deliveryDate,
          originalTime: orderData.deliveryTime,
          hours: hours,
          minutes: minutes,
          mysqlDateTime: mysqlDateTime
        });
      }
      
      // Validate delivery address
      const finalDeliveryAddress = deliveryAddress || userAddress;
      if (!finalDeliveryAddress || finalDeliveryAddress.trim() === '') {
        throw new Error('Delivery address is required. Please add an address in your profile settings.');
      }

      if (orderData?.fromCart && orderData?.items) {
        // Multi-vendor cart order - create separate orders for each vendor
        console.log('🛒 Creating multi-vendor orders from cart');
        
        const vendorGroups = groupItemsByVendor(orderData.items);
        const vendors = Object.values(vendorGroups);
        const orderIds = [];
        
        console.log('🏪 Creating orders for vendors:', vendors.map(v => ({
          vendorId: v.vendor_id,
          vendorName: v.vendor_name,
          itemCount: v.items?.length,
          subtotal: v.total_price,
          deliveryFee: getVendorDeliveryFee(v.vendor_id)
        })));
        
        // Create separate order for each vendor
        for (const vendor of vendors) {
          const vendorItems = vendor.items;
          const vendorSubtotal = vendor.total_price;
          const vendorDeliveryFee = getVendorDeliveryFee(vendor.vendor_id);
          const vendorTotal = vendorSubtotal + vendorDeliveryFee;
          
          const vendorOrderPayload = {
            customer_id: user.id,
            vendor_id: vendor.vendor_id,
            delivery_address: finalDeliveryAddress,
            delivery_datetime: mysqlDateTime,
            payment_method: paymentMethod,
            payment_type: paymentType,
            subtotal: vendorSubtotal,
            delivery_fee: vendorDeliveryFee,
            total_amount: vendorTotal,
            status: 'pending',
            payment_status: 'unpaid',
            items: vendorItems
          };
          
          console.log(`📦 Creating order for ${vendor.vendor_name}:`, vendorOrderPayload);
          
          const response = await axios.post(`${apiBase}/api/orders`, vendorOrderPayload);
          
          if (response.data.success) {
            console.log(`✅ Order created for ${vendor.vendor_name}:`, response.data.order_id);
            orderIds.push({
              order_id: response.data.order_id,
              vendor_id: vendor.vendor_id,
              vendor_name: vendor.vendor_name,
              total_amount: vendorTotal
            });
          } else {
            throw new Error(`Failed to create order for ${vendor.vendor_name}: ${response.data.error}`);
          }
        }
        
        console.log('🎉 All multi-vendor orders created successfully:', orderIds);
        return orderIds; // Return array of order IDs
        
      } else {
        // Single vendor order (direct from product page)
        console.log('🛍️ Creating single vendor order');
        
        const orderPayload = {
          customer_id: user.id,
          vendor_id: orderData.vendorId,
          delivery_address: finalDeliveryAddress,
          delivery_datetime: mysqlDateTime,
          payment_method: paymentMethod,
          payment_type: paymentType,
          subtotal: parseFloat(orderData.totalPrice),
          delivery_fee: deliveryPrice || 0,
          total_amount: getTotalAmount(),
          status: 'pending',
          payment_status: 'unpaid',
          items: orderData.items || []
        };

        console.log('Saving single vendor order to database:', orderPayload);
        
        const response = await axios.post(`${apiBase}/api/orders`, orderPayload);
        
        if (response.data.success) {
          console.log('Order saved successfully:', response.data.order_id);
          return [{
            order_id: response.data.order_id,
            vendor_id: orderData.vendorId,
            vendor_name: orderData.vendorName,
            total_amount: getTotalAmount()
          }];
        } else {
          throw new Error(response.data.error || 'Failed to save order');
        }
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
    const totalAmount = getTotalAmount();
    const amountToPay = paymentType === 'downpayment' ? totalAmount * 0.5 : totalAmount;
    
    if (Array.isArray(savedOrderId) && savedOrderId.length > 1) {
      // Multi-vendor order receipt
      return `
=================================
    MULTI-VENDOR ORDER CONFIRMATION
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
ORDER BREAKDOWN BY VENDOR
---------------------------------
${savedOrderId.map(order => {
  const vendorGroup = groupedVendors.find(vg => vg.vendor_id === order.vendor_id);
  const vendorDeliveryFee = getVendorDeliveryFee(order.vendor_id);
  return `
${vendorGroup?.vendor_name || 'Unknown Vendor'}:
Order ID: #${order.order_id}
Items: ${vendorGroup?.items?.map(item => `${item.name} x${item.quantity}`).join(', ') || 'N/A'}
Subtotal: ₱${(order.total_amount - vendorDeliveryFee).toFixed(2)}
Delivery: ₱${vendorDeliveryFee.toFixed(2)}
Total: ₱${order.total_amount.toFixed(2)}`;
}).join('\n')}

---------------------------------
OVERALL SUMMARY
---------------------------------
${orderData.items?.map(item => 
  `${item.name} x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}`
).join('\n') || 'No items'}

${orderData?.fromCart ? 
  Object.entries(vendorDeliveryFees).map(([vendorId, fee]) => {
    const vendorGroup = groupedVendors.find(vg => vg.vendor_id.toString() === vendorId);
    return fee > 0 ? `${vendorGroup?.vendor_name} Delivery: ₱${fee.toFixed(2)}` : `${vendorGroup?.vendor_name} Delivery: Free`;
  }).join('\n') :
  (deliveryPrice > 0 ? `Delivery Fee: ₱${deliveryPrice.toFixed(2)}` : '')
}

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
• Your orders have been sent to ${savedOrderId.length} vendors for approval
• You will receive separate notifications from each vendor
• Payment via GCash will be required after each vendor approval
• Track each order separately in your order history
• Keep this confirmation for your records
${paymentType === 'downpayment' ? '• You can pay 50% down payment first, remaining balance on delivery' : ''}

=================================
        Thank you for your order!
=================================
    `;
    } else {
      // Single vendor order receipt
      const orderId = Array.isArray(savedOrderId) ? savedOrderId[0]?.order_id : savedOrderId;
      
      return `
=================================
       ORDER CONFIRMATION
=================================

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Order ID: #${orderId || 'N/A'}
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

${orderData?.fromCart ? 
  Object.entries(vendorDeliveryFees).map(([vendorId, fee]) => {
    const vendorGroup = groupedVendors.find(vg => vg.vendor_id.toString() === vendorId);
    return fee > 0 ? `${vendorGroup?.vendor_name} Delivery: ₱${fee.toFixed(2)}` : `${vendorGroup?.vendor_name} Delivery: Free`;
  }).join('\n') :
  (deliveryPrice > 0 ? `Delivery Fee: ₱${deliveryPrice.toFixed(2)}` : '')
}

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
    }
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
              
              {orderData?.fromCart && orderData?.items ? (
                // Cart checkout - show items grouped by vendor
                <div className="space-y-4">
                  {groupedVendors.map((vendorGroup, vendorIndex) => (
                    <div key={vendorIndex} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-blue-600">{vendorGroup.vendor_name}</h3>
                        <div className="text-sm text-gray-600">
                          Delivery: {!deliveryCalculationComplete ? (
                            <div className="inline-flex items-center space-x-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              <span>Calculating...</span>
                            </div>
                          ) : getVendorDeliveryFee(vendorGroup.vendor_id) > 0 ? (
                            <span className="text-blue-600 font-medium">₱{getVendorDeliveryFee(vendorGroup.vendor_id).toFixed(2)}</span>
                          ) : (
                            <span className="text-green-600 font-medium">Free</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {vendorGroup.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-3 gap-4 text-sm bg-white rounded-lg p-3">
                            <div>
                              <div className="font-medium text-gray-600 mb-1">Flavor</div>
                              <div className="text-gray-800 font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500">Size: {item.size}</div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-600 mb-1">Quantity</div>
                              <div className="text-gray-800">{item.quantity}</div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-600 mb-1">Price</div>
                              <div className="text-gray-800 font-medium">₱{(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">Subtotal:</span>
                          <span className="font-bold text-gray-800">₱{vendorGroup.total_price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Single item checkout
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
              )}
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
                  <div className="flex-1">
                    {orderData?.fromCart && orderData?.items ? (
                      // Cart checkout - show delivery fees by vendor
                      <div className="space-y-2">
                        {groupedVendors.map((vendorGroup, index) => (
                          <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                            <span className="text-sm text-gray-700">{vendorGroup.vendor_name}:</span>
                  <div className="flex items-center space-x-2">
                              {!deliveryCalculationComplete ? (
                                <div className="flex items-center space-x-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  <span className="text-xs text-gray-500">Calculating...</span>
                                </div>
                              ) : getVendorDeliveryFee(vendorGroup.vendor_id) > 0 ? (
                                <span className="text-blue-600 font-medium text-sm">₱{getVendorDeliveryFee(vendorGroup.vendor_id).toFixed(2)}</span>
                              ) : (
                                <span className="text-green-600 font-medium text-sm">Free</span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">Total Delivery Fee:</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-blue-600">₱{getTotalDeliveryFee().toFixed(2)}</span>
                              <button
                                onClick={() => {
                                  setForceRefreshDelivery(prev => prev + 1);
                                  setDeliveryCalculationComplete(false);
                                  setDeliveryCalculationStarted(false);
                                  setVendorDeliveryFees({});
                                  setDeliveryLoading({});
                                  setIsDeliveryInitialized(false);
                                  setAddressFetchStarted(false);
                                  // Trigger address fetch again
                                  setTimeout(() => {
                                    const userRaw = sessionStorage.getItem('user');
                                    if (userRaw) {
                                      const user = JSON.parse(userRaw);
                                      fetchUserAddress();
                                    }
                                  }, 100);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                title="Refresh delivery calculation"
                              >
                                🔄
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Single item checkout
                      <div className="flex items-center space-x-2">
                        {!deliveryCalculationComplete ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (deliveryPrice || 0) > 0 ? (
                      <span className="text-blue-600 font-medium">₱{deliveryPrice.toFixed(2)}</span>
                    ) : (
                      <span className="text-green-600 font-medium">Free</span>
                        )}
                      </div>
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
                    <span>₱{orderData?.fromCart ? getTotalDeliveryFee().toFixed(2) : (deliveryPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 border-t border-gray-300 pt-1 mt-1">
                    <span>Grand Total:</span>
                    <span>₱{getTotalAmount().toFixed(2)}</span>
                  </div>
                  {paymentType === 'downpayment' && (
                    <>
                      <div className="flex items-center space-x-2 text-sm text-orange-600">
                        <span>50% Down Payment:</span>
                        <span>₱{(getTotalAmount() * 0.5).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Remaining Balance:</span>
                        <span>₱{(getTotalAmount() * 0.5).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center space-x-2 text-lg font-bold text-blue-600 border-t border-gray-300 pt-1 mt-1">
                    <span>Estimated {paymentType === 'downpayment' ? 'Down Payment' : 'Total'}:</span>
                    <span>₱{(paymentType === 'downpayment' ? getTotalAmount() * 0.5 : getTotalAmount()).toFixed(2)}</span>
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

                {/* Flavor Details */}
                <div className="bg-pink-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Flavor Details</h3>
                  <div className="space-y-3">
                    {orderData.items?.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-pink-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <span className="text-sm text-gray-600">x{item.quantity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">₱{item.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-pink-600">
                          <span>Subtotal:</span>
                          <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
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
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items Total:</span>
                      <span className="font-medium">₱{orderData.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</span>
                    </div>
                    {orderData?.fromCart ? (
                      // Show delivery fees by vendor for cart checkout
                      Object.entries(vendorDeliveryFees).map(([vendorId, fee]) => {
                        const vendorGroup = groupedVendors.find(vg => vg.vendor_id.toString() === vendorId);
                        return (
                          <div key={vendorId} className="flex justify-between text-sm">
                            <span className="text-gray-600">{vendorGroup?.vendor_name} Delivery</span>
                            <span className="font-medium">{fee > 0 ? `₱${fee.toFixed(2)}` : 'Free'}</span>
                          </div>
                        );
                      })
                    ) : (
                      deliveryPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₱{deliveryPrice.toFixed(2)}</span>
                      </div>
                      )
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Grand Total:</span>
                        <span>₱{getTotalAmount().toFixed(2)}</span>
                      </div>
                      {paymentType === 'downpayment' && (
                        <>
                          <div className="flex justify-between text-sm text-orange-600">
                            <span>50% Down Payment:</span>
                            <span>₱{(getTotalAmount() * 0.5).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Remaining Balance:</span>
                            <span>₱{(getTotalAmount() * 0.5).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                        <span>Estimated {paymentType === 'downpayment' ? 'Down Payment' : 'Total'}:</span>
                        <span className="text-blue-600">₱{(paymentType === 'downpayment' ? getTotalAmount() * 0.5 : getTotalAmount()).toFixed(2)}</span>
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
