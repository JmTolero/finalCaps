import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Star, 
  Gift,
  CheckCircle,
  AlertCircle,
  CreditCard,
  DollarSign
} from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';

const VendorSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchVendorSubscription();
  }, []);

  const fetchVendorSubscription = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const user = JSON.parse(sessionStorage.getItem('user'));
      
      if (!user || !user.id) {
        console.error('No user ID found');
        return;
      }

      // Get the current vendor info using the correct endpoint and header
      const vendorResponse = await fetch(`${apiBase}/api/vendor/current`, {
        headers: {
          'x-user-id': user.id
        }
      });
      const vendorData = await vendorResponse.json();
      
      if (!vendorData.success || !vendorData.vendor?.vendor_id) {
        console.error('No vendor ID found for user');
        return;
      }

      const vendorId = vendorData.vendor.vendor_id;
      console.log('Found vendor ID:', vendorId);

      const response = await fetch(`${apiBase}/api/admin/subscription/vendor/${vendorId}`);
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching vendor subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeRequest = (plan) => {
    console.log('🔄 Frontend: Upgrade requested for plan:', plan);
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setUpgrading(true);
    try {
      // Create subscription payment via Xendit
      const paymentData = {
        plan_name: selectedPlan,
        amount: getPlanPrice(selectedPlan),
        billing_cycle: 'monthly'
      };

      console.log('🔄 Frontend: Starting payment process...', paymentData);
      const response = await subscriptionService.createSubscriptionPayment(paymentData);
      console.log('✅ Frontend: Payment response received:', response);
      
      if (response.success) {
        if (response.data.test_mode) {
          console.log('✅ Test mode payment successful, redirecting to success page');
          // Add a small delay to ensure backend processing is complete
          setTimeout(() => {
            window.location.href = '/vendor/subscription/success?test_mode=true';
          }, 1000);
        } else {
          console.log('✅ Production payment successful, redirecting to Xendit');
          // Redirect to Xendit payment page
          window.location.href = response.data.invoice_url;
        }
      } else {
        alert('Payment creation failed: ' + response.error);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment processing failed: ' + error.message);
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'free': return <Gift className="h-5 w-5 sm:h-6 sm:w-6" />;
      case 'professional': return <Star className="h-5 w-5 sm:h-6 sm:w-6" />;
      case 'premium': return <Crown className="h-5 w-5 sm:h-6 sm:w-6" />;
      default: return <Gift className="h-5 w-5 sm:h-6 sm:w-6" />;
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (current, limit) => {
    if (limit === -1) return 'text-green-600';
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPlanPrice = (plan) => {
    switch (plan) {
      case 'free': return 0;
      case 'professional': return 499;
      case 'premium': return 999;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 px-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-6 sm:py-8 px-2">
        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Subscription Not Found</h2>
        <p className="text-sm sm:text-base text-gray-600">Unable to load your subscription information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">My Subscription</h1>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6">
            {getPlanIcon(subscription.subscription_plan)}
          </div>
          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPlanColor(subscription.subscription_plan)}`}>
            {subscription.subscription_plan.charAt(0).toUpperCase() + subscription.subscription_plan.slice(1)} Plan
          </span>
        </div>
      </div>

      {/* Current Plan Overview */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Current Plan Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center pb-3 sm:pb-0 border-b md:border-b-0 border-gray-200 md:border-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              ₱{getPlanPrice(subscription.subscription_plan)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">per month</div>
          </div>
          
          <div className="space-y-2 py-3 sm:py-0 md:py-0 border-b md:border-b-0 border-gray-200 md:border-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Flavors:</span>
              <span className={`text-xs sm:text-sm font-medium ${getUsageColor(subscription.current_usage.flavors, subscription.flavor_limit)}`}>
                {subscription.current_usage.flavors}/{subscription.flavor_limit === -1 ? '∞' : subscription.flavor_limit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Drums:</span>
              <span className={`text-xs sm:text-sm font-medium ${getUsageColor(subscription.current_usage.drums, subscription.drum_limit)}`}>
                {subscription.current_usage.drums}/{subscription.drum_limit === -1 ? '∞' : subscription.drum_limit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Orders this month:</span>
              <span className={`text-xs sm:text-sm font-medium ${getUsageColor(subscription.current_usage.orders_this_month, subscription.order_limit)}`}>
                {subscription.current_usage.orders_this_month}/{subscription.order_limit === -1 ? '∞' : subscription.order_limit}
              </span>
            </div>
          </div>

          <div className="text-center md:text-right pt-3 sm:pt-0 md:pt-0">
            <div className="text-xs sm:text-sm text-gray-600">Next billing:</div>
            <div className="text-xs sm:text-sm font-medium">
              {subscription.subscription_end_date ? 
                new Date(subscription.subscription_end_date).toLocaleDateString() : 
                'N/A'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Upgrade Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Professional Plan */}
          {subscription.subscription_plan !== 'professional' && subscription.subscription_plan !== 'premium' && (
            <div className="border border-blue-200 rounded-lg p-4 sm:p-5 lg:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold">Professional Plan</h3>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-3 sm:mb-4">
                ₱499<span className="text-base sm:text-lg font-normal">/month</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm mb-4 sm:mb-6">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Up to 15 flavors</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Up to 15 drums</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>70 orders/month</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => handleUpgradeRequest('professional')}
                className="w-full bg-blue-600 text-white py-2 sm:py-2.5 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
              >
                Upgrade to Professional
              </button>
            </div>
          )}

          {/* Premium Plan */}
          {subscription.subscription_plan !== 'premium' && (
            <div className="border border-purple-200 rounded-lg p-4 sm:p-5 lg:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold">Premium Plan</h3>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-3 sm:mb-4">
                ₱999<span className="text-base sm:text-lg font-normal">/month</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm mb-4 sm:mb-6">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Unlimited flavors</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Unlimited drums</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Unlimited orders</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>All Professional features</span>
                </li>
              </ul>
              <button
                onClick={() => handleUpgradeRequest('premium')}
                className="w-full bg-purple-600 text-white py-2 sm:py-2.5 px-4 rounded-md hover:bg-purple-700 transition-colors text-sm sm:text-base font-medium"
              >
                Upgrade to Premium
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold">Complete Payment</h3>
            </div>
            
            <div className="mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Upgrading to:</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <span className="font-medium text-sm sm:text-base">{selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan</span>
                <span className="font-bold text-blue-600 text-sm sm:text-base">₱{getPlanPrice(selectedPlan)}/month</span>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Payment method:</p>
              <div className="w-full p-2 sm:p-3 border border-gray-300 rounded-md bg-gray-50">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-xs sm:text-sm">G</span>
                  </div>
                  <span className="font-medium text-sm sm:text-base">GCash</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You will be redirected to GCash to complete your payment securely.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 sm:py-2.5 px-4 border border-gray-300 rounded-md hover:bg-gray-50 text-sm sm:text-base font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('🔄 Frontend: Pay Now button clicked');
                  processPayment();
                }}
                disabled={upgrading}
                className="flex-1 bg-blue-600 text-white py-2 sm:py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base font-medium transition-colors"
              >
                {upgrading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSubscription;
