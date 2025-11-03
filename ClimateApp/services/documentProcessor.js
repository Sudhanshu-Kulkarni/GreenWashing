// Document Processor Service for ESG Claim Verification
// This service handles PDF upload workflow and processing queue management

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PythonBridge } from './pythonBridge.js';
import { DataService } from './dataService.js';

/**
 * Custom error class for processing-related errors
 */
class ProcessingError extends Error {
  constructor(message, code = 'PROCESSING_ERROR', details = null) {
    super(message);
    this.name = 'ProcessingError';
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
}

export class DocumentProcessor {
  // Processing queue for managing multiple document uploads
  static processingQueue = [];
  static activeProcessing = new Map(); // jobId -> processing info

  // Document validation constants
  static ValidationRules = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_EXTENSIONS: ['.pdf'],
    MIN_FILENAME_LENGTH: 3,
    MAX_FILENAME_LENGTH: 255,
  };

  // Processing status tracking
  static ProcessingEvents = {
    UPLOAD_STARTED: 'upload_started',
    UPLOAD_COMPLETED: 'upload_completed',
    PROCESSING_STARTED: 'processing_started',
    PROCESSING_PROGRESS: 'processing_progress',
    PROCESSING_COMPLETED: 'processing_completed',
    PROCESSING_FAILED: 'processing_failed',
  };

