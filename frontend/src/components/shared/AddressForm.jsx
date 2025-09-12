import React, { useState } from 'react';

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

  // Philippine regions for dropdown
  const philippineRegions = [
    'National Capital Region (NCR)',
    'Cordillera Administrative Region (CAR)',
    'Ilocos Region (Region I)',
    'Cagayan Valley (Region II)',
    'Central Luzon (Region III)',
    'Calabarzon (Region IV-A)',
    'Mimaropa (Region IV-B)',
    'Bicol Region (Region V)',
    'Western Visayas (Region VI)',
    'Central Visayas (Region VII)',
    'Eastern Visayas (Region VIII)',
    'Zamboanga Peninsula (Region IX)',
    'Northern Mindanao (Region X)',
    'Davao Region (Region XI)',
    'Soccsksargen (Region XII)',
    'Caraga (Region XIII)',
    'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)'
  ];

  const addressTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'business', label: 'Business' },
    { value: 'warehouse', label: 'Warehouse' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {labelPrefix}Address Information
      </h3>
      
      {/* Unit Number and Street Name */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="unit_number">
            Unit/House Number
          </label>
          <input
            type="text"
            name="unit_number"
            id="unit_number"
            placeholder="Unit 123, Blk 5"
            className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            value={address.unit_number}
            onChange={handleChange}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-1" htmlFor="street_name">
            Street Name {required && <span className="text-red-500">*</span>}
            {required && !address.street_name && <span className="text-red-500 text-xs ml-2">(Required)</span>}
          </label>
          <input
            type="text"
            name="street_name"
            id="street_name"
            placeholder="e.g., Rizal Street, EDSA"
            className={`w-full px-4 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white ${
              required && !address.street_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            value={address.street_name}
            onChange={handleChange}
            required={required}
          />
        </div>
      </div>

      {/* Barangay and City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="barangay">
            Barangay {required && <span className="text-red-500">*</span>}
            {required && !address.barangay && <span className="text-red-500 text-xs ml-2">(Required)</span>}
          </label>
          <input
            type="text"
            name="barangay"
            id="barangay"
            placeholder="e.g., Poblacion, Barangay 1"
            className={`w-full px-4 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white ${
              required && !address.barangay ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            value={address.barangay}
            onChange={handleChange}
            required={required}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="cityVillage">
            City/Municipality {required && <span className="text-red-500">*</span>}
            {required && !address.cityVillage && <span className="text-red-500 text-xs ml-2">(Required)</span>}
          </label>
          <input
            type="text"
            name="cityVillage"
            id="cityVillage"
            placeholder="e.g., Makati City, Quezon City"
            className={`w-full px-4 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white ${
              required && !address.cityVillage ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            value={address.cityVillage}
            onChange={handleChange}
            required={required}
          />
        </div>
      </div>

      {/* Province and Region */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="province">
            Province {required && <span className="text-red-500">*</span>}
            {required && !address.province && <span className="text-red-500 text-xs ml-2">(Required)</span>}
          </label>
          <input
            type="text"
            name="province"
            id="province"
            placeholder="e.g., Metro Manila, Cebu"
            className={`w-full px-4 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white ${
              required && !address.province ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            value={address.province}
            onChange={handleChange}
            required={required}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="region">
            Region {required && <span className="text-red-500">*</span>}
            {required && !address.region && <span className="text-red-500 text-xs ml-2">(Required)</span>}
          </label>
          <select
            name="region"
            id="region"
            className={`w-full px-4 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white ${
              required && !address.region ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            value={address.region}
            onChange={handleChange}
            required={required}
          >
            <option value="">Select Region</option>
            {philippineRegions.map((region, index) => (
              <option key={index} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Postal Code and Landmark */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="postal_code">
            Postal Code
          </label>
          <input
            type="text"
            name="postal_code"
            id="postal_code"
            placeholder="e.g., 1200, 6000"
            maxLength="10"
            className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            value={address.postal_code}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="landmark">
            Landmark (Optional)
          </label>
          <input
            type="text"
            name="landmark"
            id="landmark"
            placeholder="e.g., Near SM Mall, Beside Jollibee"
            className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            value={address.landmark}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Address Type */}
      {showAddressType && (
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="address_type">
            Address Type
          </label>
          <select
            name="address_type"
            id="address_type"
            className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
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
