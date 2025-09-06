import { useState, useEffect } from 'react';
import axios from 'axios';

export const AdminVendorApproval = () => {
  const [activeTab, setActiveTab] = useState('allVendors');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch vendors from API
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/vendors');
      if (response.data.success) {
        setVendors(response.data.vendors);
      } else {
        setError('Failed to fetch vendors');
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const updateVendorStatus = async (vendorId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:3001/vendors/${vendorId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        // Update local state
        setVendors(vendors.map(vendor => 
          vendor.vendor_id === vendorId 
            ? { ...vendor, status: newStatus }
            : vendor
        ));
        alert('Vendor status updated successfully!');
      } else {
        alert('Failed to update vendor status');
      }
    } catch (err) {
      console.error('Error updating vendor status:', err);
      alert('Failed to update vendor status');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm(''); // Clear search when switching tabs
  };

  // Filter vendors based on search term and tab
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = (vendor.store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.fname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'allVendors') {
      return matchesSearch;
    } else if (activeTab === 'requestedApproval') {
      return matchesSearch && vendor.status && vendor.status.toLowerCase() === 'pending';
    }
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Vendor Approval</h1>
      
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 mb-6">
        <button
          onClick={() => handleTabChange('allVendors')}
          className={`px-4 sm:px-6 py-3 font-medium rounded-lg sm:rounded-t-lg sm:rounded-b-none transition-colors duration-200 ${
            activeTab === 'allVendors'
              ? 'bg-[#FFDDAE] text-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Vendors
        </button>
        <button
          onClick={() => handleTabChange('requestedApproval')}
          className={`px-4 sm:px-6 py-3 font-medium rounded-lg sm:rounded-t-lg sm:rounded-b-none transition-colors duration-200 ${
            activeTab === 'requestedApproval'
              ? 'bg-[#FFDDAE] text-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Requested Approval
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder={activeTab === 'allVendors' ? 'Search Vendor Name' : 'Search Vendor ID'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold">
            {activeTab === 'allVendors' ? 'All Vendors' : 'Registration Pending Approval'}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-lg text-gray-500">Loading vendors...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-500">{error}</div>
            <button 
              onClick={fetchVendors}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* All Vendors Tab Content */}
        {!loading && !error && activeTab === 'allVendors' && (
          <>
            {/* Desktop/Tablet Table View - Shows on screens 768px+ */}
            <div className="hidden md:block shadow-lg rounded-lg">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                <thead className="bg-[#FFDDAE]">
                  <tr>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-orange-200">Vendor Name</th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-orange-200">Shop Name</th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-orange-200">Email</th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-orange-200">Status</th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700 border-r border-orange-200">Registration Date</th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.vendor_id} className="border-b hover:bg-gray-50">
                      <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-gray-900">
                          {(vendor.fname || '') + ' ' + (vendor.lname || '')}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-gray-900">{vendor.store_name || 'N/A'}</div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                        <div className="text-xs md:text-sm text-gray-600">{vendor.email || 'N/A'}</div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                          {getStatusDisplayName(vendor.status)}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 border-r border-gray-200 whitespace-nowrap">
                        <div className="text-xs md:text-sm text-gray-500">
                          {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-2">
                          {(!vendor.status || vendor.status.toLowerCase() !== 'approved') && (
                            <button
                              onClick={() => updateVendorStatus(vendor.vendor_id, 'approved')}
                              className="px-2 md:px-3 py-1 bg-green-500 text-white text-xs md:text-sm rounded hover:bg-green-600"
                            >
                              Approve
                            </button>
                          )}
                          {(!vendor.status || vendor.status.toLowerCase() !== 'rejected') && (
                            <button
                              onClick={() => updateVendorStatus(vendor.vendor_id, 'rejected')}
                              className="px-2 md:px-3 py-1 bg-red-500 text-white text-xs md:text-sm rounded hover:bg-red-600"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Mobile Card View - Shows on screens below 768px */}
            <div className="md:hidden max-h-96 overflow-y-auto space-y-4 pr-2">
              {filteredVendors.map((vendor) => (
                <div key={vendor.vendor_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{vendor.store_name || 'N/A'}</h3>
                      <p className="text-gray-600 text-sm">Owner: {(vendor.fname || '') + ' ' + (vendor.lname || '')}</p>
                      <p className="text-gray-600 text-sm">{vendor.email || 'N/A'}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vendor.status)}`}>
                          {getStatusDisplayName(vendor.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
                      {(!vendor.status || vendor.status.toLowerCase() !== 'approved') && (
                        <button
                          onClick={() => updateVendorStatus(vendor.vendor_id, 'approved')}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex-1 sm:flex-none"
                        >
                          Approve
                        </button>
                      )}
                      {(!vendor.status || vendor.status.toLowerCase() !== 'rejected') && (
                        <button
                          onClick={() => updateVendorStatus(vendor.vendor_id, 'rejected')}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 flex-1 sm:flex-none"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Requested Approval Tab Content */}
        {!loading && !error && activeTab === 'requestedApproval' && (
          <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
            {filteredVendors.map((vendor) => (
              <div key={vendor.vendor_id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg sm:text-xl">{vendor.store_name || 'N/A'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm sm:text-base">
                      <p className="text-gray-600">Owner: {(vendor.fname || '') + ' ' + (vendor.lname || '')}</p>
                      <p className="text-gray-600">Email: {vendor.email || 'N/A'}</p>
                      <p className="text-gray-600">Location: {vendor.location || 'N/A'}</p>
                      <p className="text-gray-500">
                        Registered: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    
                    {/* Document Links */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                      {vendor.valid_id_url && (
                        <a 
                          href={`http://localhost:3001/uploads/vendor-documents/${vendor.valid_id_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 text-sm inline-flex items-center"
                        >
                          📄 View Valid ID
                        </a>
                      )}
                      {vendor.business_permit_url && (
                        <a 
                          href={`http://localhost:3001/uploads/vendor-documents/${vendor.business_permit_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 text-sm inline-flex items-center"
                        >
                          📄 View Business Permit
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-row lg:flex-col space-x-2 sm:space-x-3 lg:space-x-0 lg:space-y-2 lg:ml-4">
                    <button
                      onClick={() => updateVendorStatus(vendor.vendor_id, 'approved')}
                      className="px-3 sm:px-4 py-2 bg-green-500 text-white text-sm sm:text-base rounded hover:bg-green-600 flex-1 lg:flex-none"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateVendorStatus(vendor.vendor_id, 'rejected')}
                      className="px-3 sm:px-4 py-2 bg-red-500 text-white text-sm sm:text-base rounded hover:bg-red-600 flex-1 lg:flex-none"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredVendors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {activeTab === 'allVendors' ? 'vendors' : 'pending requests'} found.
          </div>
        )}
      </div>
    </main>
  );
};  

export default AdminVendorApproval;


