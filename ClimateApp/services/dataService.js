// Centralized Data Service for Documents and Claims Management
// This service manages document storage, claims filtering, and statistics calculation

export class DataService {
  // Error types for consistent error handling
  static ErrorTypes = {
    DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
    INVALID_DOCUMENT_ID: 'INVALID_DOCUMENT_ID',
    MALFORMED_DATA: 'MALFORMED_DATA',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    PROCESSING_ERROR: 'PROCESSING_ERROR',
    NO_DATA_AVAILABLE: 'NO_DATA_AVAILABLE',
  };

  // In-memory storage for processed documents (will be replaced with persistent storage)
  static documents = [];

  /**
   * Validate document data structure
   * @param {Object} document - Document to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validateDocument(document) {
    if (!document || typeof document !== 'object') {
      return false;
    }
    
    const requiredFields = ['id', 'title', 'filename', 'uploadDate', 'status'];
    return requiredFields.every(field => document.hasOwnProperty(field) && document[field] != null);
  }

  /**
   * Validate claim data structure
   * @param {Object} claim - Claim to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validateClaim(claim) {
    if (!claim || typeof claim !== 'object') {
      return false;
    }
    
    const requiredFields = ['id', 'text', 'status', 'confidence'];
    return requiredFields.every(field => claim.hasOwnProperty(field) && claim[field] != null);
  }

  /**
   * Sanitize document data with fallbacks
   * @param {Object} document - Document to sanitize
   * @returns {Object} Sanitized document
   */
  static sanitizeDocument(document) {
    if (!document) {
      return null;
    }

    return {
      id: document.id || 'unknown',
      title: document.title || 'Untitled Document',
      filename: document.filename || 'unknown.pdf',
      uploadDate: document.uploadDate || new Date().toISOString(),
      status: document.status || 'unknown',
      size: document.size || 'Unknown',
      pages: document.pages || 0,
      processingMode: document.processingMode || 'Unknown',
      claims: Array.isArray(document.claims) ? document.claims.filter(this.validateClaim) : [],
    };
  }

  /**
   * Sanitize claim data with fallbacks
   * @param {Object} claim - Claim to sanitize
   * @returns {Object} Sanitized claim
   */
  static sanitizeClaim(claim) {
    if (!claim) {
      return null;
    }

    return {
      id: claim.id || 0,
      text: claim.text || 'No claim text available',
      category: claim.category || 'Uncategorized',
      confidence: typeof claim.confidence === 'number' ? claim.confidence : 0,
      status: claim.status || 'unknown',
      evidence: typeof claim.evidence === 'number' ? claim.evidence : 0,
      reasoning: claim.reasoning || 'No reasoning provided',
      documentId: claim.documentId || null,
      documentTitle: claim.documentTitle || null,
    };
  }

  /**
   * Get all documents with error handling
   * @returns {Array} Array of all documents
   */
  static getAllDocuments() {
    try {
      if (!Array.isArray(this.documents)) {
        console.warn('Documents data is not an array, returning empty array');
        return [];
      }

      if (this.documents.length === 0) {
        console.info('No documents available - empty state');
        return [];
      }

      return this.documents
        .filter(doc => this.validateDocument(doc))
        .map(doc => {
          const sanitizedDoc = this.sanitizeDocument(doc);
          return {
            ...sanitizedDoc,
            summary: this.calculateDocumentSummary(sanitizedDoc.claims),
          };
        });
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw new Error(this.ErrorTypes.PROCESSING_ERROR);
    }
  }

