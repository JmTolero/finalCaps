import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Crown, 
  Star, 
  Gift,
  CheckCircle
} from 'lucide-react';

const SubscriptionManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState('vendors');

  useEffect(() => {
    fetchVendorSubscriptions();
    fetchRevenue();
  }, []);

  const fetchVendorSubscriptions = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiBase}/api/admin/subscription/vendors`);
      const data = await response.json();
      if (data.success) {
        setVendors(data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendor subscriptions:', error);
    }
  };

  const fetchRevenue = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiBase}/api/admin/subscription/revenue`);
      const data = await response.json();
      if (data.success) {
        setRevenue(data.revenue_summary);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVendorSubscription = async (vendorId, newPlan) => {
    setUpdating(vendorId);
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiBase}/api/admin/subscription/vendor/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription_plan: newPlan }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setVendors(prev => prev.map(vendor => 
          vendor.vendor_id === vendorId 
            ? { ...vendor, subscription_plan: newPlan }
            : vendor
        ));
        // Refresh revenue data
        fetchRevenue();
      } else {
        alert('Failed to update subscription: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Error updating subscription');
    } finally {
      setUpdating(null);
    }
  };

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'free': return <Gift className="h-4 w-4" />;
      case 'professional': return <Star className="h-4 w-4" />;
      case 'premium': return <Crown className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
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
    if (limit === -1) return 'text-green-600'; // unlimited
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold mt-12">Subscription Management</h1>
      </div>

      {/* Revenue Overview */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">₱{revenue.total_monthly_revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold">{revenue.total_vendors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Professional</p>
                <p className="text-2xl font-bold">
                  {revenue.plans.find(p => p.subscription_plan === 'professional')?.vendor_count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Premium</p>
                <p className="text-2xl font-bold">
                  {revenue.plans.find(p => p.subscription_plan === 'premium')?.vendor_count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('vendors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vendors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vendor Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscription Plans
            </button>
          </nav>
        </div>

        {activeTab === 'vendors' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Vendor Subscriptions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div key={vendor.vendor_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{vendor.store_name || 'Unnamed Store'}</h3>
                          <p className="text-sm text-gray-600">{vendor.fname} {vendor.lname}</p>
                          <p className="text-sm text-gray-500">{vendor.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {getPlanIcon(vendor.subscription_plan)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(vendor.subscription_plan)}`}>
                              {vendor.subscription_plan}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="flex items-center space-x-4">
                              <span className={getUsageColor(vendor.current_usage.flavors, vendor.flavor_limit)}>
                                Flavors: {vendor.current_usage.flavors}/{vendor.flavor_limit === -1 ? '∞' : vendor.flavor_limit}
                              </span>
                              <span className={getUsageColor(vendor.current_usage.orders_this_month, vendor.order_limit)}>
                                Orders: {vendor.current_usage.orders_this_month}/{vendor.order_limit === -1 ? '∞' : vendor.order_limit}
                              </span>
                            </div>
                          </div>
                        </div>

                        <select
                          value={vendor.subscription_plan}
                          onChange={(e) => updateVendorSubscription(vendor.vendor_id, e.target.value)}
                          disabled={updating === vendor.vendor_id}
                          className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="free">Free</option>
                          <option value="professional">Professional</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Gift className="h-5 w-5" />
                    <span>Free Plan</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-bold mb-4">₱0<span className="text-lg font-normal">/month</span></div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Up to 5 flavors</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Up to 5 drums</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>50 orders/month</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Basic analytics</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Professional Plan */}
              <div className="bg-white rounded-lg shadow border-blue-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Star className="h-5 w-5 text-blue-600" />
                    <span>Professional Plan</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-bold mb-4">₱999<span className="text-lg font-normal">/month</span></div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Up to 15 flavors</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Up to 15 drums</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>200 orders/month</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Premium Plan */}
              <div className="bg-white rounded-lg shadow border-purple-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span>Premium Plan</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-bold mb-4">₱1,999<span className="text-lg font-normal">/month</span></div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Unlimited flavors</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Unlimited drums</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Unlimited orders</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>All Professional features</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Dedicated account manager</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;