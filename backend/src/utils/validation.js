/**
 * Backend validation utilities
 */

/**
 * Validates that a field is not empty or whitespace-only
 * @param {string} value - The value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateNotEmpty = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      isValid: false,
      message: `${fieldName} cannot be empty or contain only spaces`
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates multiple required fields
 * @param {Object} data - Object containing field values
 * @param {Array} requiredFields - Array of objects with { key, name } properties
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateRequiredFields = (data, requiredFields) => {
  for (const field of requiredFields) {
    const validation = validateNotEmpty(data[field.key], field.name);
    if (!validation.isValid) {
      return validation;
    }
  }
  return { isValid: true, message: '' };
};

/**
 * Trims all string values in an object
 * @param {Object} data - Object to trim
 * @returns {Object} - Object with trimmed string values
 */
const trimObjectStrings = (data) => {
  const trimmed = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      trimmed[key] = value.trim();
    } else {
      trimmed[key] = value;
    }
  }
  return trimmed;
};

module.exports = {
  validateNotEmpty,
  validateRequiredFields,
  trimObjectStrings
};