  /**
   * Get a specific document by ID with error handling
   * @param {string} documentId - The document ID
   * @returns {Object|null} Document object or null if not found
   */
  static getDocumentById(documentId) {
    try {
      if (!documentId || typeof documentId !== 'string') {
        console.warn('Invalid document ID provided:', documentId);
        throw new Error(this.ErrorTypes.INVALID_DOCUMENT_ID);
      }

      if (this.documents.length === 0) {
        console.info('No documents available - empty state');
        return null;
      }

      const document = this.documents.find(doc => doc.id === documentId);
      if (!document) {
        console.warn('Document not found with ID:', documentId);
        throw new Error(this.ErrorTypes.DOCUMENT_NOT_FOUND);
      }

      if (!this.validateDocument(document)) {
        console.warn('Document data is malformed for ID:', documentId);
        throw new Error(this.ErrorTypes.MALFORMED_DATA);
      }

      const sanitizedDoc = this.sanitizeDocument(document);
      return {
        ...sanitizedDoc,
        summary: this.calculateDocumentSummary(sanitizedDoc.claims),
      };
    } catch (error) {
      console.error('Error getting document by ID:', error);
      throw error;
    }
  }

  /**
   * Get all claims across all documents with error handling
   * @returns {Array} Array of all claims with document context
   */
  static getAllClaims() {
    try {
      const allClaims = [];
      
      if (!Array.isArray(this.documents)) {
        console.warn('Documents data is not an array');
        return [];
      }

      if (this.documents.length === 0) {
        console.info('No documents available - empty claims state');
        return [];
      }

      this.documents.forEach(doc => {
        if (!this.validateDocument(doc)) {
          console.warn('Skipping invalid document:', doc?.id);
          return;
        }

        if (Array.isArray(doc.claims) && doc.claims.length > 0) {
          doc.claims.forEach(claim => {
            if (this.validateClaim(claim)) {
              const sanitizedClaim = this.sanitizeClaim({
                ...claim,
                documentId: doc.id,
                documentTitle: doc.title,
              });
              allClaims.push(sanitizedClaim);
            } else {
              console.warn('Skipping invalid claim:', claim?.id, 'in document:', doc.id);
            }
          });
        }
      });
      
      return allClaims;
    } catch (error) {
      console.error('Error getting all claims:', error);
      throw new Error(this.ErrorTypes.PROCESSING_ERROR);
    }
  }

  /**
   * Filter claims by status with error handling
   * @param {string} status - The status to filter by ('all', 'verified', 'questionable', 'unverified')
   * @param {string} documentId - Optional document ID to filter claims for specific document
   * @returns {Array} Filtered array of claims
   */
  static filterClaimsByStatus(status = 'all', documentId = null) {
    try {
      const validStatuses = ['all', 'verified', 'questionable', 'unverified'];
      if (!validStatuses.includes(status)) {
        console.warn('Invalid status provided:', status, 'defaulting to "all"');
        status = 'all';
      }

      let claims = documentId 
        ? this.getClaimsByDocumentId(documentId)
        : this.getAllClaims();

      if (!Array.isArray(claims)) {
        console.warn('Claims data is not an array');
        return [];
      }

      if (claims.length === 0) {
        console.info('No claims available for filtering - empty state');
        return [];
      }

      if (status === 'all') {
        return claims;
      }

      return claims.filter(claim => {
        if (!claim || typeof claim.status !== 'string') {
          console.warn('Invalid claim status:', claim?.status);
          return false;
        }
        return claim.status === status;
      });
    } catch (error) {
      console.error('Error filtering claims by status:', error);
      throw new Error(this.ErrorTypes.PROCESSING_ERROR);
    }
  }

