import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  Star, 
  Gift,
  Receipt,
  CheckCircle,
  CreditCard,
  Calendar
} from 'lucide-react';

const SubscriptionManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState('vendors');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');

  useEffect(() => {
    fetchVendorSubscriptions();
    fetchTransactions();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiBase}/api/admin/subscription/transactions`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching subscription transactions:', error);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-6 sm:mt-8 lg:mt-12">Subscription Management</h1>
      </div>

      {/* Tabs */}
      <div className="space-y-3 sm:space-y-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('vendors')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'vendors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Vendor Subscriptions</span>
              <span className="sm:hidden">Vendors</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Subscription Plans</span>
              <span className="sm:hidden">Plans</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Transactions</span>
              <span className="sm:hidden">Transactions</span>
            </button>
          </nav>
        </div>

        {activeTab === 'vendors' && (
          <div className="bg-sky-100 rounded-lg shadow">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold">Vendor Subscriptions</h2>
            </div>
            <div className="p-3 sm:p-4 lg:p-6">
              {/* Search Box */}
              <div className="mb-4 sm:mb-6">
                <label htmlFor="vendor-search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Search by Vendor ID
                </label>
                <input
                  type="text"
                  id="vendor-search"
                  placeholder="Enter vendor ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <div className="space-y-3 sm:space-y-4">
                {(() => {
                  const filteredVendors = vendors.filter(vendor => {
                    if (!searchQuery.trim()) return true;
                    return vendor.vendor_id.toString().includes(searchQuery.trim());
                  });
                  
                  if (filteredVendors.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm sm:text-base">
                          {searchQuery.trim() 
                            ? `No vendors found with ID containing "${searchQuery}"`
                            : 'No vendors found'}
                        </p>
                      </div>
                    );
                  }
                  
                  return filteredVendors.map((vendor) => (
                  <div key={vendor.vendor_id} className="bg-white border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{vendor.store_name || 'Unnamed Store'}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{vendor.fname} {vendor.lname}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{vendor.email}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center space-x-2">
                            {getPlanIcon(vendor.subscription_plan)}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(vendor.subscription_plan)}`}>
                              {vendor.subscription_plan}
                            </span>
                          </div>
                          
                          <div className="text-xs sm:text-sm text-gray-600">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
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
                          className="block w-full sm:w-32 px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="free">Free</option>
                          <option value="professional">Professional</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Free Plan */}
              <div className="bg-sky-100 rounded-lg shadow">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center space-x-2">
                    <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Free Plan</span>
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">₱0<span className="text-sm sm:text-lg font-normal">/month</span></div>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Up to 5 flavors</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Up to 5 drums</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>30 orders/month</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Basic analytics</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Professional Plan */}
              <div className="bg-sky-100 rounded-lg shadow border-blue-200">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center space-x-2">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span>Professional Plan</span>
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">₱499<span className="text-sm sm:text-lg font-normal">/month</span></div>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Up to 15 flavors</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Up to 15 drums</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>70 orders/month</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Premium Plan */}
              <div className="bg-sky-100 rounded-lg shadow border-purple-200">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center space-x-2">
                    <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    <span>Premium Plan</span>
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">₱999<span className="text-sm sm:text-lg font-normal">/month</span></div>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Unlimited flavors</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Unlimited drums</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>Unlimited orders</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span>All Professional features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-sky-100 rounded-lg shadow">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold flex items-center space-x-2">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Subscription Transactions</span>
              </h2>
            </div>
            <div className="p-3 sm:p-4 lg:p-6">
              {/* Search Box */}
              <div className="mb-4 sm:mb-6">
                <label htmlFor="transaction-search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Search by Transaction ID
                </label>
                <input
                  type="text"
                  id="transaction-search"
                  placeholder="Enter transaction ID..."
                  value={transactionSearchQuery}
                  onChange={(e) => setTransactionSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              {(() => {
                const filteredTransactions = transactions.filter(transaction => {
                  if (!transactionSearchQuery.trim()) return true;
                  return transaction.payment_id.toString().includes(transactionSearchQuery.trim());
                });

                if (filteredTransactions.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm sm:text-base">
                        {transactionSearchQuery.trim() 
                          ? `No transactions found with ID containing "${transactionSearchQuery}"`
                          : 'No transactions found'}
                      </p>
                    </div>
                  );
                }

                return (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.payment_id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              #{transaction.payment_id}
                            </div>
                            {transaction.xendit_invoice_id && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {transaction.xendit_invoice_id.substring(0, 20)}...
                              </div>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {transaction.store_name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.fname} {transaction.lname}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {transaction.email}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getPlanIcon(transaction.plan_name)}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(transaction.plan_name)}`}>
                                {transaction.plan_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-bold text-gray-900">
                              ₱{parseFloat(transaction.amount).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                              <span className="text-xs sm:text-sm text-gray-600">
                                {transaction.payment_method || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.payment_status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : transaction.payment_status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.payment_status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                              <div className="text-xs sm:text-sm text-gray-600">
                                {transaction.payment_date 
                                  ? new Date(transaction.payment_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : new Date(transaction.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                }
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.payment_date 
                                ? new Date(transaction.payment_date).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : new Date(transaction.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;