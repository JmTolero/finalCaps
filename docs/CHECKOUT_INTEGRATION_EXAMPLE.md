# How to Integrate Integrated GCash Payment into Checkout

## Simple Integration Guide

### Option 1: Add Button to Checkout Success Page

After customer completes checkout, show payment options:

```jsx
// In your Checkout.jsx or OrderConfirmation.jsx

import { useNavigate } from 'react-router-dom';

const YourCheckoutComponent = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState(null);

  // After order is created
  const handleOrderCreated = (newOrderId) => {
    setOrderId(newOrderId);
  };

  return (
    <div>
      {/* Your existing checkout form */}
      
      {orderId && (
        <div className="payment-options">
          <h3>Choose Payment Method</h3>
          
          {/* NEW: Integrated GCash Payment */}
          <button
            onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            <span className="text-2xl mr-2">📱</span>
            Pay with GCash (Instant Verification)
          </button>
          
          {/* EXISTING: Manual GCash Payment */}
          <button
            onClick={() => navigate(`/customer/gcash-account/${orderId}`)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg"
          >
            Pay with GCash (Manual Upload)
          </button>
          
          {/* Other payment methods */}
        </div>
      )}
    </div>
  );
};
```

---

### Option 2: Replace Existing GCash Flow

Simply replace the old GCash payment route:

```jsx
// BEFORE (Old manual system)
<button onClick={() => navigate(`/customer/gcash-account/${orderId}`)}>
  Pay with GCash
</button>

// AFTER (New integrated system)
<button onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}`)}>
  Pay with GCash
</button>
```

That's it! The new system handles everything automatically.

---

### Option 3: Let Customer Choose

Give customers both options:

```jsx
<div className="payment-methods">
  <h3>Select Payment Method</h3>
  
  {/* Recommended: Integrated (highlighted) */}
  <div className="payment-option recommended">
    <div className="badge">✨ Recommended</div>
    <h4>Instant GCash Payment</h4>
    <ul>
      <li>✅ Opens GCash app automatically</li>
      <li>✅ Instant confirmation</li>
      <li>✅ No screenshot needed</li>
    </ul>
    <button onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}`)}>
      Choose This
    </button>
  </div>
  
  {/* Alternative: Manual */}
  <div className="payment-option">
    <h4>Manual GCash Payment</h4>
    <ul>
      <li>• Scan vendor's QR code</li>
      <li>• Upload payment screenshot</li>
      <li>• Wait for vendor verification</li>
    </ul>
    <button onClick={() => navigate(`/customer/gcash-account/${orderId}`)}>
      Choose This
    </button>
  </div>
</div>
```

---

### Full Example: Checkout Flow

```jsx
// Complete checkout flow with integrated GCash

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Checkout = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);

  const handlePlaceOrder = async (orderData) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Create order
      const response = await axios.post(`${apiBase}/api/orders`, orderData);
      
      if (response.data.success) {
        const newOrderId = response.data.order_id;
        setOrderId(newOrderId);
        setOrderCreated(true);
      }
    } catch (error) {
      console.error('Order creation error:', error);
    }
  };

  if (orderCreated) {
    return (
      <div className="order-success">
        <h2>✅ Order Placed Successfully!</h2>
        <p>Order ID: #{orderId}</p>
        
        <div className="payment-section">
          <h3>Complete Payment</h3>
          
          {/* Integrated GCash Payment - Primary option */}
          <div className="payment-card primary">
            <span className="badge">✨ Fastest</span>
            <h4>Pay with GCash</h4>
            <p>Instant verification • No screenshot upload</p>
            <ul className="benefits">
              <li>📱 Opens GCash app automatically on mobile</li>
              <li>⚡ Order confirmed instantly after payment</li>
              <li>🔒 Secure payment via Xendit</li>
            </ul>
            <button
              onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}`)}
              className="btn-primary"
            >
              Pay Now with GCash
            </button>
          </div>
          
          {/* Alternative options */}
          <div className="alternative-payments">
            <button
              onClick={() => navigate('/customer?view=orders')}
              className="btn-secondary"
            >
              Pay Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Your checkout form */}
      <form onSubmit={handlePlaceOrder}>
        {/* ... form fields ... */}
        <button type="submit">Place Order</button>
      </form>
    </div>
  );
};

export default Checkout;
```

---

### Styling Example

```css
/* Add to your CSS file */

.payment-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  transition: all 0.3s;
}

.payment-card.primary {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.payment-card .badge {
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}

.payment-card h4 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.payment-card .benefits {
  list-style: none;
  padding: 0;
  margin: 16px 0;
}

.payment-card .benefits li {
  padding: 8px 0;
  color: #4b5563;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}
```

---

### Mobile-First Design

For better mobile experience:

```jsx
const PaymentOptions = ({ orderId }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  return (
    <div className="payment-options">
      {isMobile ? (
        // Mobile: Show prominent GCash button
        <div className="mobile-payment">
          <button
            onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}`)}
            className="gcash-button-mobile"
          >
            <span className="icon">📱</span>
            <div>
              <div className="title">Pay with GCash</div>
              <div className="subtitle">Opens app instantly</div>
            </div>
          </button>
        </div>
      ) : (
        // Desktop: Show card with QR code preview
        <div className="desktop-payment">
          <div className="payment-card">
            <h4>Pay with GCash</h4>
            <p>Scan QR code with your phone</p>
            <button onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}`)}>
              Show QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### Analytics Integration

Track payment method selection:

```jsx
const handlePaymentMethodClick = (method) => {
  // Track with your analytics
  if (window.gtag) {
    window.gtag('event', 'select_payment_method', {
      payment_method: method,
      order_id: orderId
    });
  }
  
  // Navigate to payment
  if (method === 'integrated_gcash') {
    navigate(`/customer/integrated-gcash-payment/${orderId}`);
  } else if (method === 'manual_gcash') {
    navigate(`/customer/gcash-account/${orderId}`);
  }
};
```

---

### Error Handling

Handle cases where vendor hasn't set up GCash:

```jsx
const handleIntegratedPayment = async () => {
  try {
    // Check if vendor has GCash set up
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
    const response = await axios.get(
      `${apiBase}/api/vendor/${vendorId}/qr-code`
    );
    
    if (response.data.success) {
      // Vendor has GCash, proceed
      navigate(`/customer/integrated-gcash-payment/${orderId}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      // Vendor doesn't have GCash set up
      alert('This vendor has not set up GCash payment yet. Please use another payment method.');
    }
  }
};
```

---

### Quick Start: Minimal Integration

**Simplest possible integration (3 lines of code):**

```jsx
// In your checkout success page, add this button:
<button onClick={() => navigate(`/customer/integrated-gcash-payment/${orderId}`)}>
  Pay with GCash
</button>
```

That's it! The integrated payment page handles everything else.

---

### Testing Your Integration

1. **Create test order**
2. **Click your new button**
3. **Should navigate to**: `/customer/integrated-gcash-payment/{orderId}`
4. **Should see**: Payment interface with mobile/desktop detection
5. **Test**: Complete payment flow

---

### Summary

**Minimum required:**
- 1 button
- 1 navigate call
- That's it!

**Recommended:**
- Style the button nicely
- Add mobile detection
- Track analytics
- Handle errors

**The payment page handles:**
- ✅ Vendor GCash lookup
- ✅ Xendit invoice creation
- ✅ Mobile/desktop detection
- ✅ QR code display
- ✅ Payment verification
- ✅ Order confirmation
- ✅ Success/error handling

You just need to send customers there! 🚀

