import React, { useState, useEffect } from 'react';
import AddressForm from '../shared/AddressForm';
import axios from 'axios';

const VendorLocationManager = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [activeTab, setActiveTab] = useState('all');

  const [newLocation, setNewLocation] = useState({
    unit_number: '',
    street_name: '',
    barangay: '',
    cityVillage: '',
    province: '',
    region: '',
    postal_code: '',
    landmark: '',
    address_type: 'business'
  });

  useEffect(() => {
    fetchVendorLocations();
    fetchLocationStats();
  }, []);

  const fetchVendorLocations = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/vendor-locations`);
      
      // Transform data to match expected format
      const transformedVendors = (response.data.vendors || []).map(vendor => ({
        vendor_id: vendor.vendor_id,
        store_name: vendor.store_name,
        vendor_name: `${vendor.vendor_name} ${vendor.vendor_lastname || ''}`.trim(),
        vendor_email: vendor.vendor_email,
        vendor_status: vendor.vendor_status,
        contact_no: vendor.contact_no,
        address: vendor.address_id ? {
          address_id: vendor.address_id,
          unit_number: vendor.unit_number,
          street_name: vendor.street_name,
          barangay: vendor.barangay,
          cityVillage: vendor.cityVillage,
          province: vendor.province,
          region: vendor.region,
          postal_code: vendor.postal_code,
          landmark: vendor.landmark,
          full_address: vendor.full_address
        } : null
      }));
      
      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error fetching vendor locations:', error);
      setStatus({ type: 'error', message: 'Failed to fetch vendor locations' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationStats = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.get(`${apiBase}/api/admin/vendor-locations/count`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching location stats:', error);
    }
  };

  const searchLocations = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('query', searchQuery);
      if (filterProvince) params.append('province', filterProvince);
      if (filterCity) params.append('city', filterCity);

      const response = await axios.get(`${apiBase}/api/admin/vendor-locations/search?${params}`);
      
      // Transform results to match expected format
      const transformedVendors = response.data.results.map(vendor => ({
        vendor_id: vendor.vendor_id,
        store_name: vendor.store_name,
        vendor_name: `${vendor.vendor_name} ${vendor.vendor_lastname || ''}`.trim(),
        vendor_email: vendor.vendor_email,
        vendor_status: vendor.vendor_status,
        address: vendor.address_id ? {
          address_id: vendor.address_id,
          unit_number: vendor.unit_number,
          street_name: vendor.street_name,
          barangay: vendor.barangay,
          cityVillage: vendor.cityVillage,
          province: vendor.province,
          region: vendor.region,
          postal_code: vendor.postal_code,
          landmark: vendor.landmark,
          full_address: vendor.full_address
        } : null
      }));
      
      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error searching locations:', error);
      setStatus({ type: 'error', message: 'Failed to search locations' });
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (vendorId, addressId, locationData) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      await axios.put(`${apiBase}/api/admin/vendor/${vendorId}/location/${addressId}`, locationData);
      
      setStatus({ type: 'success', message: 'Location updated successfully!' });
      setShowLocationForm(false);
      setEditingLocation(null);
      fetchVendorLocations();
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to update location' 
      });
    }
  };


  const handleLocationChange = (locationData) => {
    setNewLocation(locationData);
  };

  const handleUpdateLocation = () => {
    if (editingLocation && selectedVendor) {
      updateLocation(selectedVendor.vendor_id, editingLocation.address_id, newLocation);
    }
  };

  const editLocation = (vendor) => {
    if (!vendor.address) return;
    
    setSelectedVendor(vendor);
    setEditingLocation(vendor.address);
    setNewLocation({
      unit_number: vendor.address.unit_number || '',
      street_name: vendor.address.street_name || '',
      barangay: vendor.address.barangay || '',
      cityVillage: vendor.address.cityVillage || '',
      province: vendor.address.province || '',
      region: vendor.address.region || '',
      postal_code: vendor.address.postal_code || '',
      landmark: vendor.address.landmark || '',
      address_type: 'business'
    });
    setShowLocationForm(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilterProvince('');
    setFilterCity('');
    fetchVendorLocations();
  };

  const formatAddress = (address) => {
    const parts = [];
    if (address.unit_number) parts.push(address.unit_number);
    if (address.street_name) parts.push(address.street_name);
    if (address.barangay) parts.push(address.barangay);
    if (address.cityVillage) parts.push(address.cityVillage);
    if (address.province) parts.push(address.province);
    if (address.postal_code) parts.push(address.postal_code);
    return parts.join(', ');
  };

  const tabs = [
    { id: 'all', label: 'All Locations', icon: '🗺️' },
    { id: 'stats', label: 'Statistics', icon: '📊' },
    { id: 'search', label: 'Search', icon: '🔍' }
  ];

  if (loading && vendors.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading vendor locations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-sky-100 rounded-lg shadow-sm p-2 sm:p-3 lg:p-4 xl:p-6 flex-shrink-0">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Vendor Location Management</h2>
        <p className="text-sm sm:text-base text-gray-600">Manage and update all vendor store locations</p>
      </div>

      {/* Status Messages */}
      {status.type && (
        <div className={`p-2 sm:p-3 lg:p-4 rounded-lg flex-shrink-0 ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          status.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {status.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-sky-100 rounded-lg shadow-sm flex flex-col flex-1 min-h-0">
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex space-x-1 sm:space-x-2 lg:space-x-4 px-2 sm:px-4 lg:px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 sm:py-3 lg:py-4 px-1 sm:px-2 lg:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1 sm:mr-2 text-xs sm:text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 flex-1 overflow-hidden">
          {/* All Locations Tab */}
          {activeTab === 'all' && (
            <div className="h-full overflow-y-auto">
              {vendors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🏪</div>
                  <p className="text-lg">No vendor locations found</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  {vendors.map((vendor) => (
                  <div key={vendor.vendor_id} className="bg-sky-100 border border-gray-200 rounded-lg p-2 sm:p-3 lg:p-4 xl:p-6">
                    {/* Vendor Header */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 space-y-2 md:space-y-0">
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900">{vendor.store_name}</h3>
                        <p className="text-sm md:text-base text-gray-600 break-words">
                          <span className="block md:inline">Owner: {vendor.vendor_name}</span>
                          <span className="hidden md:inline"> | </span>
                          <span className="block md:inline">Email: {vendor.vendor_email}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: <span className={`px-2 py-1 text-xs rounded-full ${
                            vendor.vendor_status === 'approved' ? 'bg-green-100 text-green-800' :
                            vendor.vendor_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {vendor.vendor_status}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Vendor Location */}
                    <div className="space-y-3">
                      {!vendor.address ? (
                        <div className="text-center py-4 text-gray-500">
                          <p>No business location set yet</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-3 md:p-4">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-2 md:space-y-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900 truncate">
                                  Business Location
                                </h4>
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex-shrink-0 w-fit">
                                  business
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm break-words">
                                {vendor.address.full_address || formatAddress(vendor.address)}
                              </p>
                              {vendor.address.landmark && (
                                <p className="text-gray-500 text-xs mt-1 break-words">
                                  Landmark: {vendor.address.landmark}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => editLocation(vendor)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex-shrink-0 mt-2 md:mt-0"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="h-full overflow-y-auto space-y-3 sm:space-y-4 lg:space-y-6">
              {stats && (
                <>
                  {/* Overall Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                    <div className="bg-sky-100 rounded-lg p-2 sm:p-3 lg:p-4 xl:p-6">
                      <h3 className="text-xs sm:text-sm lg:text-lg font-semibold text-blue-900">Total Vendors</h3>
                      <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-blue-600">
                        {stats.stats?.total_vendors || 0}
                      </p>
                    </div>
                    <div className="bg-sky-100 rounded-lg p-2 sm:p-3 lg:p-4 xl:p-6">
                      <h3 className="text-xs sm:text-sm lg:text-lg font-semibold text-green-900">With Locations</h3>
                      <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-green-600">
                        {stats.stats?.vendors_with_locations || 0}
                      </p>
                    </div>
                    <div className="bg-sky-100 rounded-lg p-2 sm:p-3 lg:p-4 xl:p-6">
                      <h3 className="text-xs sm:text-sm lg:text-lg font-semibold text-yellow-900">Without Locations</h3>
                      <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-yellow-600">
                        {stats.stats?.vendors_without_locations || 0}
                      </p>
                    </div>
                  </div>

                  {/* Simple Info */}
                  <div className="bg-sky-100 border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4">Location Overview</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-xs sm:text-sm text-gray-700">Coverage</span>
                        <span className="text-xs text-gray-500">
                          {stats.stats?.vendors_with_locations || 0} out of {stats.stats?.total_vendors || 0} vendors have business locations set
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-blue-600 h-1.5 sm:h-2 rounded-full" 
                          style={{ 
                            width: `${stats.stats?.total_vendors > 0 
                              ? (stats.stats.vendors_with_locations / stats.stats.total_vendors) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="h-full overflow-y-auto space-y-6">
              {/* Search Form */}
              <div className="bg-sky-100 rounded-lg p-4 md:p-6 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Vendor Locations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Query
                    </label>
                    <input
                      type="text"
                      placeholder="Store name, vendor, address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Metro Manila"
                      value={filterProvince}
                      onChange={(e) => setFilterProvince(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Makati City"
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <button
                      onClick={searchLocations}
                      className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                    >
                      Search
                    </button>
                    <button
                      onClick={clearSearch}
                      className="bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 min-h-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex-shrink-0">
                  Search Results ({vendors.length} vendor{vendors.length !== 1 ? 's' : ''})
                </h3>
                {vendors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🔍</div>
                    <p>No locations found matching your search criteria</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4 overflow-y-auto max-h-full">
                    {vendors.map((vendor) => (
                      <div key={vendor.vendor_id} className="bg-sky-100 border border-gray-200 rounded-lg p-2 sm:p-3 lg:p-4">
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">{vendor.store_name}</h4>
                        <p className="text-xs md:text-sm text-gray-600 mb-3 break-words">
                          <span className="block md:inline">{vendor.vendor_name}</span>
                          <span className="hidden md:inline"> | </span>
                          <span className="block md:inline">{vendor.vendor_email}</span>
                        </p>
                        <div className="space-y-2">
                          {!vendor.address ? (
                            <div className="bg-white rounded p-3 text-xs md:text-sm text-gray-500">
                              <p>No business location set</p>
                            </div>
                          ) : (
                            <div className="bg-white rounded p-3 text-xs md:text-sm">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-2 md:space-y-0">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium break-words">Business Location</p>
                                  <p className="text-gray-600 break-words">
                                    {vendor.address.full_address || formatAddress(vendor.address)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => editLocation(vendor)}
                                  className="text-blue-600 hover:text-blue-800 flex-shrink-0 mt-2 md:mt-0"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Location Modal */}
      {showLocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-sky-100 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Location - {selectedVendor?.store_name}
                </h3>
                <button
                  onClick={() => {
                    setShowLocationForm(false);
                    setEditingLocation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <AddressForm
                addressData={newLocation}
                onAddressChange={handleLocationChange}
                showAddressType={true}
                addressType="business"
                required={true}
                labelPrefix="Store "
              />
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowLocationForm(false);
                    setEditingLocation(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLocation}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLocationManager;
