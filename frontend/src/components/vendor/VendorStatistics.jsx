import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const VendorStatistics = ({ vendorId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const fetchStatistics = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const res = await axios.get(`${apiBase}/api/vendor/statistics/${vendorId}`);
      
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching vendor statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 text-center py-8">
        <div className="text-sm text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Format data for charts
  const ordersData = stats.ordersOverTime.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    orders: item.orders
  }));

  const revenueData = stats.revenueOverTime.map(item => ({
    month: item.month,
    revenue: parseFloat(item.revenue)
  }));

  const topFlavorsData = stats.topFlavors.map(item => ({
    name: item.flavor_name,
    sold: item.sold_count
  }));

  return (
    <div className="mt-6 space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Performance</h2>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Daily Orders (Last 30 Days) */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 text-gray-800">
            Daily Orders (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
            <LineChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 text-gray-800">
            Monthly Revenue
          </h3>
          <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value) => `₱${value.toLocaleString()}`}
                contentStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue (₱)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Selling Flavors */}
        {topFlavorsData.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 text-gray-800">
              Top Selling Flavors
            </h3>
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
              <BarChart data={topFlavorsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Bar dataKey="sold" fill="#F59E0B" name="Sold Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
};

export default VendorStatistics;

