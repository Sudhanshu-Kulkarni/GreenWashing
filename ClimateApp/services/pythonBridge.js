// Python Bridge Service for ESG Claim Verification
// This service handles communication between React Native and Python NLP backend

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Custom error class for Python bridge operations
 */
class PythonBridgeError extends Error {
  constructor(message, code = 'PYTHON_BRIDGE_ERROR', details = null) {
    super(message);
    this.name = 'PythonBridgeError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  /**
   * Get user-friendly error message
   * @returns {string} User-friendly message
   */
  getUserMessage() {
    const userMessages = {
      'PYTHON_NOT_AVAILABLE': 'The document processing service is currently unavailable. Please try again later.',
      'FILE_NOT_FOUND': 'The selected file could not be found. Please select the file again.',
      'FILE_TOO_LARGE': 'The file is too large to process. Please select a smaller file (under 50MB).',
      'UNSUPPORTED_FILE_TYPE': 'Only PDF files are supported. Please select a PDF file.',
      'TIMEOUT_ERROR': 'Document processing is taking longer than expected. Please try again with a smaller file.',
      'DISK_SPACE_ERROR': 'Not enough storage space available for processing. Please free up some space and try again.',
      'PERMISSION_ERROR': 'Unable to access the file. Please check file permissions and try again.',
      'NETWORK_ERROR': 'Network connection issue. Please check your connection and try again.',
      'MEMORY_ERROR': 'Not enough memory available for processing. Please close other apps and try again.',
      'INVALID_RESPONSE': 'Processing completed but results are corrupted. Please try again.',
      'PROCESSING_FAILED': 'Document processing failed. Please try again or contact support.',
    };

    return userMessages[this.code] || this.message || 'An unexpected error occurred during processing.';
  }

  /**
   * Check if error is retryable
   * @returns {boolean} True if error can be retried
   */
  isRetryable() {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'MEMORY_ERROR',
      'DISK_SPACE_ERROR',
      'PROCESSING_FAILED',
    ];

    return retryableCodes.includes(this.code);
  }
}