  /**
   * Get claims for a specific document with error handling
   * @param {string} documentId - The document ID
   * @returns {Array} Array of claims for the document
   */
  static getClaimsByDocumentId(documentId) {
    try {
      if (!documentId || typeof documentId !== 'string') {
        console.warn('Invalid document ID provided:', documentId);
        throw new Error(this.ErrorTypes.INVALID_DOCUMENT_ID);
      }

      if (this.documents.length === 0) {
        console.info('No documents available - empty state');
        return [];
      }

      const document = this.documents.find(doc => doc.id === documentId);
      if (!document) {
        console.warn('Document not found with ID:', documentId);
        throw new Error(this.ErrorTypes.DOCUMENT_NOT_FOUND);
      }

      if (!this.validateDocument(document)) {
        console.warn('Document data is malformed for ID:', documentId);
        throw new Error(this.ErrorTypes.MALFORMED_DATA);
      }

      if (!Array.isArray(document.claims)) {
        console.warn('Document claims is not an array for ID:', documentId);
        return [];
      }

      if (document.claims.length === 0) {
        console.info('No claims available for document:', documentId);
        return [];
      }
      
      return document.claims
        .filter(claim => this.validateClaim(claim))
        .map(claim => this.sanitizeClaim({
          ...claim,
          documentId: document.id,
          documentTitle: document.title,
        }));
    } catch (error) {
      console.error('Error getting claims by document ID:', error);
      throw error;
    }
  }

  /**
   * Get flagged claims (questionable and unverified) with error handling
   * @param {string} documentId - Optional document ID to filter flagged claims for specific document
   * @returns {Array} Array of flagged claims
   */
  static getFlaggedClaims(documentId = null) {
    try {
      let claims = documentId 
        ? this.getClaimsByDocumentId(documentId)
        : this.getAllClaims();

      if (!Array.isArray(claims)) {
        console.warn('Claims data is not an array');
        return [];
      }

      if (claims.length === 0) {
        console.info('No claims available for flagging - empty state');
        return [];
      }

      return claims.filter(claim => {
        if (!claim || typeof claim.status !== 'string') {
          console.warn('Invalid claim status:', claim?.status);
          return false;
        }
        return claim.status === 'questionable' || claim.status === 'unverified';
      });
    } catch (error) {
      console.error('Error getting flagged claims:', error);
      throw new Error(this.ErrorTypes.PROCESSING_ERROR);
    }
  }

  /**
   * Calculate summary statistics for a set of claims with error handling
   * @param {Array} claims - Array of claims
   * @returns {Object} Summary statistics
   */
  static calculateDocumentSummary(claims = []) {
    try {
      if (!Array.isArray(claims)) {
        console.warn('Claims is not an array, returning empty summary');
        return {
          totalClaims: 0,
          verified: 0,
          questionable: 0,
          unverified: 0,
          flagged: 0,
        };
      }

      const validClaims = claims.filter(claim => 
        claim && typeof claim.status === 'string'
      );

      return {
        totalClaims: validClaims.length,
        verified: validClaims.filter(c => c.status === 'verified').length,
        questionable: validClaims.filter(c => c.status === 'questionable').length,
        unverified: validClaims.filter(c => c.status === 'unverified').length,
        flagged: validClaims.filter(c => c.status === 'questionable' || c.status === 'unverified').length,
      };
    } catch (error) {
      console.error('Error calculating document summary:', error);
      return {
        totalClaims: 0,
        verified: 0,
        questionable: 0,
        unverified: 0,
        flagged: 0,
      };
    }
  }

