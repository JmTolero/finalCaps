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
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  const [vendorDeliveryFees, setVendorDeliveryFees] = useState({});
  const [deliveryCalculationComplete, setDeliveryCalculationComplete] = useState(false);
  const [addressFetchStarted, setAddressFetchStarted] = useState(false);
  // const [deliveryAvailable, setDeliveryAvailable] = useState(true); // Removed unused variable
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [paymentOption, setPaymentOption] = useState('full'); // 'full' or '50'
  const receiptRef = useRef(null);

  // Debug receipt state changes
  useEffect(() => {
    console.log('🔍 Receipt state changed:', showReceipt);
  }, [showReceipt]);

  const groupItemsByVendor = useCallback((items) => {
    if (!items || !Array.isArray(items)) {
      return {};
    }

    return items.reduce((groups, item) => {
      const vendorId = item.vendor_id;
      if (vendorId === null || vendorId === undefined) {
        console.warn('Skipping item with invalid vendor_id:', item);
        return groups;
      }

      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendor_id: vendorId,
          vendor_name: item.vendor_name || 'Unknown Vendor',
          items: [],
          total_price: 0
        };
      }

      groups[vendorId].items.push(item);
      groups[vendorId].total_price += item.price * item.quantity;
      return groups;
    }, {});
  }, []);

  // Get delivery price for a specific vendor and location with fuzzy matching
  const getVendorDeliveryPrice = useCallback(async (vendorId, city, province) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const url = `${apiBase}/api/vendor/delivery/${vendorId}/price?city=${encodeURIComponent(city)}&province=${encodeURIComponent(province)}`;
      
      console.log(`🌐 Fetching delivery price for vendor ${vendorId}:`, url);
      const response = await axios.get(url, { timeout: 5000 });
      
      if (response.data && response.data.success) {
        const price = response.data.delivery_price || 0;
        const matchType = response.data.match_type;
        const suggestions = response.data.suggestions;
        
        console.log(`✅ Vendor ${vendorId} delivery price: ₱${price} (${matchType} match)`);
        
        // Show warning for fuzzy matches
        if (matchType === 'fuzzy' && suggestions) {
          console.warn(`⚠️ Fuzzy match detected for vendor ${vendorId}:`, suggestions);
          // You could show a toast notification here
        }
        
        return {
          price: price,
          matchType: matchType,
          suggestions: suggestions,
          success: true
        };
      } else {
        console.log(`❌ Vendor ${vendorId} delivery not available:`, response.data?.message);
        return {
          price: 0,
          matchType: 'none',
          suggestions: response.data?.suggestions,
          message: response.data?.message,
          success: false
        };
      }
    } catch (error) {
      console.log(`💥 Error getting delivery price for vendor ${vendorId}:`, error.message);
      return {
        price: 0,
        matchType: 'error',
        success: false,
        error: error.message
      };
    }
  }, []);

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

  // Delivery calculation with actual vendor API calls
  useEffect(() => {
    if (orderData && userAddress && !deliveryCalculationComplete) {
      console.log('🚀 Starting delivery calculation with vendor API calls');
      
      // Extract city and province from the address
      // Address format: "Street, Barangay, City, Province, Region, Postal"
      const addressParts = userAddress.split(', ');
      
      let city = '';
      let province = '';
      
      // Find city and province by looking for known patterns
      for (let i = 0; i < addressParts.length; i++) {
        const part = addressParts[i].trim();
        
        // Check if this part is a known province
        const knownProvinces = [
          'Metro Manila', 'Cebu', 'Davao del Sur', 'Laguna', 'Cavite', 'Rizal', 'Batangas', 'Quezon',
          'Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales',
          'Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino',
          'Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan',
          'Abra', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province', 'Apayao',
          'Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon',
          'Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental',
          'Bohol', 'Negros Oriental', 'Siquijor',
          'Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Western Samar', 'Southern Leyte',
          'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay',
          'Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental',
          'Compostela Valley', 'Davao del Norte', 'Davao Occidental', 'Davao Oriental',
          'North Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat',
          'Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur',
          'Basilan', 'Lanao del Sur', 'Maguindanao', 'Sulu', 'Tawi-Tawi'
        ];
        
        if (knownProvinces.includes(part)) {
          province = part;
          // City should be the part before the province
          if (i > 0) {
            city = addressParts[i - 1].trim();
          }
          break;
        }
      }
      
      console.log('📍 Parsed address:', { 
        fullAddress: userAddress, 
        addressParts, 
        city, 
        province 
      });
      
      if (city && province) {
        setDeliveryCalculationComplete(true); // Prevent multiple runs
        
        if (orderData?.fromCart && orderData?.items) {
          // Cart checkout - get delivery prices for each vendor
          const vendorGroups = groupItemsByVendor(orderData.items);
          const vendors = Object.values(vendorGroups);
          
          console.log('🛒 Getting delivery prices for vendors:', vendors.map(v => v.vendor_id));
          
          // Get delivery prices for all vendors
          const getDeliveryPrices = async () => {
            const deliveryFees = {};
            
            for (const vendor of vendors) {
              try {
                const result = await getVendorDeliveryPrice(vendor.vendor_id, city, province);
                deliveryFees[vendor.vendor_id] = result.price;
                console.log(`💰 Vendor ${vendor.vendor_id} (${vendor.vendor_name}): ₱${result.price} (${result.matchType})`);
                
                // Show warning for fuzzy matches or no matches
                if (result.matchType === 'fuzzy' && result.suggestions) {
                  console.warn(`⚠️ Address correction suggested for vendor ${vendor.vendor_id}:`, result.suggestions);
                } else if (result.matchType === 'none' && result.suggestions) {
                  console.warn(`❌ No delivery available for vendor ${vendor.vendor_id}:`, result.suggestions);
                }
              } catch (error) {
                console.log(`❌ Failed to get delivery price for vendor ${vendor.vendor_id}:`, error.message);
                deliveryFees[vendor.vendor_id] = 0; // Free delivery on error
              }
            }
            
            console.log('🎉 All delivery prices collected:', deliveryFees);
            setVendorDeliveryFees(deliveryFees);
          };
          
          getDeliveryPrices();
          
        } else if (orderData?.vendorId) {
          // Single item checkout - get delivery price for this vendor
          console.log('🛍️ Getting delivery price for single vendor:', orderData.vendorId);
          
          const getSingleDeliveryPrice = async () => {
            try {
              const result = await getVendorDeliveryPrice(orderData.vendorId, city, province);
              setVendorDeliveryFees({ [orderData.vendorId]: result.price });
              setDeliveryPrice(result.price);
              console.log(`💰 Single vendor ${orderData.vendorId} delivery price: ₱${result.price} (${result.matchType})`);
              
              // Show warning for fuzzy matches or no matches
              if (result.matchType === 'fuzzy' && result.suggestions) {
                console.warn(`⚠️ Address correction suggested for vendor ${orderData.vendorId}:`, result.suggestions);
              } else if (result.matchType === 'none' && result.suggestions) {
                console.warn(`❌ No delivery available for vendor ${orderData.vendorId}:`, result.suggestions);
              }
            } catch (error) {
              console.log(`❌ Failed to get delivery price for vendor ${orderData.vendorId}:`, error.message);
              setVendorDeliveryFees({ [orderData.vendorId]: 0 });
              setDeliveryPrice(0);
            }
          };
          
          getSingleDeliveryPrice();
        }
      }
    }
  }, [orderData, userAddress, deliveryCalculationComplete, groupItemsByVendor, getVendorDeliveryPrice]);

  // Reset delivery state when order data changes
  useEffect(() => {
    if (orderData) {
      console.log('🔄 Resetting delivery state for new order');
      setDeliveryCalculationComplete(false);
      setVendorDeliveryFees({});
    }
  }, [orderData]);

  useEffect(() => {
    console.log('🔄 Main useEffect triggered');
    // No location state provided – send the user back
    if (!location.state) {
      navigate('/customer');
      return;
    }

    // We already captured the state on a previous render
    if (!orderData) {
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
        console.log('🛒 Setting cart order data:', cartOrderData);
        setOrderData(cartOrderData);
      } else {
        // Handle single item checkout
        console.log('🛍️ Setting single item order data:', location.state);
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
    }

    // Fetch user's address
    fetchUserAddress();
  }, [location.state, navigate, orderData, fetchUserAddress]);

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
    const fee = vendorDeliveryFees[vendorId] || 0;
    console.log(`🔍 getVendorDeliveryFee(${vendorId}):`, fee, 'type:', typeof fee);
    return fee;
  };

  // Helper function to get total amount including delivery fees
  const getTotalAmount = () => {
    const subtotal = parseFloat(orderData?.totalPrice || 0);
    const totalDeliveryFee = orderData?.fromCart ? getTotalDeliveryFee() : (deliveryPrice || 0);
    return subtotal + totalDeliveryFee;
  };

  // Helper function to get payment amount based on selected option
  const getPaymentAmount = () => {
    const totalAmount = getTotalAmount();
    if (paymentOption === '50') {
      return totalAmount * 0.5;
    }
    return totalAmount;
  };

  // Helper function to get remaining balance (for 50% payment)
  const getRemainingBalance = () => {
    if (paymentOption === '50') {
      return getTotalAmount() - getPaymentAmount();
    }
    return 0;
  };

  // Old fetchDeliveryPrice function removed - now using calculateDeliveryFees service

  const handleBack = () => {
    navigate(-1);
  };

  const handleNext = async () => {
    // Prevent double-clicking
    if (isPlacingOrder) {
      console.log('⚠️ Order placement already in progress, ignoring click');
      return;
    }

    try {
      setIsPlacingOrder(true);
      
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
      
      // Show order confirmation receipt first
      setShowReceipt(true);
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleReceiptClose = async () => {
    // Prevent double-clicking
    if (isConfirmingOrder) {
      console.log('⚠️ Order confirmation already in progress, ignoring click');
      return;
    }

    try {
      setIsConfirmingOrder(true);
      
      // Only save order to database if not already saved
      let orderIds;
      if (!savedOrderId) {
        console.log('💾 Saving order to database...');
        orderIds = await saveOrderToDatabase();
        setSavedOrderId(orderIds);
        console.log('✅ Order saved successfully:', orderIds);
      } else {
        console.log('⚠️ Order already saved, using existing savedOrderId');
        orderIds = savedOrderId;
      }
      
      // Clear cart if this was a cart checkout
      if (orderData?.fromCart) {
        clearCart();
      }
      
      setShowReceipt(false);
      
      // Extract order ID for navigation
      let firstOrderId;
      if (Array.isArray(orderIds) && orderIds.length > 0) {
        firstOrderId = orderIds[0]?.order_id;
      } else if (orderIds && typeof orderIds === 'object') {
        firstOrderId = orderIds.order_id;
      } else {
        firstOrderId = orderIds;
      }
      
      console.log('🔍 Extracted order ID:', firstOrderId, 'from orderIds:', orderIds);
      
      if (!firstOrderId) {
        console.error('❌ No order ID found! orderIds:', orderIds);
        alert('Failed to get order ID. Please try again.');
        return;
      }
      
      // Navigate to GCash payment page
      navigate(`/customer/gcash-account/${firstOrderId}`);
    } catch (error) {
      console.error('Error saving order:', error);
      setShowReceipt(false);
      
      // Show the actual error message from backend
      const errorMessage = error.message || 'Failed to save order. Please try again.';
      alert(errorMessage);
    } finally {
      setIsConfirmingOrder(false);
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
          
          // Calculate payment amount for this vendor (proportional if 50%)
          const vendorPaymentAmount = paymentOption === '50' ? vendorTotal * 0.5 : vendorTotal;
          
          const vendorOrderPayload = {
            customer_id: user.id,
            vendor_id: vendor.vendor_id,
            delivery_address: finalDeliveryAddress,
            delivery_datetime: mysqlDateTime,
            subtotal: vendorSubtotal,
            delivery_fee: vendorDeliveryFee,
            total_amount: vendorTotal,
            payment_amount: vendorPaymentAmount,
            status: 'pending',
            // Keep as 'unpaid' until payment is actually confirmed
            // 'partial' status will be set when payment is received
            payment_status: 'unpaid',
            items: vendorItems
          };
          
          console.log(`📦 Creating order for ${vendor.vendor_name}:`, vendorOrderPayload);
          
          try {
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
          } catch (axiosError) {
            // Extract error message from axios error
            let errorMsg = `Failed to create order for ${vendor.vendor_name}`;
            if (axiosError.response && axiosError.response.data) {
              errorMsg = `${vendor.vendor_name}: ${axiosError.response.data.error || axiosError.response.data.message || errorMsg}`;
            } else if (axiosError.message) {
              errorMsg = `${vendor.vendor_name}: ${axiosError.message}`;
            }
            throw new Error(errorMsg);
          }
        }
        
        console.log('🎉 All multi-vendor orders created successfully:', orderIds);
        return orderIds; // Return array of order IDs
        
      } else {
        // Single vendor order (direct from product page)
        console.log('🛍️ Creating single vendor order');
        
        const paymentAmount = getPaymentAmount();
        
        const orderPayload = {
          customer_id: user.id,
          vendor_id: orderData.vendorId,
          delivery_address: finalDeliveryAddress,
          delivery_datetime: mysqlDateTime,
          subtotal: parseFloat(orderData.totalPrice),
          delivery_fee: deliveryPrice || 0,
          total_amount: getTotalAmount(),
          payment_amount: paymentAmount,
          status: 'pending',
          // Keep as 'unpaid' until payment is actually confirmed
          // 'partial' status will be set when payment is received
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
      
      // Extract error message from axios error response
      let errorMessage = 'Failed to save order. Please try again.';
      
      if (error.response && error.response.data) {
        // Backend returned an error
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
        console.error('Backend error:', errorMessage);
      } else if (error.message) {
        // JavaScript error
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-4 sm:py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Checkout</h1>
          </div>

          {/* Main Checkout Card */}
          <div className="bg-sky-100 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
            {/* Back Button */}
            <button 
              onClick={handleBack}
              className="mb-4 sm:mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {/* Item Details */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Item Details</h2>
              
              {orderData?.fromCart && orderData?.items ? (
                // Cart checkout - show items grouped by vendor
                <div className="space-y-3 sm:space-y-4">
                  {groupedVendors.map((vendorGroup, vendorIndex) => (
                    <div key={vendorIndex} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 pb-2 border-b border-gray-200 space-y-2 sm:space-y-0">
                        <h3 className="text-base sm:text-lg font-semibold text-blue-600">{vendorGroup.vendor_name}</h3>
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
                          <div key={itemIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm bg-white rounded-lg p-3">
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
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
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
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Order Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Delivery Date & Time:</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">🕒</span>
                      <span className="font-medium text-gray-900 text-sm sm:text-base">
                        {deliveryDateTime || 'No delivery time set'}
                      </span>
                    </div>
                    {!deliveryDateTime && (
                      <p className="text-xs sm:text-sm text-red-600 mt-2">
                        ⚠️ No delivery time specified. Please go back and set a delivery schedule.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <label className="text-sm font-medium text-gray-600 w-full sm:w-32 mb-2 sm:mb-0">Location :</label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={deliveryAddress}
                      readOnly
                      placeholder={userAddress ? "Your saved address" : "No saved address - Please add an address in your profile"}
                      className="w-full px-3 sm:px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed shadow-sm text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {userAddress 
                        ? "Note: To change your delivery address, go to Address Settings in your profile"
                        : "No saved address found. Please add an address in your profile settings for faster checkout."
                      }
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <label className="text-sm font-medium text-gray-600 w-full sm:w-32 mb-2 sm:mb-0">Delivery :</label>
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
                                  setDeliveryCalculationComplete(false);
                                  setVendorDeliveryFees({});
                                  setAddressFetchStarted(false);
                                  // Trigger address fetch again
                                  setTimeout(() => {
                                    const userRaw = sessionStorage.getItem('user');
                                    if (userRaw) {
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

            {/* Payment Information */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Payment Information</h2>
              
              {/* Payment Option Selection */}
              <div className="mb-4 sm:mb-6">
                <label className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3 block">Payment Option:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('full')}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      paymentOption === 'full'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-sm sm:text-base font-semibold ${paymentOption === 'full' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Full Payment
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        Pay ₱{getTotalAmount().toFixed(2)}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentOption('50')}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      paymentOption === '50'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-sm sm:text-base font-semibold ${paymentOption === '50' ? 'text-blue-600' : 'text-gray-700'}`}>
                        50% Payment
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        Pay ₱{getPaymentAmount().toFixed(2)} now
                      </div>
                    </div>
                  </button>
                </div>
                {paymentOption === '50' && (
                  <div className="mt-2 sm:mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      <strong>Note:</strong> Remaining balance of ₱{getRemainingBalance().toFixed(2)} will be collected on delivery.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start">
                  <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 sm:ml-0">
                    <h3 className="text-sm sm:text-base font-medium text-blue-800 mb-2 sm:mb-0">GCash Payment Required</h3>
                    <div className="mt-2 space-y-1 sm:space-y-0">
                      <p className="text-xs sm:text-sm text-blue-700">• {paymentOption === '50' ? 'Pay 50% now via GCash to confirm your order' : 'Please proceed with full payment via GCash to confirm your order'}</p>
                      <p className="text-xs sm:text-sm text-blue-700">• Payment can be made immediately after placing your order</p>
                      <p className="text-xs sm:text-sm text-blue-700">• You'll receive a notification once payment is received</p>
                      {paymentOption === '50' && (
                        <p className="text-xs sm:text-sm text-blue-700">• Remaining balance (₱{getRemainingBalance().toFixed(2)}) due on delivery</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total and Action Button */}
            <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center justify-center sm:justify-end">
                <div className="text-center sm:text-right">
                  <div className="flex items-center justify-between sm:justify-end space-x-2 text-sm text-gray-600">
                    <span>Subtotal:</span>
                    <span>₱{orderData.totalPrice}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-2 text-sm text-gray-600">
                    <span>Delivery:</span>
                    <span>₱{orderData?.fromCart ? getTotalDeliveryFee().toFixed(2) : (deliveryPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-2 text-sm text-gray-600 border-t border-gray-300 pt-1 mt-1">
                    <span>Grand Total:</span>
                    <span>₱{getTotalAmount().toFixed(2)}</span>
                  </div>
                  {paymentOption === '50' && (
                    <div className="flex items-center justify-between sm:justify-end space-x-2 text-sm text-gray-600 border-t border-gray-300 pt-1 mt-1">
                      <span>Remaining Balance:</span>
                      <span>₱{getRemainingBalance().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between sm:justify-end space-x-2 text-base sm:text-lg font-bold text-blue-600 border-t border-gray-300 pt-1 mt-1">
                    <span>{paymentOption === '50' ? 'Amount to Pay Now:' : 'Estimated Total:'}</span>
                    <span>₱{paymentOption === '50' ? getPaymentAmount().toFixed(2) : getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleNext}
                disabled={isPlacingOrder}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  isPlacingOrder 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal for GCash Payment */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6" ref={receiptRef}>
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Order Confirmation</h2>
              </div>

              {/* Receipt Content */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                {/* Order Details */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Order Details</h3>
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
                          {paymentOption === '50' ? '50% Payment (₱' + getPaymentAmount().toFixed(2) + ')' : 'Full Payment'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> {paymentOption === '50' 
                          ? `Please proceed with 50% payment (₱${getPaymentAmount().toFixed(2)}) via GCash to confirm your order. Remaining balance of ₱${getRemainingBalance().toFixed(2)} will be collected on delivery.`
                          : 'Please proceed with payment via GCash to confirm your order. The vendor will start preparing once payment is received.'}
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
                        const vendorGroup = groupedVendors.find(vg => vg.vendor_id && vg.vendor_id.toString() === vendorId);
                        return (
                          <div key={vendorId} className="flex justify-between text-sm">
                            <span className="text-gray-600">{vendorGroup?.vendor_name || 'Unknown Vendor'} Delivery</span>
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
                      {paymentOption === '50' && (
                        <div className="flex justify-between text-sm border-t pt-2 mt-2">
                          <span className="text-gray-600">Remaining Balance:</span>
                          <span className="font-medium">₱{getRemainingBalance().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                        <span>{paymentOption === '50' ? 'Amount to Pay Now:' : 'Estimated Total:'}</span>
                        <span className="text-blue-600">₱{paymentOption === '50' ? getPaymentAmount().toFixed(2) : getTotalAmount().toFixed(2)}</span>
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
                    <p>• Your order has been placed successfully</p>
                    <p>• {paymentOption === '50' 
                      ? `Please proceed with 50% payment (₱${getPaymentAmount().toFixed(2)}) via GCash to confirm your order`
                      : 'Please proceed with payment via GCash to confirm your order'}</p>
                    <p>• You will receive a notification once payment is received</p>
                    {paymentOption === '50' && (
                      <p>• Remaining balance (₱{getRemainingBalance().toFixed(2)}) will be collected on delivery</p>
                    )}
                    <p>• The vendor will start preparing your order after payment confirmation</p>
                    <p>• Keep this confirmation for your records</p>
                  </div>
                </div>
              </div>

              {/* Order Confirmation */}
              <div className="space-y-4">
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={handleReceiptClose}
                    disabled={isConfirmingOrder}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                      isConfirmingOrder 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isConfirmingOrder ? 'Confirming...' : 'Confirm Order'}
                  </button>
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                  >
                    Edit Order
                  </button>
                </div>
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
                    navigate('/customer?view=settings&tab=addresses');
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


