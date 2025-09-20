import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NavWithLogo } from '../../components/shared/nav';
import axios from 'axios';

// Import customer icons
import cartIcon from '../../assets/images/customerIcon/cart.png';
import feedbackIcon from '../../assets/images/customerIcon/feedbacks.png';
import notifIcon from '../../assets/images/customerIcon/notifbell.png';
import productsIcon from '../../assets/images/customerIcon/productsflavor.png';
import shopsIcon from '../../assets/images/customerIcon/shops.png';

export const Notifications = () => {
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState({
    fname: '',
    lname: '',
    email: '',
    contact_no: '',
    role: 'customer'
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('notifications'); // 'notifications' or 'orders'
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [drumReturnLoading, setDrumReturnLoading] = useState(null);

  useEffect(() => {
    // Load user data from session
    const userRaw = sessionStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      setCustomerData({
        fname: user.firstName || user.fname || '',
        lname: user.lastName || user.lname || '',
        email: user.email || '',
        contact_no: user.contact_no || '',
        role: user.role || 'customer'
      });
    }
    
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Get user ID from sessionStorage
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        setNotifications([]);
        return;
      }
      
      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      // Sample notifications data matching the image
      const sampleNotifications = [
        {
          id: 1,
          type: 'order',
          title: 'Order Confirmed',
          description: 'Vendor ChillTayo has confirmed your 5-gallon order.',
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          isRead: false,
          image: '🍦'
        },
        {
          id: 2,
          type: 'delivery',
          title: 'Out for Delivery',
          description: 'Good news! Your ice cream order is out for delivery. Please prepare to receive it.',
          timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          isRead: false,
          image: '🍦'
        },
        {
          id: 3,
          type: 'drum',
          title: 'Drum return status',
          description: 'Vendor has acknowledged your drum return request. Please prepare the drum for pickup.',
          timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          isRead: false,
          image: '🍦'
        }
      ];
      
      setNotifications(sampleNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // In a real app, you'd call an API to mark all as read
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const userRaw = sessionStorage.getItem('user');
      if (!userRaw) {
        console.error('No user session found');
        setOrders([]);
        return;
      }
      
      const user = JSON.parse(userRaw);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      
      const response = await axios.get(`${apiBase}/api/orders/customer/${user.id}`);
      
      if (response.data.success) {
        setOrders(response.data.orders);
        console.log('📦 Orders fetched:', response.data.orders.length);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleViewOrder = () => {
    setActiveView('orders');
    fetchOrders();
  };

  const handleViewProfile = () => {
    navigate('/customer?view=settings');
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleDrumReturn = async (order) => {
    if (!window.confirm('Are you sure you want to request drum return for this order? The vendor will be notified to pick up the drum.')) {
      return;
    }

    setDrumReturnLoading(order.order_id);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.post(`${apiBase}/api/orders/${order.order_id}/drum-return`, {
        drum_status: 'return_requested',
        return_requested_at: new Date().toISOString()
      });
      
      if (response.data.success) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.order_id === order.order_id 
              ? { ...o, drum_status: 'return_requested', return_requested_at: new Date().toISOString() }
              : o
          )
        );
        alert('Drum return requested successfully! The vendor will be notified to pick up the drum.');
      } else {
        alert('Failed to request drum return. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting drum return:', error);
      alert('Failed to request drum return. Please try again.');
    } finally {
      setDrumReturnLoading(null);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <NavWithLogo />
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-300 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-end mb-6">
            <div className="flex items-center space-x-4">
              <Link to="/find-vendors" className="text-blue-700 hover:text-blue-800 font-medium">
                Find nearby Vendors
              </Link>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 shadow-sm">
                {/* Products/Flavors Icon */}
                <button 
                  onClick={() => navigate('/customer')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={productsIcon} alt="Products" className="w-5 h-5" />
                </button>
                
                {/* Shops Icon */}
                <Link to="/find-vendors" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={shopsIcon} alt="Shops" className="w-5 h-5" />
                </Link>
                
                {/* Notification Bell - Active on notifications page */}
                <button 
                  onClick={() => navigate('/customer')}
                  className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors relative"
                >
                  <img src={notifIcon} alt="Notifications" className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
                
                {/* Cart Icon */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={cartIcon} alt="Cart" className="w-5 h-5" />
                </button>
                
                {/* Feedback Icon */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img src={feedbackIcon} alt="Feedback" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-8">
        <div className="max-w-6xl mx-auto px-4">

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - User Profile and Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                {/* User Profile Section */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{customerData.fname} {customerData.lname}</h3>
                  <button
                    onClick={handleViewProfile}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Navigation Menu */}
                <div className="space-y-2">
                  <button
                    onClick={handleViewProfile}
                    className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    My Account
                  </button>
                  <button
                    onClick={handleViewOrder}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeView === 'orders' 
                        ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    My Order
                  </button>
                  <button 
                    onClick={() => setActiveView('notifications')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeView === 'notifications' 
                        ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Notifications
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                    Customer Support
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {activeView === 'notifications' 
                        ? `Your Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`
                        : 'My Orders'
                      }
                    </h2>
                    <div className="flex items-center space-x-3">
                      {activeView === 'orders' && (
                        <button
                          onClick={() => navigate('/customer?view=orders')}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          View More
                        </button>
                      )}
                      {activeView === 'notifications' && unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Mark as all read
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content List */}
                <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                  {activeView === 'notifications' ? (
                    // Notifications Content
                    loading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-4xl mb-4">🔔</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                        <p className="text-gray-600">You'll see updates about your orders and account here</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-6 hover:bg-gray-50 transition-colors ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Notification Image */}
                            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">{notification.image}</span>
                            </div>
                            
                            {/* Notification Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {notification.title}
                                  </h3>
                                  <p className="text-gray-600 mb-4">
                                    {notification.description}
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <button
                                      onClick={() => {
                                        if (notification.type === 'order') {
                                          handleViewOrder();
                                        } else if (notification.type === 'profile') {
                                          handleViewProfile();
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      view details
                                    </button>
                                    <span className="text-sm text-gray-500">
                                      {formatTimeAgo(notification.timestamp)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Unread Indicator */}
                                {!notification.isRead && (
                                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    // Orders Content
                    ordersLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading orders...</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-4xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-600">You haven't placed any orders yet.</p>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div
                          key={order.order_id}
                          className="p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start space-x-4">
                            {/* Order Icon */}
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">📦</span>
                            </div>
                            
                            {/* Order Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Order #{order.order_id}
                                  </h3>
                                  <p className="text-gray-600 mb-3">
                                    {order.vendor_name} • ₱{parseFloat(order.total_amount).toFixed(2)}
                                  </p>
                                  
                                  {/* Order Status & Tracking */}
                                  <div className="mb-4">
                                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mb-3 ${
                                      order.status === 'pending' 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : order.status === 'confirmed'
                                        ? 'bg-green-100 text-green-800'
                                        : order.status === 'preparing'
                                        ? 'bg-blue-100 text-blue-800'
                                        : order.status === 'out_for_delivery'
                                        ? 'bg-purple-100 text-purple-800'
                                        : order.status === 'delivered'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                                    </span>
                                    
                                    {/* Tracking Progress Bar */}
                                    <div className="mt-3">
                                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                        <span className={order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                                          Order Placed
                                        </span>
                                        <span className={order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                                          Confirmed
                                        </span>
                                        <span className={order.status === 'preparing' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                                          Preparing
                                        </span>
                                        <span className={order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                                          Out for Delivery
                                        </span>
                                        <span className={order.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                                          Delivered
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{
                                            width: order.status === 'pending' ? '20%' :
                                                   order.status === 'confirmed' ? '40%' :
                                                   order.status === 'preparing' ? '60%' :
                                                   order.status === 'out_for_delivery' ? '80%' :
                                                   order.status === 'delivered' ? '100%' : '0%'
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Delivery Information */}
                                  {order.delivery_address && (
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                      <div className="flex items-start space-x-2">
                                        <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <div>
                                          <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                                          <p className="text-sm text-gray-600">{order.delivery_address}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Drum Return Section for Delivered Orders */}
                                  {order.status === 'delivered' && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-blue-800">📦 Container Return</p>
                                          {order.drum_status === 'return_requested' && (
                                            <p className="text-xs text-blue-600">Return requested - vendor notified</p>
                                          )}
                                          {order.drum_status === 'returned' && (
                                            <p className="text-xs text-green-600">Container successfully returned</p>
                                          )}
                                          {!order.drum_status && (
                                            <p className="text-xs text-gray-600">Click to request container pickup</p>
                                          )}
                                        </div>
                                        {order.drum_status === 'return_requested' ? (
                                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                            Requested
                                          </span>
                                        ) : order.drum_status === 'returned' ? (
                                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                            Returned
                                          </span>
                                        ) : (
                                          <button 
                                            onClick={() => handleDrumReturn(order)}
                                            disabled={drumReturnLoading === order.order_id}
                                            className="bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1"
                                          >
                                            {drumReturnLoading === order.order_id ? (
                                              <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span>Requesting...</span>
                                              </>
                                            ) : (
                                              <>
                                                <span>📦</span>
                                                <span>Return</span>
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Order Actions */}
                                  <div className="flex justify-between items-center">
                                    <button 
                                      onClick={() => handleViewOrderDetails(order)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      View Details
                                    </button>
                                    <span className="text-sm text-gray-500">
                                      {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={closeOrderDetails}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Information */}
              <div className="space-y-6">
                {/* Order ID and Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{selectedOrder.order_id}</h3>
                      <p className="text-sm text-gray-600">Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      selectedOrder.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : selectedOrder.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : selectedOrder.status === 'preparing'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedOrder.status === 'out_for_delivery'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedOrder.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span className={selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                        Order Placed
                      </span>
                      <span className={selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                        Confirmed
                      </span>
                      <span className={selectedOrder.status === 'preparing' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                        Preparing
                      </span>
                      <span className={selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                        Out for Delivery
                      </span>
                      <span className={selectedOrder.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                        Delivered
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: selectedOrder.status === 'pending' ? '20%' :
                                 selectedOrder.status === 'confirmed' ? '40%' :
                                 selectedOrder.status === 'preparing' ? '60%' :
                                 selectedOrder.status === 'out_for_delivery' ? '80%' :
                                 selectedOrder.status === 'delivered' ? '100%' : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Vendor Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Vendor Information</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedOrder.vendor_name || 'Vendor Name'}</h4>
                      <p className="text-sm text-gray-600">Ice Cream Vendor</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {/* Since we don't have detailed items in the current order structure, we'll show basic info */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Ice Cream Order</p>
                        <p className="text-sm text-gray-600">Order ID: #{selectedOrder.order_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-700">Delivery Address</p>
                        <p className="text-sm text-gray-600">{selectedOrder.delivery_address || 'No address provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-700">Delivery Date & Time</p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.delivery_datetime 
                            ? new Date(selectedOrder.delivery_datetime).toLocaleString()
                            : 'No delivery time set'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`font-medium ${
                        selectedOrder.payment_status === 'paid' 
                          ? 'text-green-600' 
                          : selectedOrder.payment_status === 'partial'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-lg">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={closeOrderDetails}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  {selectedOrder.status === 'delivered' && (
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                      Rate Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notifications;
