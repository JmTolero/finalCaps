/**
 * Input validation utilities to prevent spaces and blank values
 */

/**
 * Handles input change with validation
 * Trims whitespace and prevents spaces in certain field types
 * @param {Event} e - Input event
 * @param {Function} setForm - State setter function
 * @param {Array} noSpaceFields - Fields that should not allow spaces (optional)
 */
export const handleValidatedChange = (e, setForm, noSpaceFields = []) => {
  const { id, value } = e.target;
  
  // Remove leading/trailing spaces and prevent multiple consecutive spaces
  let processedValue = value.trim();
  
  // For specific fields, prevent all spaces
  if (noSpaceFields.includes(id)) {
    processedValue = value.replace(/\s/g, '');
  } else {
    // For other fields, replace multiple spaces with single space
    processedValue = value.replace(/\s+/g, ' ');
  }
  
  setForm(prev => ({ ...prev, [id]: processedValue }));
};

/**
 * Validates form data to ensure no empty or whitespace-only values
 * @param {Object} formData - Form data object
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateFormData = (formData, requiredFields) => {
  for (const field of requiredFields) {
    const value = formData[field];
    
    // Check if field is empty or contains only whitespace
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        isValid: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty or contain only spaces`
      };
    }
  }
  
  return { isValid: true, message: '' };
};

/**
 * Trims all string values in form data
 * @param {Object} formData - Form data object
 * @returns {Object} - Trimmed form data
 */
export const trimFormData = (formData) => {
  const trimmedData = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      trimmedData[key] = value.trim();
    } else {
      trimmedData[key] = value;
    }
  }
  
  return trimmedData;
};
