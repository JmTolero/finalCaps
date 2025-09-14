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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(()=>{
    const fetchTotal = async () => {

      try{
        const res = await axios.get('http://localhost:3001/api/admin/total');
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
        const res = await axios.get('http://localhost:3001/api/admin/orderRecords');
        console.log('Order records response:', res.data);
        console.log('Number of orders:', res.data?.length || 0);
        setOrders(res.data || []);
        setError(null);
      }catch(err){
        console.log('Error fetching orders:', err);
        setError('Failed to fetch order records');
      } finally {
        setLoading(false);
      }
    }
    fetchOrderRecords();
  },[])


  return (
    <>
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Bookings</h2>
            <span className="text-sm text-gray-600">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
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
              Found {orders.length} booking records
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
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Customer ID</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Vendor ID</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Delivery Date/Time</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Container Size</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Status</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-blue-300">Payment Status</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700">Drum Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {
                  orders.map((order) => {
                    return (
                      <tr className="hover:bg-blue-100" key={order.order_id}>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-bold text-blue-600">#{order.order_id}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900">{order.fname || 'N/A'}</div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900">{order.store_name || 'N/A'}</div>
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
                          <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {order.size || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                            order.payment_status === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : order.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.payment_status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.payment_status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900">{order.status_name || 'N/A'}</div>
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
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-blue-600">Order #{order.order_id}</h3>
                    <p className="text-sm text-gray-500 mt-1">Booking Details</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {order.size || 'N/A'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm font-medium">Customer:</span>
                    <p className="font-semibold text-gray-900">{order.fname || 'N/A'}</p>
                  </div>
                  
                  {/* Vendor Info */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm font-medium">Store:</span>
                    <p className="font-semibold text-gray-900">{order.store_name || 'N/A'}</p>
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
                        order.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Status */}
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm font-medium">Payment:</span>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : order.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.payment_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.payment_status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Drum Status */}
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-gray-600 text-sm font-medium">Drum Status:</span>
                    <p className="font-semibold text-gray-900">{order.status_name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Empty State */}
          {!loading && !error && orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bookings found.
            </div>
          )}
        </div>

        
      </main>
    </>
  );

};

export default AdminDashboard;


