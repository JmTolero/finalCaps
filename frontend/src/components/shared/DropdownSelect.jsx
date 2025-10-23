import React, { useState, useEffect } from 'react';
import { 
  PHILIPPINE_CITIES_MUNICIPALITIES, 
  PHILIPPINE_PROVINCES, 
  getCitiesByProvince,
  searchCities,
  searchProvinces 
} from '../../data/philippinesData';

const DropdownSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  searchable = true,
  className = "",
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (searchable && searchTerm) {
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options, searchable]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const selectedOption = options.find(option => option.name === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                    ${selectedOption?.name === option.name ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                  `}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{option.name}</span>
                    {option.province && (
                      <span className="text-xs text-gray-500">{option.province}</span>
                    )}
                    {option.region && (
                      <span className="text-xs text-gray-400">{option.region}</span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ProvinceDropdown = ({ 
  value, 
  onChange, 
  placeholder = "Select Province", 
  className = "",
  disabled = false,
  error = false,
  region = null 
}) => {
  const [provinces, setProvinces] = useState(PHILIPPINE_PROVINCES);

  useEffect(() => {
    if (region) {
      const filteredProvinces = PHILIPPINE_PROVINCES.filter(province => province.region === region);
      setProvinces(filteredProvinces);
    } else {
      setProvinces(PHILIPPINE_PROVINCES);
    }
  }, [region]);

  return (
    <DropdownSelect
      options={provinces}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchable={true}
      className={className}
      disabled={disabled}
      error={error}
    />
  );
};

export const CityDropdown = ({ 
  value, 
  onChange, 
  placeholder = "Select City/Municipality", 
  className = "",
  disabled = false,
  error = false,
  province = null,
  region = null 
}) => {
  const [cities, setCities] = useState(PHILIPPINE_CITIES_MUNICIPALITIES);

  useEffect(() => {
    let filteredCities = PHILIPPINE_CITIES_MUNICIPALITIES;

    if (province) {
      filteredCities = filteredCities.filter(city => city.province === province);
    } else if (region) {
      filteredCities = filteredCities.filter(city => city.region === region);
    }

    setCities(filteredCities);
  }, [province, region]);

  return (
    <DropdownSelect
      options={cities}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchable={true}
      className={className}
      disabled={disabled}
      error={error}
    />
  );
};

export const RegionDropdown = ({ 
  value, 
  onChange, 
  placeholder = "Select Region", 
  className = "",
  disabled = false,
  error = false 
}) => {
  const regions = [
    { name: 'NCR', region: 'NCR' },
    { name: 'Region I - Ilocos Region', region: 'Region I' },
    { name: 'Region II - Cagayan Valley', region: 'Region II' },
    { name: 'Region III - Central Luzon', region: 'Region III' },
    { name: 'Region IV-A - CALABARZON', region: 'Region IV-A' },
    { name: 'Region IV-B - MIMAROPA', region: 'Region IV-B' },
    { name: 'Region V - Bicol Region', region: 'Region V' },
    { name: 'Region VI - Western Visayas', region: 'Region VI' },
    { name: 'Region VII - Central Visayas', region: 'Region VII' },
    { name: 'Region VIII - Eastern Visayas', region: 'Region VIII' },
    { name: 'Region IX - Zamboanga Peninsula', region: 'Region IX' },
    { name: 'Region X - Northern Mindanao', region: 'Region X' },
    { name: 'Region XI - Davao Region', region: 'Region XI' },
    { name: 'Region XII - SOCCSKSARGEN', region: 'Region XII' },
    { name: 'Region XIII - Caraga', region: 'Region XIII' },
    { name: 'ARMM - Autonomous Region in Muslim Mindanao', region: 'ARMM' },
    { name: 'CAR - Cordillera Administrative Region', region: 'CAR' }
  ];

  // Find the display name for the current value (which is a region code)
  const currentRegion = regions.find(r => r.region === value);
  const displayValue = currentRegion ? currentRegion.name : value;

  return (
    <DropdownSelect
      options={regions}
      value={displayValue}
      onChange={onChange}
      placeholder={placeholder}
      searchable={true}
      className={className}
      disabled={disabled}
      error={error}
    />
  );
};

export default DropdownSelect;
