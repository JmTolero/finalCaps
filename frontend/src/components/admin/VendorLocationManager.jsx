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
      setVendors(response.data.vendors || []);
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
      const response = await axios.get(`${apiBase}/api/admin/vendor-locations/stats`);
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
      
      // Group search results by vendor
      const vendorMap = {};
      response.data.results.forEach(location => {
        if (!vendorMap[location.vendor_id]) {
          vendorMap[location.vendor_id] = {
            vendor_id: location.vendor_id,
            store_name: location.store_name,
            vendor_name: location.vendor_name,
            vendor_email: location.vendor_email,
            addresses: []
          };
        }
        vendorMap[location.vendor_id].addresses.push({
          address_id: location.address_id,
          unit_number: location.unit_number,
          street_name: location.street_name,
          barangay: location.barangay,
          cityVillage: location.cityVillage,
          province: location.province,
          region: location.region,
          postal_code: location.postal_code,
          landmark: location.landmark,
          address_type: location.address_type,
          address_label: location.address_label
        });
      });
      
      setVendors(Object.values(vendorMap));
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
      await axios.put(`${apiBase}/api/vendor/${vendorId}/location/${addressId}`, locationData);
      
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

  const bulkUpdateVendorLocations = async (vendorId, locations) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await axios.put(`${apiBase}/api/vendor/${vendorId}/locations/bulk`, {
        locations: locations
      });
      
      setStatus({ 
        type: response.data.success ? 'success' : 'warning',
        message: response.data.message 
      });
      
      fetchVendorLocations();
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to bulk update locations' 
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

  const editLocation = (vendor, location) => {
    setSelectedVendor(vendor);
    setEditingLocation(location);
    setNewLocation(location);
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
    <div className="space-y-6 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Location Management</h2>
        <p className="text-gray-600">Manage and update all vendor store locations</p>
      </div>

      {/* Status Messages */}
      {status.type && (
        <div className={`p-4 rounded-lg flex-shrink-0 ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          status.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {status.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm flex flex-col flex-1 min-h-0">
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 flex-1 overflow-hidden">
          {/* All Locations Tab */}
          {activeTab === 'all' && (
            <div className="h-full overflow-y-auto">
              {vendors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🏪</div>
                  <p className="text-lg">No vendor locations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendors.map((vendor) => (
                  <div key={vendor.vendor_id} className="border border-gray-200 rounded-lg p-4 md:p-6">
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
                          {vendor.addresses.length} location{vendor.addresses.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            const updatedAddresses = vendor.addresses.map(addr => ({
                              address_id: addr.address_id,
                              ...addr
                            }));
                            bulkUpdateVendorLocations(vendor.vendor_id, updatedAddresses);
                          }}
                          className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                        >
                          Bulk Update
                        </button>
                      </div>
                    </div>

                    {/* Vendor Locations */}
                    <div className="space-y-3">
                      {vendor.addresses.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <p>No locations added yet</p>
                        </div>
                      ) : (
                        vendor.addresses.map((address) => (
                          <div key={address.address_id} className="bg-gray-50 rounded-lg p-3 md:p-4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-2 md:space-y-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {address.address_label || 'Store Location'}
                                  </h4>
                                  <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 w-fit ${
                                    address.address_type === 'business' ? 'bg-blue-100 text-blue-800' :
                                    address.address_type === 'commercial' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {address.address_type}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm break-words">
                                  {formatAddress(address)}
                                </p>
                                {address.landmark && (
                                  <p className="text-gray-500 text-xs mt-1 break-words">
                                    Landmark: {address.landmark}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => editLocation(vendor, address)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex-shrink-0 mt-2 md:mt-0"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))
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
            <div className="h-full overflow-y-auto space-y-6">
              {stats && (
                <>
                  {/* Overall Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 md:p-6">
                      <h3 className="text-sm md:text-lg font-semibold text-blue-900">Total Vendors</h3>
                      <p className="text-xl md:text-3xl font-bold text-blue-600">
                        {stats.overall_stats?.total_vendors || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 md:p-6">
                      <h3 className="text-sm md:text-lg font-semibold text-green-900">Total Locations</h3>
                      <p className="text-xl md:text-3xl font-bold text-green-600">
                        {stats.overall_stats?.total_locations || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 md:p-6">
                      <h3 className="text-sm md:text-lg font-semibold text-yellow-900">Avg per Vendor</h3>
                      <p className="text-xl md:text-3xl font-bold text-yellow-600">
                        {stats.overall_stats?.avg_locations_per_vendor 
                          ? parseFloat(stats.overall_stats.avg_locations_per_vendor).toFixed(1)
                          : '0.0'}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 md:p-6">
                      <h3 className="text-sm md:text-lg font-semibold text-purple-900">Max Locations</h3>
                      <p className="text-xl md:text-3xl font-bold text-purple-600">
                        {stats.overall_stats?.max_locations_per_vendor || 0}
                      </p>
                    </div>
                  </div>

                  {/* Province Distribution */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Provinces</h3>
                    <div className="space-y-3">
                      {stats.province_distribution?.map((province, index) => (
                        <div key={province.province} className="flex justify-between items-center">
                          <span className="text-gray-700">{province.province}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              {province.vendor_count} vendors
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                              {province.location_count} locations
                            </span>
                          </div>
                        </div>
                      )) || <p className="text-gray-500">No data available</p>}
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
              <div className="bg-gray-50 rounded-lg p-4 md:p-6 flex-shrink-0">
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
                  <div className="space-y-4 overflow-y-auto max-h-full">
                    {vendors.map((vendor) => (
                      <div key={vendor.vendor_id} className="border border-gray-200 rounded-lg p-3 md:p-4">
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">{vendor.store_name}</h4>
                        <p className="text-xs md:text-sm text-gray-600 mb-3 break-words">
                          <span className="block md:inline">{vendor.vendor_name}</span>
                          <span className="hidden md:inline"> | </span>
                          <span className="block md:inline">{vendor.vendor_email}</span>
                        </p>
                        <div className="space-y-2">
                          {vendor.addresses.map((address) => (
                            <div key={address.address_id} className="bg-gray-50 rounded p-3 text-xs md:text-sm">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-2 md:space-y-0">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium break-words">{address.address_label}</p>
                                  <p className="text-gray-600 break-words">{formatAddress(address)}</p>
                                </div>
                                <button
                                  onClick={() => editLocation(vendor, address)}
                                  className="text-blue-600 hover:text-blue-800 flex-shrink-0 mt-2 md:mt-0"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          ))}
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
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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