export class PythonBridge {
  // Processing status constants
  static ProcessingStatus = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
  };

  // Error types for Python bridge operations
  static ErrorTypes = {
    PYTHON_NOT_AVAILABLE: 'PYTHON_NOT_AVAILABLE',
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    PROCESSING_FAILED: 'PROCESSING_FAILED',
    INVALID_RESPONSE: 'INVALID_RESPONSE',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    MEMORY_ERROR: 'MEMORY_ERROR',
    DISK_SPACE_ERROR: 'DISK_SPACE_ERROR',
    MODEL_LOAD_ERROR: 'MODEL_LOAD_ERROR',
    PDF_EXTRACTION_ERROR: 'PDF_EXTRACTION_ERROR',
    VERIFICATION_ERROR: 'VERIFICATION_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  };

  // Shared directories for file communication
  static SharedPaths = {
    uploads: `${FileSystem.documentDirectory}shared/uploads/`,
    processing: `${FileSystem.documentDirectory}shared/processing/`,
    results: `${FileSystem.documentDirectory}shared/results/`,
    status: `${FileSystem.documentDirectory}shared/status/`,
  };

  /**
   * Initialize shared directories for Python communication
   * For HTTP API mode, we don't need actual directories
   */
  static async initializeSharedDirectories() {
    try {
      // For HTTP API mode, we don't need to create actual directories
      // Just return success since we're communicating via HTTP
      console.info('Using HTTP API mode - no local directories needed');
      return true;
    } catch (error) {
      console.error('Error initializing shared directories:', error);
      throw new Error(this.ErrorTypes.PERMISSION_ERROR);
    }
  }

  /**
   * Check if Python backend is available
   * @returns {Promise<boolean>} True if Python is available
   */
  static async isPythonAvailable() {
    try {
      // For now, we'll assume Python is available if we can create directories
      // In a real implementation, this would check for Python installation
      await this.initializeSharedDirectories();
      
      // Check if Python NLP processor exists
      const pythonScriptPath = '../python_backend/nlp_processor.py';
      // Note: In React Native, we can't directly check file existence outside the app bundle
      // This would need to be implemented based on the deployment strategy
      
      return true;
    } catch (error) {
      console.error('Python backend not available:', error);
      return false;
    }
  }

  /**
   * Process a PDF document using Python NLP pipeline
   * @param {string} filePath - Path to the PDF file
   * @param {string} fileName - Original filename
   * @param {string} companyName - Company name extracted from filename
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Processing results
   */
  static async processDocument(filePath, fileName, companyName, onProgress = null) {
    let jobId = null;
    let uploadPath = null;
    let requestPath = null;

    try {
      // Comprehensive input validation
      const validationResult = this.validateProcessingInputs(filePath, fileName, companyName);
      if (!validationResult.isValid) {
        throw new PythonBridgeError(validationResult.error, validationResult.code);
      }

      // Check system requirements
      await this.validateSystemRequirements();

      // Generate unique job ID
      jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (onProgress) onProgress(5, 'Initializing processing');

      // Verify file exists and is accessible
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new PythonBridgeError(`File not found: ${filePath}`, this.ErrorTypes.FILE_NOT_FOUND);
      }

      // Check file size
      if (fileInfo.size > 50 * 1024 * 1024) { // 50MB limit
        throw new PythonBridgeError('File size exceeds 50MB limit', this.ErrorTypes.FILE_TOO_LARGE, {
          fileSize: fileInfo.size,
          maxSize: 50 * 1024 * 1024
        });
      }

      // Copy file to shared uploads directory with error handling
      uploadPath = `${this.SharedPaths.uploads}${jobId}_${fileName}`;
      try {
        await FileSystem.copyAsync({
          from: filePath,
          to: uploadPath,
        });
      } catch (copyError) {
        throw new PythonBridgeError('Failed to copy file to processing directory', this.ErrorTypes.PERMISSION_ERROR, {
          originalError: copyError.message,
          sourcePath: filePath,
          targetPath: uploadPath
        });
      }

      if (onProgress) onProgress(10, 'File uploaded successfully');

      // Create processing request file
      const requestData = {
        jobId,
        fileName,
        companyName,
        uploadPath,
        timestamp: new Date().toISOString(),
        fileSize: fileInfo.size,
        processingTimeout: 300000, // 5 minutes
      };

      requestPath = `${this.SharedPaths.processing}${jobId}_request.json`;
      try {
        await FileSystem.writeAsStringAsync(requestPath, JSON.stringify(requestData, null, 2));
      } catch (writeError) {
        throw new PythonBridgeError('Failed to create processing request', this.ErrorTypes.PERMISSION_ERROR, {
          originalError: writeError.message,
          requestPath
        });
      }

      if (onProgress) onProgress(15, 'Processing request created');

      // Execute Python processing script with timeout
      const result = await Promise.race([
        this.executePythonProcessing(jobId, requestData, onProgress),
        this.createTimeoutPromise(requestData.processingTimeout, jobId)
      ]);

      // Final validation of results
      if (!this.validateProcessingResults(result)) {
        throw new PythonBridgeError('Processing completed but results are invalid', this.ErrorTypes.INVALID_RESPONSE, {
          result: result
        });
      }

      return result;

    } catch (error) {
      console.error('Error processing document:', error);

      // Enhanced error logging
      const errorDetails = {
        jobId,
        fileName,
        companyName,
        uploadPath,
        requestPath,
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
      };

      // Log error details for debugging
      console.error('Processing error details:', errorDetails);

      // Clean up on error
      await this.cleanupOnError(jobId, uploadPath, requestPath);

      // Re-throw with enhanced error information
      if (error instanceof PythonBridgeError) {
        throw error;
      }

      throw new PythonBridgeError('Document processing failed', this.ErrorTypes.PROCESSING_FAILED, {
        originalError: error.message,
        ...errorDetails
      });
    }
  }

  /**
   * Validate processing inputs
   * @param {string} filePath - File path
   * @param {string} fileName - File name
   * @param {string} companyName - Company name
   * @returns {Object} Validation result
   */
  static validateProcessingInputs(filePath, fileName, companyName) {
    if (!filePath || typeof filePath !== 'string') {
      return { isValid: false, error: 'File path is required and must be a string', code: this.ErrorTypes.INVALID_INPUT };
    }

    if (!fileName || typeof fileName !== 'string') {
      return { isValid: false, error: 'File name is required and must be a string', code: this.ErrorTypes.INVALID_INPUT };
    }

    if (!companyName || typeof companyName !== 'string') {
      return { isValid: false, error: 'Company name is required and must be a string', code: this.ErrorTypes.INVALID_INPUT };
    }

    // Check file extension
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return { isValid: false, error: 'Only PDF files are supported', code: this.ErrorTypes.UNSUPPORTED_FILE_TYPE };
    }

    // Check for dangerous characters in paths
    const dangerousChars = /[<>:"|?*]/;
    if (dangerousChars.test(fileName)) {
      return { isValid: false, error: 'File name contains invalid characters', code: this.ErrorTypes.INVALID_INPUT };
    }

    return { isValid: true };
  }

  /**
   * Validate system requirements
   * @returns {Promise<void>} Throws if requirements not met
   */
  static async validateSystemRequirements() {
    try {
      // Check if Python is available
      const pythonAvailable = await this.isPythonAvailable();
      if (!pythonAvailable) {
        throw new PythonBridgeError('Python backend is not available', this.ErrorTypes.PYTHON_NOT_AVAILABLE);
      }

      // Check available disk space
      const freeSpace = await this.getAvailableDiskSpace();
      if (freeSpace < 200 * 1024 * 1024) { // 200MB minimum
        throw new PythonBridgeError('Insufficient disk space for processing', this.ErrorTypes.DISK_SPACE_ERROR, {
          availableSpace: freeSpace,
          requiredSpace: 200 * 1024 * 1024
        });
      }

    } catch (error) {
      if (error instanceof PythonBridgeError) {
        throw error;
      }
      throw new PythonBridgeError('System requirements validation failed', this.ErrorTypes.CONFIGURATION_ERROR, {
        originalError: error.message
      });
    }
  }

  /**
   * Get available disk space
   * @returns {Promise<number>} Available space in bytes
   */
  static async getAvailableDiskSpace() {
    try {
      // This is a simplified implementation
      // In production, you'd use a proper disk space API
      return 1024 * 1024 * 1024; // Assume 1GB available
    } catch (error) {
      console.warn('Could not check disk space:', error);
      return 1024 * 1024 * 1024; // Default to 1GB
    }
  }

  /**
   * Create a timeout promise
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} jobId - Job identifier
   * @returns {Promise} Promise that rejects after timeout
   */
  static createTimeoutPromise(timeout, jobId) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new PythonBridgeError(`Processing timeout after ${timeout}ms`, this.ErrorTypes.TIMEOUT_ERROR, {
          jobId,
          timeout
        }));
      }, timeout);
    });
  }

  /**
   * Clean up files on error
   * @param {string} jobId - Job identifier
   * @param {string} uploadPath - Upload file path
   * @param {string} requestPath - Request file path
   */
  static async cleanupOnError(jobId, uploadPath, requestPath) {
    try {
      const cleanupPromises = [];

      if (uploadPath) {
        cleanupPromises.push(
          FileSystem.getInfoAsync(uploadPath).then(info => {
            if (info.exists) {
              return FileSystem.deleteAsync(uploadPath);
            }
          }).catch(err => console.warn('Failed to cleanup upload file:', err))
        );
      }

      if (requestPath) {
        cleanupPromises.push(
          FileSystem.getInfoAsync(requestPath).then(info => {
            if (info.exists) {
              return FileSystem.deleteAsync(requestPath);
            }
          }).catch(err => console.warn('Failed to cleanup request file:', err))
        );
      }

      if (jobId) {
        cleanupPromises.push(
          this.cleanupJob(jobId).catch(err => console.warn('Failed to cleanup job:', err))
        );
      }

      await Promise.all(cleanupPromises);
      console.info('Error cleanup completed');

    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }

  /**
   * Execute Python processing script with real NLP pipeline
   * @param {string} jobId - Job identifier
   * @param {Object} requestData - Processing request data
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Processing results from Python
   */
  static async executePythonProcessing(jobId, requestData, onProgress) {
    try {
      // Create status monitoring
      const statusPath = `${this.SharedPaths.status}${jobId}_status.json`;
      
      // Start Python processing script
      const pythonCommand = this.buildPythonCommand(jobId, requestData);
      
      if (onProgress) onProgress(5, 'Starting Python processing');
      
      // Execute Python script
      const results = await this.runPythonScript(pythonCommand, jobId, onProgress);
      
      // Validate results
      if (!this.validateProcessingResults(results)) {
        throw new Error('Invalid processing results from Python');
      }
      
      // Save results to shared directory
      const resultsPath = `${this.SharedPaths.results}${jobId}_results.json`;
      await FileSystem.writeAsStringAsync(resultsPath, JSON.stringify(results));
      
      if (onProgress) onProgress(100, 'Processing completed');
      
      return results;
      
    } catch (error) {
      console.error('Error in Python processing:', error);
      throw new Error(this.ErrorTypes.PROCESSING_FAILED);
    }
  }

  /**
   * Build Python command for document processing
   * @param {string} jobId - Job identifier
   * @param {Object} requestData - Processing request data
   * @returns {Array} Command array for execution
   */
  static buildPythonCommand(jobId, requestData) {
    // Path to Python script (relative to app bundle)
    const pythonScriptPath = '../python_backend/process_document.py';
    
    return [
      'python3',
      pythonScriptPath,
      requestData.uploadPath,
      '--company-name', requestData.companyName,
      '--job-id', jobId,
      '--output-dir', this.SharedPaths.results,
      '--status-dir', this.SharedPaths.status,
      '--verbose'
    ];
  }

  /**
   * Run Python processing via HTTP API server
   * @param {string} filePath - Path to the PDF file
   * @param {string} fileName - Original filename
   * @param {string} companyName - Company name
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Processing results
   */
  static async runPythonScript(filePath, fileName, companyName, onProgress) {
    try {
      // Check if API server is available
      const apiUrl = this.getApiUrl();
      
      if (onProgress) onProgress(5, 'Connecting to processing server');
      
      // Check server health first
      const healthCheck = await this.checkServerHealth(apiUrl);
      if (!healthCheck.healthy) {
        throw new PythonBridgeError('Python API server is not available', this.ErrorTypes.PYTHON_NOT_AVAILABLE, {
          serverUrl: apiUrl,
          healthStatus: healthCheck
        });
      }
      
      if (onProgress) onProgress(10, 'Uploading document to server');
      
      // Upload and process document via HTTP API
      const results = await this.processDocumentViaAPI(apiUrl, filePath, fileName, companyName, onProgress);
      
      if (onProgress) onProgress(100, 'Processing completed');
      
      return results;
      
    } catch (error) {
      console.error('Error in Python API processing:', error);
      throw error;
    }
  }

  /**
   * Monitor status file for progress updates
   * @param {string} jobId - Job identifier
   * @param {Function} onProgress - Progress callback
   * @returns {number} Interval ID for cleanup
   */
  static monitorStatusFile(jobId, onProgress) {
    const statusPath = `${this.SharedPaths.status}${jobId}_status.json`;
    
    return setInterval(async () => {
      try {
        const statusInfo = await FileSystem.getInfoAsync(statusPath);
        if (statusInfo.exists) {
          const statusContent = await FileSystem.readAsStringAsync(statusPath);
          const status = JSON.parse(statusContent);
          
          if (onProgress && status.progress !== undefined) {
            const progress = Math.round(status.progress * 100);
            onProgress(progress, status.current_step || 'Processing');
          }
        }
      } catch (error) {
        // Ignore errors in status monitoring
        console.debug('Status monitoring error:', error);
      }
    }, 1000);
  }

  /**
   * Simulate realistic processing with proper data structure
   * @param {string} jobId - Job identifier
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Realistic processing results
   */
  static async simulateRealisticProcessing(jobId, onProgress) {
    try {
      // Simulate processing steps with realistic timing
      const steps = [
        { name: 'Initializing components', progress: 10, duration: 2000 },
        { name: 'Extracting text from PDF', progress: 25, duration: 3000 },
        { name: 'Classifying claims with BERT model', progress: 50, duration: 5000 },
        { name: 'Processing detected claims', progress: 65, duration: 2000 },
        { name: 'Verifying claims against ESG data', progress: 85, duration: 4000 },
        { name: 'Formatting results', progress: 95, duration: 1000 },
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.duration));
        if (onProgress) onProgress(step.progress, step.name);
      }

      // Generate realistic results structure
      const results = {
        job_id: jobId,
        document_info: {
          filename: 'sample_sustainability_report.pdf',
          company_name: 'Sample Company',
          total_sentences: 127,
          processing_time: 18.5,
        },
        claims: [
          {
            id: 1,
            text: 'We reduced our carbon emissions by 25% compared to 2020 baseline.',
            confidence: 0.92,
            extracted_data: {
              metric: 'carbon_emissions',
              value: 25,
              unit: 'percent',
              year: 2020,
              percentage: true
            },
            verification_status: 'verified',
            verification_confidence: 0.85,
            match_details: {
              csv_match: true,
              tolerance_check: true,
              reasoning: 'Found matching data in ESG database with 23% reduction reported',
              matched_data: {
                company: 'Sample Company',
                year: 2020,
                metric: 'emissions_reduction_percent',
                value: 23,
                source: 'CDP'
              }
            }
          },
          {
            id: 2,
            text: 'Our renewable energy usage increased to 78% of total consumption.',
            confidence: 0.88,
            extracted_data: {
              metric: 'renewable_energy',
              value: 78,
              unit: 'percent',
              year: null,
              percentage: true
            },
            verification_status: 'questionable',
            verification_confidence: 0.65,
            match_details: {
              csv_match: true,
              tolerance_check: false,
              reasoning: 'ESG database shows 65% renewable energy, difference of 13% exceeds tolerance',
              matched_data: {
                company: 'Sample Company',
                year: 2023,
                metric: 'renewable_energy_percent',
                value: 65,
                source: 'Sustainability Report'
              }
            }
          },
          {
            id: 3,
            text: 'We achieved zero waste to landfill across all manufacturing facilities.',
            confidence: 0.79,
            extracted_data: {
              metric: 'waste_to_landfill',
              value: 0,
              unit: 'percent',
              year: null,
              percentage: false
            },
            verification_status: 'unverified',
            verification_confidence: 0.2,
            match_details: {
              csv_match: false,
              tolerance_check: false,
              reasoning: 'No matching waste data found in ESG database for this company',
              matched_data: null
            }
          }
        ],
        summary: {
          total_claims: 3,
          verified: 1,
          questionable: 1,
          unverified: 1
        },
        processing_status: {
          current_step: 'Complete',
          progress: 1.0,
          duration: 18.5,
          errors: [],
          warnings: []
        },
        model_info: {
          model_path: 'trained_llm_for_claim_classification/best_finetuned_model',
          csv_path: 'esg_lookup_2020_2025.csv',
          confidence_threshold: 0.7
        },
        status: 'completed',
        timestamp: new Date().toISOString(),
      };

      return results;

    } catch (error) {
      console.error('Error in realistic processing simulation:', error);
      throw error;
    }
  }

  /**
   * Get processing status for a job
   * @param {string} jobId - Job identifier
   * @returns {Promise<Object>} Status information
   */
  static async getProcessingStatus(jobId) {
    try {
      if (!jobId) {
        throw new Error('Job ID is required');
      }

      // Check for status file
      const statusPath = `${this.SharedPaths.status}${jobId}_status.json`;
      const statusInfo = await FileSystem.getInfoAsync(statusPath);

      if (statusInfo.exists) {
        const statusContent = await FileSystem.readAsStringAsync(statusPath);
        return JSON.parse(statusContent);
      }

      // Check for results file
      const resultsPath = `${this.SharedPaths.results}${jobId}_results.json`;
      const resultsInfo = await FileSystem.getInfoAsync(resultsPath);

      if (resultsInfo.exists) {
        return {
          jobId,
          status: this.ProcessingStatus.COMPLETED,
          progress: 100,
          message: 'Processing completed',
        };
      }

      // Check for processing request
      const requestPath = `${this.SharedPaths.processing}${jobId}_request.json`;
      const requestInfo = await FileSystem.getInfoAsync(requestPath);

      if (requestInfo.exists) {
        return {
          jobId,
          status: this.ProcessingStatus.PROCESSING,
          progress: 50,
          message: 'Processing in progress',
        };
      }

      return {
        jobId,
        status: this.ProcessingStatus.IDLE,
        progress: 0,
        message: 'Job not found',
      };

    } catch (error) {
      console.error('Error getting processing status:', error);
      return {
        jobId,
        status: this.ProcessingStatus.ERROR,
        progress: 0,
        message: error.message,
      };
    }
  }

  /**
   * Get processing results for a completed job
   * @param {string} jobId - Job identifier
   * @returns {Promise<Object|null>} Processing results or null if not found
   */
  static async getProcessingResults(jobId) {
    try {
      if (!jobId) {
        throw new Error('Job ID is required');
      }

      const resultsPath = `${this.SharedPaths.results}${jobId}_results.json`;
      const resultsInfo = await FileSystem.getInfoAsync(resultsPath);

      if (!resultsInfo.exists) {
        console.warn('Results file not found for job:', jobId);
        return null;
      }

      const resultsContent = await FileSystem.readAsStringAsync(resultsPath);
      const results = JSON.parse(resultsContent);

      // Validate results structure
      if (!results.document_info || !Array.isArray(results.claims)) {
        throw new Error(this.ErrorTypes.INVALID_RESPONSE);
      }

      return results;

    } catch (error) {
      console.error('Error getting processing results:', error);
      throw error;
    }
  }

  /**
   * Clean up processing files for a job
   * @param {string} jobId - Job identifier
   * @returns {Promise<boolean>} True if cleanup successful
   */
  static async cleanupJob(jobId) {
    try {
      if (!jobId) {
        return false;
      }

      const filesToCleanup = [
        `${this.SharedPaths.uploads}${jobId}_*`,
        `${this.SharedPaths.processing}${jobId}_*`,
        `${this.SharedPaths.results}${jobId}_*`,
        `${this.SharedPaths.status}${jobId}_*`,
      ];

      // Note: FileSystem doesn't support glob patterns
      // In a real implementation, we'd need to list directory contents and filter
      console.info('Cleanup requested for job:', jobId);
      
      return true;

    } catch (error) {
      console.error('Error cleaning up job files:', error);
      return false;
    }
  }

  /**
   * Execute Python script directly (platform-specific implementation needed)
   * @param {string} scriptPath - Path to Python script
   * @param {Array} args - Script arguments
   * @returns {Promise<Object>} Execution results
   */
  static async executePythonScript(scriptPath, args = []) {
    try {
      // This would need platform-specific implementation
      if (Platform.OS === 'web') {
        throw new Error('Python execution not supported on web platform');
      }

      // For mobile platforms, this would require:
      // 1. Embedded Python runtime (like Kivy's python-for-android)
      // 2. Native module bridge
      // 3. Or server-based processing

      console.warn('Direct Python execution not implemented - using file-based communication');
      throw new Error(this.ErrorTypes.PYTHON_NOT_AVAILABLE);

    } catch (error) {
      console.error('Error executing Python script:', error);
      throw error;
    }
  }

  /**
   * Monitor processing queue and update status
   * @returns {Promise<Array>} List of active jobs
   */
  static async monitorProcessingQueue() {
    try {
      await this.initializeSharedDirectories();

      // List processing directory contents
      const processingDir = await FileSystem.readDirectoryAsync(this.SharedPaths.processing);
      const activeJobs = [];

      for (const file of processingDir) {
        if (file.endsWith('_request.json')) {
          const jobId = file.replace('_request.json', '');
          const status = await this.getProcessingStatus(jobId);
          activeJobs.push(status);
        }
      }

      return activeJobs;

    } catch (error) {
      console.error('Error monitoring processing queue:', error);
      return [];
    }
  }

  /**
   * Get API server URL
   * @returns {string} API server URL
   */
  static getApiUrl() {
    // In development, use the actual server IP
    // In production, this would be your deployed server URL
    const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Use the actual IP address where the Python server is running
      // This matches the server output: "Running on http://192.168.1.5:8000"
      return 'http://192.168.1.5:8000';
    } else {
      // Production API URL - replace with your deployed server
      return process.env.REACT_APP_API_URL || 'https://esg-climate-api.onrender.com';
    }
  }

  /**
   * Check if API server is healthy
   * @param {string} apiUrl - API server URL
   * @returns {Promise<Object>} Health status
   */
  static async checkServerHealth(apiUrl) {
    try {
      console.log(`Checking server health at: ${apiUrl}/health`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const healthData = await response.json();
        console.log('✅ Server health check passed:', healthData.status);
        return {
          healthy: true,
          status: healthData.status,
          components: healthData.components
        };
      } else {
        console.log('❌ Server health check failed:', response.status, response.statusText);
        return {
          healthy: false,
          error: `Server returned ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      console.log('❌ Server health check error:', error.message);
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Process document via HTTP API
   * @param {string} apiUrl - API server URL
   * @param {string} filePath - Path to PDF file
   * @param {string} fileName - Original filename
   * @param {string} companyName - Company name
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Processing results
   */
  static async processDocumentViaAPI(apiUrl, filePath, fileName, companyName, onProgress) {
    try {
      if (onProgress) onProgress(20, 'Preparing document upload');

      // Create FormData for file upload
      const formData = new FormData();
      
      // For React Native, create proper file object
      const fileObject = {
        uri: filePath,
        type: 'application/pdf',
        name: fileName
      };

      formData.append('file', fileObject);
      formData.append('company_name', companyName);

      if (onProgress) onProgress(30, 'Uploading document to server');

      // Make API request with proper headers for React Native
      const response = await fetch(`${apiUrl}/api/process-document`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (onProgress) onProgress(90, 'Processing completed, receiving results');

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorData = {};
        
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        throw new PythonBridgeError(
          errorData.error || `Server error: ${response.status} ${response.statusText}`,
          errorData.code || this.ErrorTypes.PROCESSING_FAILED,
          errorData
        );
      }

      const results = await response.json();

      // Validate results structure
      if (!this.validateProcessingResults(results)) {
        throw new PythonBridgeError(
          'Invalid response structure from server',
          this.ErrorTypes.INVALID_RESPONSE,
          { results }
        );
      }

      return results;

    } catch (error) {
      if (error instanceof PythonBridgeError) {
        throw error;
      }
      
      // Handle network and other errors
      if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('fetch')) {
        throw new PythonBridgeError(
          'Network error - could not connect to server',
          this.ErrorTypes.NETWORK_ERROR,
          { originalError: error.message, serverUrl: apiUrl }
        );
      }

      throw new PythonBridgeError(
        'Failed to process document via API',
        this.ErrorTypes.PROCESSING_FAILED,
        { originalError: error.message }
      );
    }
  }

  /**
   * Extract company name via API
   * @param {string} filename - PDF filename
   * @returns {Promise<string>} Extracted company name
   */
  static async extractCompanyNameViaAPI(filename) {
    try {
      const apiUrl = this.getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/extract-company-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
        timeout: 10000,
      });

      if (!response.ok) {
        // Fallback to local extraction if API fails
        console.warn('API company name extraction failed, using local fallback');
        return this.extractCompanyNameLocal(filename);
      }

      const data = await response.json();
      return data.company_name || 'Unknown Company';

    } catch (error) {
      console.warn('API company name extraction error, using local fallback:', error);
      return this.extractCompanyNameLocal(filename);
    }
  }

  /**
   * Local company name extraction fallback
   * @param {string} filename - PDF filename
   * @returns {string} Extracted company name
   */
  static extractCompanyNameLocal(filename) {
    if (!filename || typeof filename !== 'string') {
      return 'Unknown Company';
    }

    // Remove file extension
    let companyName = filename.replace(/\.[^/.]+$/, '');

    // Common patterns to remove
    const patternsToRemove = [
      /sustainability[_\s-]report/gi,
      /annual[_\s-]report/gi,
      /esg[_\s-]report/gi,
      /csr[_\s-]report/gi,
      /\d{4}/g, // Remove years
    ];

    patternsToRemove.forEach(pattern => {
      companyName = companyName.replace(pattern, '');
    });

    // Clean up
    companyName = companyName
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize
    companyName = companyName.replace(/\b\w/g, l => l.toUpperCase());

    return companyName || 'Unknown Company';
  }

  /**
   * Validate Python processing results structure
   * @param {Object} results - Results to validate
   * @returns {boolean} True if valid
   */
  static validateProcessingResults(results) {
    if (!results || typeof results !== 'object') {
      return false;
    }

    const requiredFields = ['document_info', 'claims', 'summary', 'status'];
    const hasRequiredFields = requiredFields.every(field => 
      results.hasOwnProperty(field)
    );

    if (!hasRequiredFields) {
      return false;
    }

    // Validate document_info structure
    if (!results.document_info.filename || !results.document_info.company_name) {
      return false;
    }

    // Validate claims array
    if (!Array.isArray(results.claims)) {
      return false;
    }

    // Validate summary structure
    const summaryFields = ['total_claims', 'verified', 'questionable', 'unverified'];
    const hasValidSummary = summaryFields.every(field => 
      typeof results.summary[field] === 'number'
    );

    return hasValidSummary;
  }
}