  /**
   * Pick and validate a PDF document for processing
   * @returns {Promise<Object|null>} Selected document info or null if cancelled
   */
  static async pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        console.info('Document selection cancelled by user');
        return null;
      }

      const document = result.assets[0];
      
      // Validate the selected document
      const validation = this.validateDocument(document);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Extract company name from filename
      const companyName = this.extractCompanyName(document.name);

      return {
        uri: document.uri,
        name: document.name,
        size: document.size,
        type: document.mimeType,
        companyName,
        validationPassed: true,
      };

    } catch (error) {
      console.error('Error picking document:', error);
      throw error;
    }
  }

  /**
   * Validate document before processing
   * @param {Object} document - Document object from picker
   * @returns {Object} Validation result with isValid flag and error message
   */
  static validateDocument(document) {
    try {
      if (!document) {
        return { isValid: false, error: 'No document provided', code: 'NO_DOCUMENT' };
      }

      // Check if document has required properties
      if (!document.uri || !document.name) {
        return { 
          isValid: false, 
          error: 'Document is missing required properties (uri or name)', 
          code: 'INVALID_DOCUMENT_STRUCTURE' 
        };
      }

      // Check file size
      if (document.size && document.size > this.ValidationRules.MAX_FILE_SIZE) {
        const maxSizeMB = this.ValidationRules.MAX_FILE_SIZE / (1024 * 1024);
        return { 
          isValid: false, 
          error: `File size (${this.formatFileSize(document.size)}) exceeds ${maxSizeMB}MB limit`, 
          code: 'FILE_TOO_LARGE',
          details: { actualSize: document.size, maxSize: this.ValidationRules.MAX_FILE_SIZE }
        };
      }

      // Check file extension
      const extension = this.getFileExtension(document.name);
      if (!this.ValidationRules.ALLOWED_EXTENSIONS.includes(extension)) {
        return { 
          isValid: false, 
          error: `File type '${extension}' is not supported. Only PDF files are allowed.`, 
          code: 'UNSUPPORTED_FILE_TYPE',
          details: { extension, allowedExtensions: this.ValidationRules.ALLOWED_EXTENSIONS }
        };
      }

      // Check filename length
      if (document.name.length < this.ValidationRules.MIN_FILENAME_LENGTH) {
        return { 
          isValid: false, 
          error: `Filename is too short (minimum ${this.ValidationRules.MIN_FILENAME_LENGTH} characters)`, 
          code: 'FILENAME_TOO_SHORT',
          details: { actualLength: document.name.length, minLength: this.ValidationRules.MIN_FILENAME_LENGTH }
        };
      }

      if (document.name.length > this.ValidationRules.MAX_FILENAME_LENGTH) {
        return { 
          isValid: false, 
          error: `Filename is too long (maximum ${this.ValidationRules.MAX_FILENAME_LENGTH} characters)`, 
          code: 'FILENAME_TOO_LONG',
          details: { actualLength: document.name.length, maxLength: this.ValidationRules.MAX_FILENAME_LENGTH }
        };
      }

      // Check for valid filename characters
      const invalidChars = /[<>:"/\\|?*]/;
      const invalidMatches = document.name.match(invalidChars);
      if (invalidMatches) {
        return { 
          isValid: false, 
          error: `Filename contains invalid characters: ${invalidMatches.join(', ')}`, 
          code: 'INVALID_FILENAME_CHARACTERS',
          details: { invalidCharacters: invalidMatches }
        };
      }

      // Check for empty or whitespace-only filename
      const nameWithoutExtension = document.name.replace(/\.[^/.]+$/, '').trim();
      if (!nameWithoutExtension) {
        return { 
          isValid: false, 
          error: 'Filename cannot be empty or contain only whitespace', 
          code: 'EMPTY_FILENAME' 
        };
      }

      // Additional PDF-specific validation
      if (document.type && !document.type.includes('pdf')) {
        return { 
          isValid: false, 
          error: `File MIME type '${document.type}' is not a PDF`, 
          code: 'INVALID_MIME_TYPE',
          details: { mimeType: document.type }
        };
      }

      return { isValid: true, code: 'VALID' };

    } catch (error) {
      console.error('Error validating document:', error);
      return { 
        isValid: false, 
        error: 'Document validation failed due to an unexpected error', 
        code: 'VALIDATION_ERROR',
        details: { originalError: error.message }
      };
    }
  }

  /**
   * Extract company name from PDF filename
   * @param {string} filename - PDF filename
   * @returns {string} Extracted company name
   */
  static extractCompanyName(filename) {
    try {
      if (!filename || typeof filename !== 'string') {
        return 'Unknown Company';
      }

      // Remove file extension
      let companyName = filename.replace(/\.[^/.]+$/, '');

      // Common patterns to remove from sustainability report filenames
      const patternsToRemove = [
        /sustainability[_\s-]report/gi,
        /annual[_\s-]report/gi,
        /esg[_\s-]report/gi,
        /csr[_\s-]report/gi,
        /environmental[_\s-]report/gi,
        /impact[_\s-]report/gi,
        /\d{4}/g, // Remove years
        /[_\s-]+(report|2023|2024|2025)$/gi,
        /^(the|a|an)[_\s-]+/gi, // Remove articles at the beginning
      ];

      // Apply pattern removal
      patternsToRemove.forEach(pattern => {
        companyName = companyName.replace(pattern, '');
      });

      // Clean up the result
      companyName = companyName
        .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim(); // Remove leading/trailing whitespace

      // Capitalize first letter of each word
      companyName = companyName.replace(/\b\w/g, l => l.toUpperCase());

      // Return original filename if extraction resulted in empty string
      if (!companyName || companyName.length < 2) {
        return filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
      }

      return companyName;

    } catch (error) {
      console.error('Error extracting company name:', error);
      return 'Unknown Company';
    }
  }

  /**
   * Get file extension from filename
   * @param {string} filename - Filename
   * @returns {string} File extension including the dot
   */
  static getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') {
      return '';
    }
    
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    
    return filename.substring(lastDotIndex).toLowerCase();
  }

  /**
   * Process a document through the Python NLP pipeline
   * @param {Object} documentInfo - Document information from picker
   * @param {Function} onProgress - Progress callback function
   * @param {Function} onStatusChange - Status change callback function
   * @returns {Promise<Object>} Processing results
   */
  static async processDocument(documentInfo, onProgress = null, onStatusChange = null) {
    let jobId = null;
    let queueItem = null;

    try {
      // Validate input parameters
      if (!documentInfo) {
        throw new ProcessingError('No document information provided', 'MISSING_DOCUMENT_INFO');
      }

      if (!documentInfo.uri) {
        throw new ProcessingError('Document URI is required', 'MISSING_DOCUMENT_URI');
      }

      // Re-validate document to ensure it's still valid
      const validation = this.validateDocument(documentInfo);
      if (!validation.isValid) {
        throw new ProcessingError(validation.error, validation.code, validation.details);
      }

      // Check system requirements
      await this.validateSystemRequirements();

      // Generate processing job ID
      jobId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create queue item with comprehensive error tracking
      queueItem = {
        jobId,
        documentInfo,
        status: PythonBridge.ProcessingStatus.UPLOADING,
        progress: 0,
        startTime: new Date(),
        onProgress,
        onStatusChange,
        errors: [],
        warnings: [],
        retryCount: 0,
        maxRetries: 2,
      };

      this.processingQueue.push(queueItem);
      this.activeProcessing.set(jobId, queueItem);

      // Notify status change
      if (onStatusChange) {
        onStatusChange(this.ProcessingEvents.UPLOAD_STARTED, queueItem);
      }

      // Add document to DataService as processing
      let processingDocument;
      try {
        processingDocument = DataService.addDocument({
          filename: documentInfo.name,
          size: this.formatFileSize(documentInfo.size),
          status: 'processing',
          processingMode: 'Python',
          claims: [],
          companyName: documentInfo.companyName,
          jobId: jobId,
        });
        queueItem.documentId = processingDocument.id;
      } catch (error) {
        throw new ProcessingError('Failed to create document record', 'DOCUMENT_CREATION_FAILED', { originalError: error.message });
      }

      // Start Python processing via HTTP API
      if (onStatusChange) {
        onStatusChange(this.ProcessingEvents.PROCESSING_STARTED, queueItem);
      }

      const results = await this.executeProcessingWithRetry(queueItem);

      // Validate processing results
      if (!PythonBridge.validateProcessingResults(results)) {
        throw new ProcessingError('Invalid processing results received from Python backend', 'INVALID_RESULTS');
      }

      // Update document with processing results
      const completedDocument = DataService.updateDocumentStatus(
        processingDocument.id,
        'completed',
        {
          claims: this.transformPythonClaimsToDataService(results.claims),
          processingTime: results.document_info?.processing_time || 0,
          totalSentences: results.document_info?.total_sentences || 0,
          summary: results.summary,
          jobId: jobId,
        }
      );

      // Update queue status
      queueItem.status = PythonBridge.ProcessingStatus.COMPLETED;
      queueItem.progress = 100;
      queueItem.results = results;
      queueItem.completedDocument = completedDocument;
      queueItem.endTime = new Date();

      if (onStatusChange) {
        onStatusChange(this.ProcessingEvents.PROCESSING_COMPLETED, queueItem);
      }

      // Schedule cleanup
      this.scheduleCleanup(jobId);

      return {
        jobId,
        document: completedDocument,
        results,
        processingTime: queueItem.endTime - queueItem.startTime,
        warnings: queueItem.warnings,
      };

    } catch (error) {
      console.error('Error processing document:', error);

      // Enhanced error handling
      const processedError = this.processError(error, queueItem);

      // Update queue status on error
      if (queueItem) {
        queueItem.status = PythonBridge.ProcessingStatus.ERROR;
        queueItem.error = processedError.message;
        queueItem.errorCode = processedError.code;
        queueItem.errorDetails = processedError.details;
        queueItem.endTime = new Date();
        queueItem.errors.push(processedError);

        if (onStatusChange) {
          onStatusChange(this.ProcessingEvents.PROCESSING_FAILED, queueItem);
        }

        // Update document status to error
        if (queueItem.documentId) {
          try {
            DataService.updateDocumentStatus(queueItem.documentId, 'error', {
              error: processedError.message,
              errorCode: processedError.code,
              errorDetails: processedError.details,
              jobId: jobId,
            });
          } catch (updateError) {
            console.error('Failed to update document status:', updateError);
          }
        }
      }

      throw processedError;
    }
  }

  /**
   * Execute processing with retry logic
   * @param {Object} queueItem - Queue item with processing info
   * @returns {Promise<Object>} Processing results
   */
  static async executeProcessingWithRetry(queueItem) {
    let lastError = null;

    for (let attempt = 0; attempt <= queueItem.maxRetries; attempt++) {
      try {
        queueItem.retryCount = attempt;

        if (attempt > 0) {
          queueItem.warnings.push(`Retry attempt ${attempt} of ${queueItem.maxRetries}`);
          console.warn(`Processing retry ${attempt} for job ${queueItem.jobId}`);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const results = await PythonBridge.runPythonScript(
          queueItem.documentInfo.uri,
          queueItem.documentInfo.name,
          queueItem.documentInfo.companyName,
          (progress, message) => {
            queueItem.progress = progress;
            queueItem.currentStep = message;
            
            if (queueItem.onProgress) {
              queueItem.onProgress(progress, message);
            }
            
            if (queueItem.onStatusChange) {
              queueItem.onStatusChange(this.ProcessingEvents.PROCESSING_PROGRESS, queueItem);
            }
          }
        );

        return results;

      } catch (error) {
        lastError = error;
        queueItem.errors.push({
          attempt: attempt + 1,
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        // Don't retry for certain error types
        if (this.isNonRetryableError(error)) {
          break;
        }

        if (attempt < queueItem.maxRetries) {
          console.warn(`Processing attempt ${attempt + 1} failed, retrying...`);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if an error should not be retried
   * @param {Error} error - Error to check
   * @returns {boolean} True if error should not be retried
   */
  static isNonRetryableError(error) {
    const nonRetryableCodes = [
      'MISSING_DOCUMENT_INFO',
      'MISSING_DOCUMENT_URI',
      'FILE_TOO_LARGE',
      'UNSUPPORTED_FILE_TYPE',
      'INVALID_FILENAME_CHARACTERS',
      'PYTHON_NOT_AVAILABLE',
      'INVALID_RESULTS',
    ];

    return nonRetryableCodes.includes(error.code) || 
           error.message.includes('validation') ||
           error.message.includes('not supported');
  }

  /**
   * Validate system requirements before processing
   * @returns {Promise<void>} Throws if requirements not met
   */
  static async validateSystemRequirements() {
    try {
      // Check if Python bridge is available
      const pythonAvailable = await PythonBridge.isPythonAvailable();
      if (!pythonAvailable) {
        throw new ProcessingError('Python backend is not available', 'PYTHON_NOT_AVAILABLE');
      }

      // Check available storage space
      const freeSpace = await this.checkAvailableStorage();
      if (freeSpace < 100 * 1024 * 1024) { // 100MB minimum
        throw new ProcessingError('Insufficient storage space for processing', 'INSUFFICIENT_STORAGE', { 
          availableSpace: freeSpace,
          requiredSpace: 100 * 1024 * 1024 
        });
      }

    } catch (error) {
      if (error instanceof ProcessingError) {
        throw error;
      }
      throw new ProcessingError('System requirements validation failed', 'SYSTEM_CHECK_FAILED', { 
        originalError: error.message 
      });
    }
  }

  /**
   * Check available storage space
   * @returns {Promise<number>} Available space in bytes
   */
  static async checkAvailableStorage() {
    try {
      // This is a simplified check - in production you'd use a proper storage API
      return 1024 * 1024 * 1024; // Assume 1GB available
    } catch (error) {
      console.warn('Could not check storage space:', error);
      return 1024 * 1024 * 1024; // Default to 1GB
    }
  }

  /**
   * Process and categorize errors
   * @param {Error} error - Original error
   * @param {Object} queueItem - Queue item context
   * @returns {ProcessingError} Processed error
   */
  static processError(error, queueItem) {
    if (error instanceof ProcessingError) {
      return error;
    }

    // Categorize common errors
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return new ProcessingError('Network error during processing', 'NETWORK_ERROR', {
        originalError: error.message,
        jobId: queueItem?.jobId,
        retryable: true,
      });
    }

    if (error.message.includes('permission') || error.message.includes('access')) {
      return new ProcessingError('Permission denied accessing file', 'PERMISSION_ERROR', {
        originalError: error.message,
        jobId: queueItem?.jobId,
        retryable: false,
      });
    }

    if (error.message.includes('memory') || error.message.includes('out of')) {
      return new ProcessingError('Insufficient memory for processing', 'MEMORY_ERROR', {
        originalError: error.message,
        jobId: queueItem?.jobId,
        retryable: true,
      });
    }

    // Generic processing error
    return new ProcessingError('Processing failed due to an unexpected error', 'PROCESSING_ERROR', {
      originalError: error.message,
      jobId: queueItem?.jobId,
      stack: error.stack,
    });
  }

  /**
   * Schedule cleanup of processing files
   * @param {string} jobId - Job identifier
   */
  static scheduleCleanup(jobId) {
    setTimeout(async () => {
      try {
        await PythonBridge.cleanupJob(jobId);
        this.activeProcessing.delete(jobId);
        console.info(`Cleanup completed for job: ${jobId}`);
      } catch (error) {
        console.warn(`Cleanup failed for job ${jobId}:`, error);
      }
    }, 30000); // 30 seconds delay
  }

  /**
   * Transform Python claims format to DataService format
   * @param {Array} pythonClaims - Claims from Python processing
   * @returns {Array} Claims in DataService format
   */
  static transformPythonClaimsToDataService(pythonClaims) {
    if (!Array.isArray(pythonClaims)) {
      return [];
    }

    return pythonClaims.map(claim => ({
      id: claim.id || Math.random(),
      text: claim.text || 'No claim text',
      category: claim.extracted_data?.metric || 'Uncategorized',
      confidence: claim.confidence || 0,
      status: claim.verification_status || 'unknown',
      evidence: claim.match_details?.csv_match ? 3 : 0,
      reasoning: claim.match_details?.reasoning || 'No reasoning provided',
    }));
  }

  /**
   * Get current processing queue status
   * @returns {Array} Array of processing queue items
   */
  static getProcessingQueue() {
    return [...this.processingQueue];
  }

  /**
   * Get active processing jobs
   * @returns {Array} Array of active processing jobs
   */
  static getActiveProcessing() {
    return Array.from(this.activeProcessing.values());
  }

  /**
   * Get processing status for a specific job
   * @param {string} jobId - Job identifier
   * @returns {Object|null} Processing status or null if not found
   */
  static getProcessingStatus(jobId) {
    return this.activeProcessing.get(jobId) || null;
  }

  /**
   * Cancel a processing job (if possible)
   * @param {string} jobId - Job identifier
   * @returns {boolean} True if cancellation was successful
   */
  static cancelProcessing(jobId) {
    try {
      const queueItem = this.activeProcessing.get(jobId);
      if (!queueItem) {
        return false;
      }

      // Update status
      queueItem.status = 'cancelled';
      queueItem.endTime = new Date();

      // Remove from active processing
      this.activeProcessing.delete(jobId);

      // Update document status if exists
      if (queueItem.documentId) {
        DataService.updateDocumentStatus(queueItem.documentId, 'cancelled');
      }

      console.info('Processing cancelled for job:', jobId);
      return true;

    } catch (error) {
      console.error('Error cancelling processing:', error);
      return false;
    }
  }

  /**
   * Clear completed jobs from the queue
   */
  static clearCompletedJobs() {
    const completedStatuses = [
      PythonBridge.ProcessingStatus.COMPLETED,
      PythonBridge.ProcessingStatus.ERROR,
      'cancelled',
    ];

    this.processingQueue = this.processingQueue.filter(item => 
      !completedStatuses.includes(item.status)
    );

    // Clean up active processing map
    for (const [jobId, item] of this.activeProcessing.entries()) {
      if (completedStatuses.includes(item.status)) {
        this.activeProcessing.delete(jobId);
      }
    }

    console.info('Cleared completed jobs from processing queue');
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  static formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get processing statistics
   * @returns {Object} Processing statistics
   */
  static getProcessingStats() {
    const queue = this.getProcessingQueue();
    
    return {
      total: queue.length,
      active: queue.filter(item => 
        item.status === PythonBridge.ProcessingStatus.PROCESSING ||
        item.status === PythonBridge.ProcessingStatus.UPLOADING
      ).length,
      completed: queue.filter(item => 
        item.status === PythonBridge.ProcessingStatus.COMPLETED
      ).length,
      failed: queue.filter(item => 
        item.status === PythonBridge.ProcessingStatus.ERROR
      ).length,
    };
  }

  /**
   * Validate company name extraction
   * @param {string} filename - Original filename
   * @param {string} extractedName - Extracted company name
   * @returns {Object} Validation result
   */
  static validateCompanyNameExtraction(filename, extractedName) {
    const isValid = extractedName && 
                   extractedName.length >= 2 && 
                   extractedName !== 'Unknown Company' &&
                   extractedName.trim().length > 0;

    return {
      isValid,
      originalFilename: filename,
      extractedName,
      confidence: isValid ? 0.8 : 0.2,
    };
  }
}