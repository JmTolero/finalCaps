import React, { useState, useEffect } from 'react';
import { ProvinceDropdown, CityDropdown, RegionDropdown } from './DropdownSelect';

const AddressForm = ({ 
  addressData = {}, 
  onAddressChange, 
  showAddressType = true,
  addressType = 'business',
  required = true,
  labelPrefix = ''
}) => {
  const [address, setAddress] = useState({
    unit_number: '',
    street_name: '',
    barangay: '',
    cityVillage: '',
    province: '',
    region: '',
    postal_code: '',
    landmark: '',
    address_type: addressType,
    ...addressData
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedAddress = { ...address, [name]: value };
    setAddress(updatedAddress);
    
    // Pass the updated address back to parent component
    if (onAddressChange) {
      onAddressChange(updatedAddress);
    }
  };

  const handleDropdownChange = (field, selectedOption) => {
    let updatedAddress = { ...address };
    
    if (field === 'region') {
      // For region, use the region code, not the display name
      updatedAddress[field] = selectedOption.region;
    } else {
      updatedAddress[field] = selectedOption.name;
    }
    
    // If province changes, clear city to force re-selection
    if (field === 'province') {
      updatedAddress.cityVillage = '';
    }
    
    // If region changes, clear province and city
    if (field === 'region') {
      updatedAddress.province = '';
      updatedAddress.cityVillage = '';
    }
    
    setAddress(updatedAddress);
    
    // Pass the updated address back to parent component
    if (onAddressChange) {
      onAddressChange(updatedAddress);
    }
  };


  const addressTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'business', label: 'Business' },
    { value: 'warehouse', label: 'Warehouse' }
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 border-b border-gray-300 pb-2">
        {labelPrefix}Address Information
      </h3>
      
      {/* Unit Number and Street Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="unit_number">
            Unit/House Number
          </label>
          <input
            type="text"
            name="unit_number"
            id="unit_number"
            placeholder="Unit 123, Blk 5"
            className="w-full px-3 sm:px-5 py-3 sm:py-5 text-sm sm:text-lg font-medium rounded-lg sm:rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-500"
            value={address.unit_number}
            onChange={handleChange}
          />
        </div>
        
        <div className="sm:col-span-2">
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="street_name">
            Street Name {required && <span className="text-red-600 text-sm sm:text-lg">*</span>}
            {required && !address.street_name && <span className="text-red-600 text-xs sm:text-sm ml-2 font-semibold">(Required)</span>}
          </label>
          <input
            type="text"
            name="street_name"
            id="street_name"
            placeholder="e.g., Rizal Street, EDSA"
            className={`w-full px-3 sm:px-5 py-3 sm:py-5 text-sm sm:text-lg font-medium rounded-lg sm:rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 ${
              required && !address.street_name ? 'border-red-400 bg-red-50' : 'border-gray-400 hover:border-gray-500'
            }`}
            value={address.street_name}
            onChange={handleChange}
            required={required}
          />
        </div>
      </div>

      {/* Region and Province */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="region">
            Region {required && <span className="text-red-600 text-sm sm:text-lg">*</span>}
            {required && !address.region && <span className="text-red-600 text-xs sm:text-sm ml-2 font-semibold">(Required)</span>}
          </label>
          <RegionDropdown
            value={address.region}
            onChange={(selectedOption) => handleDropdownChange('region', selectedOption)}
            placeholder="Select Region"
            className={`w-full ${required && !address.region ? 'border-red-400' : ''}`}
            error={required && !address.region}
          />
        </div>
        
        <div>
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="province">
            Province {required && <span className="text-red-600 text-sm sm:text-lg">*</span>}
            {required && !address.province && <span className="text-red-600 text-xs sm:text-sm ml-2 font-semibold">(Required)</span>}
          </label>
          <ProvinceDropdown
            value={address.province}
            onChange={(selectedOption) => handleDropdownChange('province', selectedOption)}
            placeholder="Select Province"
            className={`w-full ${required && !address.province ? 'border-red-400' : ''}`}
            disabled={!address.region}
            error={required && !address.province}
            region={address.region}
          />
          {!address.region && (
            <p className="text-sm text-gray-500 mt-1">Please select a region first</p>
          )}
        </div>
      </div>

      {/* City and Barangay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="cityVillage">
            City/Municipality {required && <span className="text-red-600 text-sm sm:text-lg">*</span>}
            {required && !address.cityVillage && <span className="text-red-600 text-xs sm:text-sm ml-2 font-semibold">(Required)</span>}
          </label>
          <CityDropdown
            value={address.cityVillage}
            onChange={(selectedOption) => handleDropdownChange('cityVillage', selectedOption)}
            placeholder="Select City/Municipality"
            className={`w-full ${required && !address.cityVillage ? 'border-red-400' : ''}`}
            disabled={!address.province}
            error={required && !address.cityVillage}
            province={address.province}
          />
          {!address.province && (
            <p className="text-sm text-gray-500 mt-1">Please select a province first</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="barangay">
            Barangay {required && <span className="text-red-600 text-sm sm:text-lg">*</span>}
            {required && !address.barangay && <span className="text-red-600 text-xs sm:text-sm ml-2 font-semibold">(Required)</span>}
          </label>
          <input
            type="text"
            name="barangay"
            id="barangay"
            placeholder="e.g., Poblacion, Barangay 1"
            className={`w-full px-3 sm:px-5 py-3 sm:py-5 text-sm sm:text-lg font-medium rounded-lg sm:rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 ${
              required && !address.barangay ? 'border-red-400 bg-red-50' : 'border-gray-400 hover:border-gray-500'
            }`}
            value={address.barangay}
            onChange={handleChange}
            required={required}
          />
        </div>
      </div>

      {/* Postal Code and Landmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="postal_code">
            Postal Code
          </label>
          <input
            type="text"
            name="postal_code"
            id="postal_code"
            placeholder="e.g., 1200, 6000"
            maxLength="10"
            className="w-full px-3 sm:px-5 py-3 sm:py-5 text-sm sm:text-lg font-medium rounded-lg sm:rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-500"
            value={address.postal_code}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="landmark">
            Landmark (Optional)
          </label>
          <input
            type="text"
            name="landmark"
            id="landmark"
            placeholder="e.g., Near SM Mall, Beside Jollibee"
            className="w-full px-3 sm:px-5 py-3 sm:py-5 text-sm sm:text-lg font-medium rounded-lg sm:rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-500"
            value={address.landmark}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Address Type */}
      {showAddressType && (
        <div>
          <label className="block text-sm sm:text-lg font-bold text-gray-800 mb-2" htmlFor="address_type">
            Address Type
          </label>
          <select
            name="address_type"
            id="address_type"
            className="w-full px-3 sm:px-5 py-3 sm:py-5 text-sm sm:text-lg font-medium rounded-lg sm:rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-500"
            value={address.address_type}
            onChange={handleChange}
          >
            {addressTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default AddressForm;
