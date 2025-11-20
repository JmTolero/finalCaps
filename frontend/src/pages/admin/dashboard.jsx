import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

//images import

import imgTotalUser from '../../assets/images/t-user.png';
import imgTotalVendor from '../../assets/images/t-vendor.png';
import imgTotalOrder from '../../assets/images/t-order.png';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const PLAN_COLORS = {
  free: '#94A3B8',
  professional: '#0088FE',
  premium: '#FFD700'
};

export const AdminDashboard = () => {

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalVendors, setTotalVendor] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0)
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Subscription statistics
  const [subscriptionRevenue, setSubscriptionRevenue] = useState(0);
  const [revenueByPlan, setRevenueByPlan] = useState([]);
  const [vendorPlanDist, setVendorPlanDist] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  useEffect(()=>{
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
    
    const fetchTotal = async () => {

      try{
        const res = await axios.get(`${apiBase}/api/admin/total`);
        setTotalUsers(res.data.totalUsers);
        setTotalVendor(res.data.totalVendors);
        setTotalOrders(res.data.totalOrders);
      }catch(err){
        console.log(err);
      }
      
    }
    fetchTotal();

    const fetchSubscriptionStats = async () => {
      try{
        const res = await axios.get(`${apiBase}/api/admin/statistics/subscription`);
        if (res.data.success) {
          const data = res.data.data;
          
          // Set total subscription revenue
          setSubscriptionRevenue(data.overview.totalSubscriptionRevenue || 0);
          
          // Format revenue by plan
          const planData = data.revenueByPlan.map(item => ({
            name: item.plan_name.charAt(0).toUpperCase() + item.plan_name.slice(1),
            revenue: parseFloat(item.totalRevenue),
            subscriptions: item.subscriptionCount
          }));
          setRevenueByPlan(planData);
          
          // Format vendor plan distribution
          const vendorData = data.vendorSubscriptionStatus.map(item => ({
            name: (item.plan || 'Free').charAt(0).toUpperCase() + (item.plan || 'free').slice(1),
            value: item.vendorCount
          }));
          setVendorPlanDist(vendorData);
          
          // Format monthly revenue (last 6 months)
          const monthlyData = data.monthlyRevenue.map(item => ({
            month: item.month,
            revenue: parseFloat(item.revenue)
          }));
          setMonthlyRevenue(monthlyData);
        }
      }catch(err){
        console.log('Error fetching subscription stats:', err);
      }
    }
    fetchSubscriptionStats();

    const fetchOrderRecords = async () => {
      try{
        setLoading(true);
        const res = await axios.get(`${apiBase}/api/orders/admin/all`);
        console.log('Order records response:', res.data);
        
        if (res.data.success) {
          console.log('Number of orders:', res.data.orders?.length || 0);
          setOrders(res.data.orders || []);
          setFilteredOrders(res.data.orders || []);
          setError(null);
        } else {
          setError('Failed to fetch order records: ' + res.data.error);
          setOrders([]);
          setFilteredOrders([]);
        }
      }catch(err){
        console.log('Error fetching orders:', err);
        setError('Failed to fetch order records: ' + (err.response?.data?.error || err.message));
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrderRecords();
  },[])

  // Filter orders based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.order_id.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  return (
    <>
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10 min-h-screen">

        {/* Page Title */}
        <div className="mb-3 sm:mb-4 lg:mb-6 mt-4 sm:mt-6 lg:mt-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3 lg:gap-4">

          <div className="bg-[#D4F6FF] h-20 sm:h-24 lg:h-28 rounded-lg sm:rounded-xl flex flex-col justify-center px-3 sm:px-3 lg:px-4">
            <h3 className="text-xs sm:text-xs lg:text-sm font-semibold text-left mb-1">Total Users</h3>
            <div className="flex justify-between items-center">
              <img src={imgTotalUser} alt="Total Users" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              <div className="text-xl sm:text-lg lg:text-2xl font-bold text-[#26A0FE]">{totalUsers.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-[#D4F6FF] h-20 sm:h-24 lg:h-28 rounded-lg sm:rounded-xl flex flex-col justify-center px-3 sm:px-3 lg:px-4">
            <h3 className="text-xs sm:text-xs lg:text-sm font-semibold text-left mb-1">Total Vendors</h3>
            <div className="flex justify-between items-center">
              <img src={imgTotalVendor} alt="Total Vendors" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              <div className="text-xl sm:text-lg lg:text-2xl font-bold text-[#26A0FE]">{totalVendors.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-[#D4F6FF] h-20 sm:h-24 lg:h-28 rounded-lg sm:rounded-xl flex flex-col justify-center px-3 sm:px-3 lg:px-4">
            <h3 className="text-xs sm:text-xs lg:text-sm font-semibold text-left mb-1">Total Orders</h3>
            <div className="flex justify-between items-center">
              <img src={imgTotalOrder} alt="Total Orders" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              <div className="text-xl sm:text-lg lg:text-2xl font-bold text-[#26A0FE]">{totalOrders.toLocaleString()}</div>
            </div>
          </div>

        </div>

        {/* Subscription Statistics Section */}
        <div className="mt-6 sm:mt-8 lg:mt-10">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Subscription Statistics</h2>
          
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 sm:p-4 lg:p-6 rounded-lg shadow-lg mb-4 sm:mb-6">
            <h3 className="text-white text-xs sm:text-sm lg:text-base opacity-90 mb-1 sm:mb-2">Total Subscription Revenue</h3>
            <div className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold">₱{parseFloat(subscriptionRevenue).toLocaleString()}</div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            
            {/* Revenue by Plan Chart */}
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow overflow-hidden">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-3 sm:mb-4 text-gray-800">Revenue by Plan</h3>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                  <BarChart data={revenueByPlan}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      className="text-xs sm:text-sm"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-xs sm:text-sm"
                    />
                    <Tooltip 
                      formatter={(value) => `₱${value.toLocaleString()}`}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue (₱)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vendor Plan Distribution Chart */}
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow overflow-hidden">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-3 sm:mb-4 text-gray-800">Vendor Plan Distribution</h3>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                  <PieChart>
                    <Pie
                      data={vendorPlanDist}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => {
                        // Shorter labels on mobile
                        const shortName = window.innerWidth < 640 ? name.substring(0, 4) : name;
                        return `${shortName}: ${value}`;
                      }}
                      outerRadius={window.innerWidth < 640 ? 60 : 80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {vendorPlanDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Revenue Trend */}
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow lg:col-span-2 overflow-hidden">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-3 sm:mb-4 text-gray-800">Monthly Revenue Trend</h3>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11 }}
                      angle={window.innerWidth < 640 ? -45 : 0}
                      textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                      height={window.innerWidth < 640 ? 60 : 30}
                      className="text-xs sm:text-sm"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      className="text-xs sm:text-sm"
                    />
                    <Tooltip 
                      formatter={(value) => `₱${value.toLocaleString()}`}
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      iconSize={10}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={window.innerWidth < 640 ? 2 : 3} 
                      name="Revenue (₱)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* table */}
        <div className="bg-[#D4F6FF] p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-md mt-6 sm:mt-8 lg:mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 lg:gap-4 w-full sm:w-auto">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold">Bookings</h2>
              <span className="text-xs sm:text-sm text-gray-600">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                {searchTerm && ` (filtered from ${orders.length})`}
              </span>
            </div>
            
             {/* Search Input */}
             <div className="relative w-full sm:w-auto">
               <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm">
                 <input
                   type="text"
                   placeholder="Search by Order ID..."
                   value={searchInput}
                   onChange={handleSearchInputChange}
                   onKeyPress={handleSearchKeyPress}
                   className="w-full sm:w-64 px-3 sm:px-4 py-2 bg-white rounded-lg text-xs sm:text-sm outline-none focus:outline-none"
                 />
                 <div className="flex items-center pr-1 sm:pr-2">
                   {(searchInput || searchTerm) && (
                     <button
                       onClick={clearSearch}
                       className="text-gray-400 hover:text-gray-600 transition-colors p-1 mr-1"
                       title="Clear search"
                     >
                       <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                   )}
                   <button
                     onClick={handleSearch}
                     className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 sm:p-2 rounded-md transition-colors"
                     title="Search"
                   >
                     <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                     </svg>
                   </button>
                 </div>
               </div>
             </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-base sm:text-lg text-gray-500">Loading bookings...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-sm sm:text-base text-red-500">{error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base"
              >
                Retry
              </button>
            </div>
          )}

          {/* Debug Info */}
          {!loading && !error && (
            <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
              Found {filteredOrders.length} booking record{filteredOrders.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}

          {/* Desktop/Tablet Table View - Shows on screens 768px+ */}
          {!loading && !error && (
          <div className="hidden md:block shadow-lg rounded-lg">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-blue-200">
                <tr>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Order ID</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Customer</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Vendor</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Total Amount</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Delivery Date/Time</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Order Status</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Payment Status</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {
                  filteredOrders.map((order) => {
                    return (
                      <tr className="hover:bg-blue-100" key={order.order_id}>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-bold text-blue-600">#{order.order_id}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-normal break-words max-w-[200px]">
                          <div className="text-xs md:text-sm font-medium text-gray-900 leading-snug">
                            {order.customer_fname} {order.customer_lname || ''}
                          </div>
                          <div className="text-[11px] md:text-xs text-gray-500 break-words">{order.customer_email}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-normal break-words max-w-[180px]">
                          <div className="text-xs md:text-sm font-medium text-gray-900 leading-snug">{order.vendor_name || 'N/A'}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-bold text-green-600">₱{parseFloat(order.total_amount || 0).toFixed(2)}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-normal break-words max-w-[200px]">
                          <div className="text-xs md:text-sm text-gray-500 leading-snug">
                            {order.delivery_datetime 
                              ? new Date(order.delivery_datetime).toLocaleString()
                              : 'Not scheduled'
                            }
                          </div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                            order.payment_status === 'unpaid' ? 'bg-red-100 text-red-800' :
                            order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-500">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>   
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
            </div>
          </div>

          )}

          {/* Mobile Card View */}
          {!loading && !error && (
          <div className="md:hidden max-h-80 sm:max-h-96 overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
            {filteredOrders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg text-blue-600">Order #{order.order_id}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Booking Details</p>
                  </div>
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ₱{parseFloat(order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Customer Info */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Customer:</span>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {order.customer_fname} {order.customer_lname || ''}
                    </p>
                    <p className="text-xs text-gray-500">{order.customer_email}</p>
                  </div>
                  
                  {/* Vendor Info */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Vendor:</span>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{order.vendor_name || 'N/A'}</p>
                  </div>
                  
                  {/* Total Amount */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Total Amount:</span>
                    <p className="font-bold text-green-600 text-base sm:text-lg">₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                  </div>
                  
                  {/* Delivery Date/Time */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Delivery Date/Time:</span>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {order.delivery_datetime 
                        ? new Date(order.delivery_datetime).toLocaleString()
                        : 'Not scheduled'
                      }
                    </p>
                  </div>
                  
                  {/* Order Status */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Order Status:</span>
                    <div>
                      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Status */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Payment:</span>
                    <div>
                      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.payment_status === 'unpaid' ? 'bg-red-100 text-red-800' :
                        order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Created Date */}
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">Created:</span>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredOrders.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <div className="text-sm sm:text-base">
                {searchTerm ? `No bookings found matching "${searchTerm}".` : 'No bookings found.'}
              </div>
            </div>
          )}
        </div>

        
      </main>
    </>
  );

};

export default AdminDashboard;


