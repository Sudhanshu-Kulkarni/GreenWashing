/**
 * Navigation utilities for safe navigation with error handling
 */

/**
 * Safely navigate to a screen with error handling
 * @param {Object} navigation - React Navigation object
 * @param {string} screenName - Name of the screen to navigate to
 * @param {Object} params - Navigation parameters
 * @param {Function} onError - Optional error callback
 */
export const safeNavigate = (navigation, screenName, params = {}, onError = null) => {
  try {
    if (!navigation || typeof navigation.navigate !== 'function') {
      throw new Error('Invalid navigation object provided');
    }
    
    if (!screenName || typeof screenName !== 'string') {
      throw new Error('Invalid screen name provided');
    }
    
    navigation.navigate(screenName, params);
  } catch (error) {
    console.error(`Navigation error to ${screenName}:`, error);
    if (onError && typeof onError === 'function') {
      onError(error);
    }
  }
};

/**
 * Safely go back with error handling
 * @param {Object} navigation - React Navigation object
 * @param {Function} onError - Optional error callback
 */
export const safeGoBack = (navigation, onError = null) => {
  try {
    if (!navigation || typeof navigation.goBack !== 'function') {
      throw new Error('Invalid navigation object provided');
    }
    
    navigation.goBack();
  } catch (error) {
    console.error('Navigation goBack error:', error);
    if (onError && typeof onError === 'function') {
      onError(error);
    }
  }
};

/**
 * Validate navigation parameters
 * @param {Object} params - Parameters to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {boolean} True if valid, false otherwise
 */
export const validateNavigationParams = (params, requiredFields = []) => {
  try {
    if (!params || typeof params !== 'object') {
      return false;
    }
    
    return requiredFields.every(field => 
      params.hasOwnProperty(field) && params[field] != null
    );
  } catch (error) {
    console.error('Parameter validation error:', error);
    return false;
  }
};

/**
 * Create safe navigation parameters for document-related screens
 * @param {Object} document - Document object
 * @param {Object} additionalParams - Additional parameters
 * @returns {Object} Safe navigation parameters
 */
export const createDocumentNavParams = (document, additionalParams = {}) => {
  try {
    if (!document || !document.id) {
      throw new Error('Invalid document provided for navigation');
    }
    
    return {
      documentId: document.id,
      document: document,
      ...additionalParams
    };
  } catch (error) {
    console.error('Error creating document navigation parameters:', error);
    return null;
  }
};

/**
 * Create safe navigation parameters for claim-related screens
 * @param {Object} claim - Claim object
 * @param {Object} document - Document object
 * @param {Object} additionalParams - Additional parameters
 * @returns {Object} Safe navigation parameters
 */
export const createClaimNavParams = (claim, document, additionalParams = {}) => {
  try {
    if (!claim || !claim.id) {
      throw new Error('Invalid claim provided for navigation');
    }
    
    if (!document || !document.id) {
      throw new Error('Invalid document provided for navigation');
    }
    
    return {
      documentId: document.id,
      document: document,
      claimId: claim.id,
      ...additionalParams
    };
  } catch (error) {
    console.error('Error creating claim navigation parameters:', error);
    return null;
  }
};