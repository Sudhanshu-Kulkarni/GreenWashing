/**
 * Data validation utilities for consistent data handling
 */

/**
 * Validate and sanitize array data
 * @param {any} data - Data to validate
 * @param {string} context - Context for logging
 * @returns {Array} Valid array or empty array
 */
export const validateArray = (data, context = 'unknown') => {
  try {
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn(`Invalid array data in ${context}:`, data);
    return [];
  } catch (error) {
    console.error(`Array validation error in ${context}:`, error);
    return [];
  }
};

/**
 * Validate and sanitize object data
 * @param {any} data - Data to validate
 * @param {Array} requiredFields - Required fields
 * @param {string} context - Context for logging
 * @returns {Object|null} Valid object or null
 */
export const validateObject = (data, requiredFields = [], context = 'unknown') => {
  try {
    if (!data || typeof data !== 'object') {
      console.warn(`Invalid object data in ${context}:`, data);
      return null;
    }
    
    const missingFields = requiredFields.filter(field => 
      !data.hasOwnProperty(field) || data[field] == null
    );
    
    if (missingFields.length > 0) {
      console.warn(`Missing required fields in ${context}:`, missingFields);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Object validation error in ${context}:`, error);
    return null;
  }
};

/**
 * Validate string data
 * @param {any} data - Data to validate
 * @param {string} fallback - Fallback value
 * @param {string} context - Context for logging
 * @returns {string} Valid string or fallback
 */
export const validateString = (data, fallback = '', context = 'unknown') => {
  try {
    if (typeof data === 'string' && data.trim().length > 0) {
      return data.trim();
    }
    
    if (data != null && data !== '') {
      console.warn(`Invalid string data in ${context}:`, data);
    }
    
    return fallback;
  } catch (error) {
    console.error(`String validation error in ${context}:`, error);
    return fallback;
  }
};

/**
 * Validate number data
 * @param {any} data - Data to validate
 * @param {number} fallback - Fallback value
 * @param {string} context - Context for logging
 * @returns {number} Valid number or fallback
 */
export const validateNumber = (data, fallback = 0, context = 'unknown') => {
  try {
    if (typeof data === 'number' && !isNaN(data)) {
      return data;
    }
    
    const parsed = parseFloat(data);
    if (!isNaN(parsed)) {
      return parsed;
    }
    
    if (data != null && data !== '') {
      console.warn(`Invalid number data in ${context}:`, data);
    }
    
    return fallback;
  } catch (error) {
    console.error(`Number validation error in ${context}:`, error);
    return fallback;
  }
};

/**
 * Validate date data
 * @param {any} data - Data to validate
 * @param {string} fallback - Fallback value
 * @param {string} context - Context for logging
 * @returns {string} Valid date string or fallback
 */
export const validateDate = (data, fallback = null, context = 'unknown') => {
  try {
    if (!data) {
      return fallback || new Date().toISOString();
    }
    
    const date = new Date(data);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    console.warn(`Invalid date data in ${context}:`, data);
    return fallback || new Date().toISOString();
  } catch (error) {
    console.error(`Date validation error in ${context}:`, error);
    return fallback || new Date().toISOString();
  }
};

/**
 * Validate enum value
 * @param {any} data - Data to validate
 * @param {Array} validValues - Array of valid values
 * @param {string} fallback - Fallback value
 * @param {string} context - Context for logging
 * @returns {string} Valid enum value or fallback
 */
export const validateEnum = (data, validValues = [], fallback = null, context = 'unknown') => {
  try {
    if (validValues.includes(data)) {
      return data;
    }
    
    console.warn(`Invalid enum value in ${context}:`, data, 'Valid values:', validValues);
    return fallback || (validValues.length > 0 ? validValues[0] : 'unknown');
  } catch (error) {
    console.error(`Enum validation error in ${context}:`, error);
    return fallback || 'unknown';
  }
};

/**
 * Safe JSON parse with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value
 * @param {string} context - Context for logging
 * @returns {any} Parsed object or fallback
 */
export const safeJsonParse = (jsonString, fallback = null, context = 'unknown') => {
  try {
    if (typeof jsonString !== 'string') {
      return fallback;
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`JSON parse error in ${context}:`, error);
    return fallback;
  }
};

/**
 * Safe JSON stringify with error handling
 * @param {any} data - Data to stringify
 * @param {string} fallback - Fallback value
 * @param {string} context - Context for logging
 * @returns {string} JSON string or fallback
 */
export const safeJsonStringify = (data, fallback = '{}', context = 'unknown') => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error(`JSON stringify error in ${context}:`, error);
    return fallback;
  }
};