  /**
   * Calculate overall statistics across all documents with error handling
   * @returns {Object} Overall statistics
   */
  static calculateOverallStats() {
    try {
      const completedDocuments = this.getAllDocuments().filter(doc => 
        doc && doc.status === 'completed'
      );
      const allClaims = this.getAllClaims();
      
      if (!Array.isArray(allClaims)) {
        console.warn('All claims is not an array');
        return this.getEmptyStats();
      }

      if (allClaims.length === 0) {
        console.info('No claims available for statistics - empty state');
        return this.getEmptyStats();
      }

      const validClaims = allClaims.filter(claim => 
        claim && typeof claim.status === 'string'
      );
      
      return {
        totalDocuments: completedDocuments.length,
        totalClaims: validClaims.length,
        verified: validClaims.filter(c => c.status === 'verified').length,
        questionable: validClaims.filter(c => c.status === 'questionable').length,
        unverified: validClaims.filter(c => c.status === 'unverified').length,
        flagged: validClaims.filter(c => c.status === 'questionable' || c.status === 'unverified').length,
      };
    } catch (error) {
      console.error('Error calculating overall stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get empty statistics object for consistent empty state handling
   * @returns {Object} Empty statistics
   */
  static getEmptyStats() {
    return {
      totalDocuments: 0,
      totalClaims: 0,
      verified: 0,
      questionable: 0,
      unverified: 0,
      flagged: 0,
    };
  }

  /**
   * Add a new document (typically after processing)
   * @param {Object} documentData - Document data from Python NLP processing
   * @returns {Object} The added document with generated ID
   */
  static addDocument(documentData) {
    try {
      if (!documentData || typeof documentData !== 'object') {
        throw new Error(this.ErrorTypes.VALIDATION_ERROR);
      }

      const newDocument = {
        id: Date.now().toString(),
        title: this.extractTitleFromFilename(documentData.filename || 'unknown.pdf'),
        filename: documentData.filename || 'unknown.pdf',
        uploadDate: new Date().toISOString(),
        status: documentData.status || 'completed',
        size: documentData.size || 'Unknown',
        pages: documentData.pages || 0,
        processingMode: documentData.processingMode || 'Python',
        claims: Array.isArray(documentData.claims) ? documentData.claims : [],
      };

      this.documents.unshift(newDocument); // Add to beginning of array
      console.info('Document added successfully:', newDocument.id);
      
      return {
        ...newDocument,
        summary: this.calculateDocumentSummary(newDocument.claims),
      };
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  /**
   * Update document status (e.g., from processing to completed)
   * @param {string} documentId - The document ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Object|null} Updated document or null if not found
   */
  static updateDocumentStatus(documentId, status, additionalData = {}) {
    try {
      if (!documentId || typeof documentId !== 'string') {
        throw new Error(this.ErrorTypes.INVALID_DOCUMENT_ID);
      }

      const documentIndex = this.documents.findIndex(doc => doc.id === documentId);
      if (documentIndex === -1) {
        throw new Error(this.ErrorTypes.DOCUMENT_NOT_FOUND);
      }

      this.documents[documentIndex] = {
        ...this.documents[documentIndex],
        status,
        ...additionalData,
      };

      console.info('Document status updated:', documentId, 'to', status);

      return {
        ...this.documents[documentIndex],
        summary: this.calculateDocumentSummary(this.documents[documentIndex].claims),
      };
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }

  /**
   * Extract a readable title from filename
   * @param {string} filename - The filename
   * @returns {string} Extracted title
   */
  static extractTitleFromFilename(filename) {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
  }

  /**
   * Search documents by title or filename
   * @param {string} query - Search query
   * @returns {Array} Filtered documents
   */
  static searchDocuments(query) {
    try {
      const allDocuments = this.getAllDocuments();
      
      if (!query || !query.trim()) {
        return allDocuments;
      }
      
      if (allDocuments.length === 0) {
        console.info('No documents available for search - empty state');
        return [];
      }
      
      const lowercaseQuery = query.toLowerCase();
      return allDocuments.filter(doc => 
        doc.title.toLowerCase().includes(lowercaseQuery) ||
        doc.filename.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  /**
   * Get documents by status
   * @param {string} status - Document status ('all', 'completed', 'processing')
   * @returns {Array} Filtered documents
   */
  static getDocumentsByStatus(status = 'all') {
    try {
      const documents = this.getAllDocuments();
      
      if (documents.length === 0) {
        console.info('No documents available for status filtering - empty state');
        return [];
      }
      
      if (status === 'all') {
        return documents;
      }
      
      return documents.filter(doc => doc.status === status);
    } catch (error) {
      console.error('Error getting documents by status:', error);
      return [];
    }
  }

  /**
   * Check if the service has any data
   * @returns {boolean} True if there are documents or claims
   */
  static hasData() {
    return this.documents.length > 0;
  }

  /**
   * Clear all data (for testing or reset purposes)
   */
  static clearAllData() {
    this.documents = [];
    console.info('All data cleared');
  }
}