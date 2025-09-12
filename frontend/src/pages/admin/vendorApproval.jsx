import { useState, useEffect } from 'react';
import axios from 'axios';
import VendorDetailView from '../../components/admin/VendorDetailView';

export const AdminVendorApproval = () => {
  const [activeTab, setActiveTab] = useState('allVendors');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [previousVendorCount, setPreviousVendorCount] = useState(0);

  // Fetch vendors from API
  useEffect(() => {
    fetchVendors();
    
    // Set up auto-refresh every 30 seconds (without showing loading)
    const interval = setInterval(() => {
      fetchVendors(false);
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchVendors = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axios.get('http://localhost:3001/api/admin/vendors');
      if (response.data.success) {
        const newVendors = response.data.vendors;
        setVendors(newVendors);
        setLastUpdated(new Date());
        setError(null);
        
        // Check for new vendors (only if not the initial load)
        if (previousVendorCount > 0 && newVendors.length > previousVendorCount) {
          // Show notification for new vendors
          const newCount = newVendors.length - previousVendorCount;
          console.log(`New vendor applications detected: ${newCount}`);
          // You could add a toast notification here
        }
        
        setPreviousVendorCount(newVendors.length);
      } else {
        setError('Failed to fetch vendors');
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to fetch vendors');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const updateVendorStatus = async (vendorId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/admin/vendors/${vendorId}/status`, {
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
    setStatusFilter('all'); // Reset status filter when switching tabs
  };

  const handleViewDetails = (vendorId) => {
    setSelectedVendorId(vendorId);
    setShowDetailView(true);
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedVendorId(null);
  };

  const handleStatusUpdateFromDetail = (vendorId, newStatus) => {
    // Update the vendor in the local state
    setVendors(vendors.map(vendor => 
      vendor.vendor_id === vendorId 
        ? { ...vendor, status: newStatus }
        : vendor
    ));
  };

  // Image viewing function - currently not used but kept for future implementation
  // const viewImage = (imageUrl, title, event) => {
  //   event.stopPropagation(); // Prevent the card click event
  //   setSelectedImage(`http://localhost:3001/uploads/vendor-documents/${imageUrl}`);
  //   setSelectedImageTitle(title);
  //   setShowImageModal(true);
  // };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setSelectedImageTitle('');
  };

  // Filter vendors based on search term, tab, and status filter
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = (vendor.store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.fname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (vendor.status && vendor.status.toLowerCase() === statusFilter.toLowerCase());
    
    if (activeTab === 'allVendors') {
      return matchesSearch && matchesStatus;
    } else if (activeTab === 'requestedApproval') {
      return matchesSearch && vendor.status && vendor.status.toLowerCase() === 'pending' && matchesStatus;
    }
    return matchesSearch && matchesStatus;
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

  // Show detail view if a vendor is selected
  if (showDetailView && selectedVendorId) {
    return (
      <VendorDetailView 
        vendorId={selectedVendorId}
        onBack={handleBackToList}
        onStatusUpdate={handleStatusUpdateFromDetail}
      />
    );
  }

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

      {/* Search Bar and Status Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <input
            type="text"
            placeholder={activeTab === 'allVendors' ? 'Search Vendor Name' : 'Search Vendor ID'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <h2 className="text-lg sm:text-xl font-semibold">
              {activeTab === 'allVendors' ? 'All Vendors' : 'Registration Pending Approval'}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchVendors(true)}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
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
            <div className="hidden md:block shadow-lg rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full border-collapse bg-white">
                  <thead className="bg-[#FFDDAE] sticky top-0 z-10">
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
              <div 
                key={vendor.vendor_id} 
                className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleViewDetails(vendor.vendor_id)}
              >
                <div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-lg sm:text-xl">{vendor.store_name || 'N/A'}</h3>
                      <span className="text-sm text-blue-600 font-medium">(click to view full details)</span>
                    </div>
                    <div className="space-y-1 mt-2 text-sm sm:text-base">
                      <p className="text-gray-600">Owner: {(vendor.fname || '') + ' ' + (vendor.lname || '')}</p>
                      <p className="text-gray-600">Email: {vendor.email || 'N/A'}</p>
                      <p className="text-gray-500">
                        Registered: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    
                    {/* Document Status */}
                    <div className="mt-3 flex flex-wrap gap-3">
                      {vendor.valid_id_url && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          📄 Valid ID Uploaded
                        </span>
                      )}
                      {vendor.business_permit_url && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          📄 Business Permit Uploaded
                        </span>
                      )}
                    </div>
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

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImageTitle}</h3>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4">
              <img
                src={selectedImage}
                alt={selectedImageTitle}
                className="max-w-full max-h-[70vh] mx-auto object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';
                }}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t">
              <button
                onClick={() => window.open(selectedImage, '_blank')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                📂 Open in New Tab
              </button>
              <button
                onClick={closeImageModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};  

export default AdminVendorApproval;


