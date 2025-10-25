import { useState, useEffect } from "react";
import axios from "axios";
// import { NavWithLogo } from "../../components/shared/nav";

//images import

import imgTotalUser from '../../assets/images/t-user.png';
import imgTotalVendor from '../../assets/images/t-vendor.png';
import imgTotalOrder from '../../assets/images/t-order.png';

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
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">

        {/* Page Title */}
        <div className="mb-6 sm:mb-8 mt-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

          <div className="bg-[#D4F6FF] h-32 md:h-36 rounded-xl flex flex-col justify-center px-4 md:px-6">
            <h3 className="text-lg md:text-xl font-semibold text-left mb-2">Total Users</h3>
            <div className="flex justify-between items-center">
              <img src={imgTotalUser} alt="Total Users" className="w-12 md:w-16" />
              <div className="text-2xl md:text-3xl font-bold text-[#26A0FE]">{totalUsers.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-[#D4F6FF] h-32 md:h-36 rounded-xl flex flex-col justify-center px-4 md:px-6">
            <h3 className="text-lg md:text-xl font-semibold text-left mb-2">Total Vendors</h3>
            <div className="flex justify-between items-center">
              <img src={imgTotalVendor} alt="Total Vendors" className="w-12 md:w-16" />
              <div className="text-2xl md:text-3xl font-bold text-[#26A0FE]">{totalVendors.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-[#D4F6FF] h-32 md:h-36 rounded-xl flex flex-col justify-center px-4 md:px-6">
            <h3 className="text-lg md:text-xl font-semibold text-left mb-2">Total Orders</h3>
            <div className="flex justify-between items-center">
              <img src={imgTotalOrder} alt="Total Orders" className="w-12 md:w-16" />
              <div className="text-2xl md:text-3xl font-bold text-[#26A0FE]">{totalOrders.toLocaleString()}</div>
            </div>
          </div>

        </div>

        {/* table */}
        <div className="bg-[#D4F6FF] p-4 sm:p-6 rounded-xl shadow-md mt-10 sm:mt-16 lg:mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">Bookings</h2>
              <span className="text-sm text-gray-600">
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
                   className="w-full sm:w-64 px-4 py-2 bg-white rounded-lg text-sm outline-none focus:outline-none"
                 />
                 <div className="flex items-center pr-2">
                   {(searchInput || searchTerm) && (
                     <button
                       onClick={clearSearch}
                       className="text-gray-400 hover:text-gray-600 transition-colors p-1 mr-1"
                       title="Clear search"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                   )}
                   <button
                     onClick={handleSearch}
                     className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition-colors"
                     title="Search"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                     </svg>
                   </button>
                 </div>
               </div>
             </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="text-lg text-gray-500">Loading bookings...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500">{error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          )}

          {/* Debug Info */}
          {!loading && !error && (
            <div className="text-sm text-gray-500 mb-4">
              Found {filteredOrders.length} booking records
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
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900">
                            {order.customer_fname} {order.customer_lname || ''}
                          </div>
                          <div className="text-xs text-gray-500">{order.customer_email}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900">{order.vendor_name || 'N/A'}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-bold text-green-600">₱{parseFloat(order.total_amount || 0).toFixed(2)}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-500">
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
          <div className="md:hidden max-h-96 overflow-y-auto space-y-4 pr-2">
            {filteredOrders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-blue-600">Order #{order.order_id}</h3>
                    <p className="text-sm text-gray-500 mt-1">Booking Details</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ₱{parseFloat(order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm font-medium">Customer:</span>
                    <p className="font-semibold text-gray-900">
                      {order.customer_fname} {order.customer_lname || ''}
                    </p>
                    <p className="text-xs text-gray-500">{order.customer_email}</p>
                  </div>
                  
                  {/* Vendor Info */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm font-medium">Vendor:</span>
                    <p className="font-semibold text-gray-900">{order.vendor_name || 'N/A'}</p>
                  </div>
                  
                  {/* Total Amount */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm font-medium">Total Amount:</span>
                    <p className="font-bold text-green-600 text-lg">₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                  </div>
                  
                  {/* Delivery Date/Time */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm font-medium">Delivery Date/Time:</span>
                    <p className="font-semibold text-gray-900">
                      {order.delivery_datetime 
                        ? new Date(order.delivery_datetime).toLocaleString()
                        : 'Not scheduled'
                      }
                    </p>
                  </div>
                  
                  {/* Order Status */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm font-medium">Order Status:</span>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    <span className="text-gray-600 text-sm font-medium">Payment:</span>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    <span className="text-gray-600 text-sm font-medium">Created:</span>
                    <p className="font-semibold text-gray-900">
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
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? `No bookings found matching "${searchTerm}".` : 'No bookings found.'}
            </div>
          )}
        </div>

        
      </main>
    </>
  );

};

export default AdminDashboard;


