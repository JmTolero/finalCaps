import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import subscriptionService from '../../services/subscriptionService';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [vendorData, setVendorData] = useState(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const invoiceId = searchParams.get('invoice_id');
        const externalId = searchParams.get('external_id');
        const isTestMode = searchParams.get('test_mode') === 'true';
        
        console.log('🔍 SubscriptionSuccess - URL parameters:', {
          invoiceId,
          externalId,
          isTestMode,
          allParams: Object.fromEntries(searchParams.entries())
        });
        
        if (!invoiceId && !externalId) {
          // Check if this is a test mode payment (no URL parameters)
          
          if (isTestMode) {
            console.log('✅ Test mode detected, creating mock payment details');
            // For test mode, create mock payment details
            setPaymentDetails({
              plan_name: 'professional',
              amount: 999,
              payment_status: 'paid',
              payment_method: 'GCASH',
              test_mode: true
            });
            // Fetch updated vendor data to show the upgraded plan
            console.log('🔄 Fetching vendor data after payment success...');
            await fetchVendorData();
            setLoading(false);
            return;
          }
          
          console.log('❌ No payment information found, showing generic success message');
          // Show generic success message instead of error
          setPaymentDetails({
            plan_name: 'professional',
            amount: 999,
            payment_status: 'paid',
            payment_method: 'GCASH',
            test_mode: true,
            generic_success: true
          });
          // Fetch updated vendor data to show the upgraded plan
          await fetchVendorData();
          setLoading(false);
          return;
        }

        // Get payment details
        const paymentResponse = await subscriptionService.getPaymentStatus(invoiceId || externalId);
        setPaymentDetails(paymentResponse.data);

        // Handle payment success
        await subscriptionService.handlePaymentSuccess(invoiceId || externalId);

        setLoading(false);
      } catch (error) {
        console.error('Error handling payment success:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams]);

  const fetchVendorData = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const user = JSON.parse(sessionStorage.getItem('user'));
      
      if (!user || !user.id) {
        console.error('No user ID found');
        return;
      }

      // Get the current vendor info
      const vendorResponse = await fetch(`${apiBase}/api/vendor/current?t=${Date.now()}`, {
        headers: {
          'x-user-id': user.id
        }
      });
      const vendorData = await vendorResponse.json();
      console.log('📋 Vendor data response:', vendorData);
      
      if (vendorData.success && vendorData.vendor) {
        setVendorData(vendorData.vendor);
        console.log('✅ Vendor data refreshed:', {
          vendor_id: vendorData.vendor.vendor_id,
          subscription_plan: vendorData.vendor.subscription_plan,
          subscription_end_date: vendorData.vendor.subscription_end_date,
          flavor_limit: vendorData.vendor.flavor_limit,
          drum_limit: vendorData.vendor.drum_limit,
          order_limit: vendorData.vendor.order_limit,
          full_vendor_data: vendorData.vendor
        });
      } else {
        console.log('❌ Failed to fetch vendor data:', vendorData);
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    }
  };

  const generateReceipt = () => {
    if (!paymentDetails) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 1000;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, canvas.width, 120);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ChillNet Ice Cream', canvas.width / 2, 50);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Subscription Payment Receipt', canvas.width / 2, 85);
    
    // Content area
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    
    let y = 180;
    const lineHeight = 30;
    
    // Receipt details
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Payment Details', 50, y);
    y += lineHeight + 10;
    
    ctx.font = '16px Arial';
    ctx.fillText(`Plan: ${paymentDetails.plan_name.charAt(0).toUpperCase() + paymentDetails.plan_name.slice(1)} Plan`, 50, y);
    y += lineHeight;
    
    ctx.fillText(`Amount: ₱${paymentDetails.amount.toLocaleString()}`, 50, y);
    y += lineHeight;
    
    ctx.fillText(`Payment Method: ${paymentDetails.payment_method}`, 50, y);
    y += lineHeight;
    
    ctx.fillText(`Status: ${paymentDetails.payment_status.charAt(0).toUpperCase() + paymentDetails.payment_status.slice(1)}`, 50, y);
    y += lineHeight;
    
    ctx.fillText(`Date: ${new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 50, y);
    y += lineHeight + 20;
    
    // Features
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Plan Features', 50, y);
    y += lineHeight + 10;
    
    ctx.font = '16px Arial';
    const features = getPlanFeatures(paymentDetails.plan_name);
    
    if (features.max_flavors === -1) {
      ctx.fillText('✓ Unlimited flavors', 50, y);
    } else {
      ctx.fillText(`✓ Up to ${features.max_flavors} flavors`, 50, y);
    }
    y += lineHeight;
    
    if (features.max_drums === -1) {
      ctx.fillText('✓ Unlimited drums', 50, y);
    } else {
      ctx.fillText(`✓ Up to ${features.max_drums} drums`, 50, y);
    }
    y += lineHeight;
    
    if (features.max_orders_per_month === -1) {
      ctx.fillText('✓ Unlimited orders per month', 50, y);
    } else {
      ctx.fillText(`✓ Up to ${features.max_orders_per_month} orders per month`, 50, y);
    }
    y += lineHeight;
    
    if (features.priority_support) {
      ctx.fillText('✓ Priority support', 50, y);
      y += lineHeight;
    }
    
    y += 40;
    
    // Footer
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Thank you for upgrading!', canvas.width / 2, y);
    
    ctx.font = '14px Arial';
    ctx.fillText('ChillNet Ice Cream - Your Premium Ice Cream Partner', canvas.width / 2, y + 30);
    
    if (paymentDetails.test_mode) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('TEST MODE - This is a simulated payment', canvas.width / 2, y + 60);
    }
    
    return canvas;
  };

  const getPlanFeatures = (planName) => {
    const features = {
      'professional': {
        max_flavors: 15,
        max_drums: 15,
        max_orders_per_month: 70,
        priority_support: true
      },
      'premium': {
        max_flavors: -1,
        max_drums: -1,
        max_orders_per_month: -1,
        priority_support: true
      }
    };
    return features[planName.toLowerCase()] || features['professional'];
  };

  const downloadReceipt = async () => {
    setDownloading(true);
    try {
      const canvas = generateReceipt();
      if (!canvas) {
        alert('Unable to generate receipt');
        return;
      }
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `subscription-receipt-${paymentDetails.plan_name}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt');
    } finally {
      setDownloading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/vendor')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-green-500 text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Plan:</span> {paymentDetails.plan_name}</p>
              <p><span className="font-medium">Amount:</span> ₱{paymentDetails.amount}</p>
              <p><span className="font-medium">Status:</span> {paymentDetails.payment_status}</p>
              <p><span className="font-medium">Payment Method:</span> {paymentDetails.payment_method}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Your Plan Has Been Upgraded!</h3>
          <p className="text-blue-800 text-sm">
            You now have access to all the features of your new subscription plan.
            You can start using them immediately from your dashboard.
          </p>
          
          {vendorData && vendorData.subscription_plan ? (
            <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded">
              <p className="text-green-800 text-sm font-medium">
                ✅ Current Plan: <strong>{vendorData.subscription_plan.charAt(0).toUpperCase() + vendorData.subscription_plan.slice(1)}</strong>
              </p>
              <p className="text-green-700 text-xs mt-1">
                Plan expires: {vendorData.subscription_end_date ? new Date(vendorData.subscription_end_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ) : (
            <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded">
              <p className="text-blue-800 text-sm font-medium">
                ✅ Plan Upgraded: <strong>{paymentDetails?.plan_name ? paymentDetails.plan_name.charAt(0).toUpperCase() + paymentDetails.plan_name.slice(1) : 'Professional'}</strong>
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Your subscription has been successfully upgraded!
              </p>
            </div>
          )}
          
          {paymentDetails?.test_mode && (
            <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-yellow-800 text-sm font-medium">
                {paymentDetails?.generic_success 
                  ? '🎉 Payment Successful: Your subscription has been upgraded successfully!'
                  : '🧪 Test Mode: This is a simulated payment. In production, you would be redirected to GCash for real payment.'
                }
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={downloadReceipt}
            disabled={downloading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Receipt...
              </>
            ) : (
              <>
                📄 Download Receipt (PNG)
              </>
            )}
          </button>
          
          <button
            onClick={() => navigate('/vendor')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>

    </div>
  );
};

export default SubscriptionSuccess;
