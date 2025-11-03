import { useState, useCallback } from 'react';

/**
 * Custom hook for consistent error handling across components
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Execute an async operation with error handling
   * @param {Function} operation - Async operation to execute
   * @param {Object} options - Options for error handling
   */
  const executeWithErrorHandling = useCallback(async (operation, options = {}) => {
    const {
      loadingMessage = 'Loading...',
      errorContext = 'operation',
      onSuccess = null,
      onError = null,
      showLoading = true
    } = options;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const result = await operation();

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || `Failed to complete ${errorContext}`;
      console.error(`Error in ${errorContext}:`, err);
      
      setError(errorMessage);

      if (onError && typeof onError === 'function') {
        onError(err);
      }

      throw err; // Re-throw to allow caller to handle if needed
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set a custom error
   * @param {string|Error} errorMessage - Error message or Error object
   */
  const setCustomError = useCallback((errorMessage) => {
    const message = errorMessage instanceof Error ? errorMessage.message : errorMessage;
    setError(message);
  }, []);

  /**
   * Execute operation with retry capability
   * @param {Function} operation - Operation to execute
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Delay between retries in ms
   */
  const executeWithRetry = useCallback(async (operation, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await executeWithErrorHandling(operation, {
          errorContext: `operation (attempt ${attempt}/${maxRetries})`,
          showLoading: attempt === 1
        });
      } catch (err) {
        lastError = err;
        
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }, [executeWithErrorHandling]);

  return {
    error,
    loading,
    executeWithErrorHandling,
    executeWithRetry,
    clearError,
    setCustomError
  };
};