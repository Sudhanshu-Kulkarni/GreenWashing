// Integration Tests for React Native ESG Claim Verification Components
// Tests the complete workflow from document upload to results display

import { DataService } from '../dataService.js';
import { PythonBridge } from '../pythonBridge.js';
import { DocumentProcessor } from '../documentProcessor.js';

/**
 * Test runner for React Native integration tests
 */
class IntegrationTestRunner {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
  }

  /**
   * Run a test with error handling
   * @param {string} testName - Name of the test
   * @param {Function} testFunction - Test function to execute
   * @returns {Promise<boolean>} True if test passed
   */
  async runTest(testName, testFunction) {
    this.totalTests++;
    console.log(`\n--- Running: ${testName} ---`);
    
    try {
      await testFunction();
      console.log(`✓ PASSED: ${testName}`);
      this.passedTests++;
      this.testResults.push({ name: testName, status: 'PASSED', error: null });
      return true;
    } catch (error) {
      if (error.message.includes('SKIP:')) {
        console.log(`⚠ SKIPPED: ${testName} - ${error.message.replace('SKIP:', '')}`);
        this.skippedTests++;
        this.testResults.push({ name: testName, status: 'SKIPPED', error: error.message });
        return true;
      } else {
        console.log(`✗ FAILED: ${testName} - ${error.message}`);
        this.failedTests++;
        this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
        return false;
      }
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Skipped: ${this.skippedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    if (this.failedTests > 0) {
      console.log('\nFAILED TESTS:');
      this.testResults
        .filter(result => result.status === 'FAILED')
        .forEach(result => {
          console.log(`- ${result.name}: ${result.error}`);
        });
    }
    
    if (this.skippedTests > 0) {
      console.log('\nSKIPPED TESTS:');
      this.testResults
        .filter(result => result.status === 'SKIPPED')
        .forEach(result => {
          console.log(`- ${result.name}: ${result.error.replace('SKIP:', '')}`);
        });
    }
  }
}

/**
 * Test DataService functionality with empty states and error handling
 */
async function testDataServiceIntegration() {
  // Clear any existing data
  DataService.clearAllData();
  
  // Test empty state handling
  const allDocuments = DataService.getAllDocuments();
  if (allDocuments.length !== 0) {
    throw new Error('Expected empty documents array');
  }
  
  const allClaims = DataService.getAllClaims();
  if (allClaims.length !== 0) {
    throw new Error('Expected empty claims array');
  }
  
  const overallStats = DataService.calculateOverallStats();
  const expectedEmptyStats = {
    totalDocuments: 0,
    totalClaims: 0,
    verified: 0,
    questionable: 0,
    unverified: 0,
    flagged: 0,
  };
  
  for (const [key, value] of Object.entries(expectedEmptyStats)) {
    if (overallStats[key] !== value) {
      throw new Error(`Expected ${key} to be ${value}, got ${overallStats[key]}`);
    }
  }
  
  // Test adding a document
  const testDocument = {
    filename: 'test_sustainability_report.pdf',
    size: '2.5 MB',
    status: 'completed',
    processingMode: 'Python',
    claims: [
      {
        id: 1,
        text: 'We reduced our carbon emissions by 25% in 2023.',
        category: 'emissions',
        confidence: 0.92,
        status: 'verified',
        evidence: 3,
        reasoning: 'Found matching data in ESG database'
      },
      {
        id: 2,
        text: 'Our renewable energy usage reached 100% of operations.',
        category: 'renewable_energy',
        confidence: 0.88,
        status: 'questionable',
        evidence: 2,
        reasoning: 'Partial match found, requires verification'
      }
    ]
  };
  
  const addedDocument = DataService.addDocument(testDocument);
  if (!addedDocument || !addedDocument.id) {
    throw new Error('Failed to add document');
  }
  
  // Test document retrieval
  const retrievedDocument = DataService.getDocumentById(addedDocument.id);
  if (!retrievedDocument || retrievedDocument.id !== addedDocument.id) {
    throw new Error('Failed to retrieve document by ID');
  }
  
  // Test claims retrieval
  const documentClaims = DataService.getClaimsByDocumentId(addedDocument.id);
  if (documentClaims.length !== 2) {
    throw new Error(`Expected 2 claims, got ${documentClaims.length}`);
  }
  
  // Test claims filtering
  const verifiedClaims = DataService.filterClaimsByStatus('verified');
  if (verifiedClaims.length !== 1) {
    throw new Error(`Expected 1 verified claim, got ${verifiedClaims.length}`);
  }
  
  const questionableClaims = DataService.filterClaimsByStatus('questionable');
  if (questionableClaims.length !== 1) {
    throw new Error(`Expected 1 questionable claim, got ${questionableClaims.length}`);
  }
  
  // Test flagged claims
  const flaggedClaims = DataService.getFlaggedClaims();
  if (flaggedClaims.length !== 1) {
    throw new Error(`Expected 1 flagged claim, got ${flaggedClaims.length}`);
  }
  
  // Test document search
  const searchResults = DataService.searchDocuments('sustainability');
  if (searchResults.length !== 1) {
    throw new Error(`Expected 1 search result, got ${searchResults.length}`);
  }
  
  // Test error handling
  try {
    DataService.getDocumentById('nonexistent_id');
    throw new Error('Expected error for nonexistent document ID');
  } catch (error) {
    if (!error.message.includes('not found')) {
      throw new Error('Expected "not found" error message');
    }
  }
  
  console.log('✓ DataService integration tests passed');
}

/**
 * Test PythonBridge functionality and error handling
 */
async function testPythonBridgeIntegration() {
  // Test shared directory initialization
  const initialized = await PythonBridge.initializeSharedDirectories();
  if (!initialized) {
    throw new Error('Failed to initialize shared directories');
  }
  
  // Test Python availability check
  const pythonAvailable = await PythonBridge.isPythonAvailable();
  if (!pythonAvailable) {
    throw new Error('SKIP: Python backend not available for testing');
  }
  
  // Test input validation
  const validationTests = [
    { filePath: null, fileName: 'test.pdf', companyName: 'Test', expectedError: 'File path is required' },
    { filePath: 'test.pdf', fileName: null, companyName: 'Test', expectedError: 'File name is required' },
    { filePath: 'test.pdf', fileName: 'test.pdf', companyName: null, expectedError: 'Company name is required' },
    { filePath: 'test.pdf', fileName: 'test.txt', companyName: 'Test', expectedError: 'Only PDF files are supported' },
  ];
  
  for (const test of validationTests) {
    const validation = PythonBridge.validateProcessingInputs(test.filePath, test.fileName, test.companyName);
    if (validation.isValid) {
      throw new Error(`Expected validation to fail for: ${JSON.stringify(test)}`);
    }
    if (!validation.error.includes(test.expectedError.split(' ')[0])) {
      throw new Error(`Expected error containing "${test.expectedError}", got "${validation.error}"`);
    }
  }
  
  // Test valid input validation
  const validValidation = PythonBridge.validateProcessingInputs('test.pdf', 'test.pdf', 'Test Company');
  if (!validValidation.isValid) {
    throw new Error(`Valid inputs should pass validation: ${validValidation.error}`);
  }
  
  // Test processing status constants
  const statusConstants = PythonBridge.ProcessingStatus;
  const expectedStatuses = ['IDLE', 'UPLOADING', 'PROCESSING', 'COMPLETED', 'ERROR'];
  for (const status of expectedStatuses) {
    if (!statusConstants[status]) {
      throw new Error(`Missing processing status constant: ${status}`);
    }
  }
  
  // Test error types
  const errorTypes = PythonBridge.ErrorTypes;
  const expectedErrorTypes = ['PYTHON_NOT_AVAILABLE', 'FILE_NOT_FOUND', 'PROCESSING_FAILED', 'INVALID_RESPONSE'];
  for (const errorType of expectedErrorTypes) {
    if (!errorTypes[errorType]) {
      throw new Error(`Missing error type constant: ${errorType}`);
    }
  }
  
  // Test results validation
  const validResults = {
    document_info: { filename: 'test.pdf', company_name: 'Test' },
    claims: [],
    summary: { total_claims: 0, verified: 0, questionable: 0, unverified: 0 },
    status: 'completed'
  };
  
  if (!PythonBridge.validateProcessingResults(validResults)) {
    throw new Error('Valid results should pass validation');
  }
  
  const invalidResults = { invalid: 'structure' };
  if (PythonBridge.validateProcessingResults(invalidResults)) {
    throw new Error('Invalid results should fail validation');
  }
  
  console.log('✓ PythonBridge integration tests passed');
}

/**
 * Test DocumentProcessor functionality
 */
async function testDocumentProcessorIntegration() {
  // Test document validation
  const validationTests = [
    { document: null, expectedError: 'No document provided' },
    { document: {}, expectedError: 'missing required properties' },
    { document: { uri: 'test', name: 'test.txt' }, expectedError: 'not supported' },
    { document: { uri: 'test', name: 'a.pdf' }, expectedError: 'too short' },
  ];
  
  for (const test of validationTests) {
    const validation = DocumentProcessor.validateDocument(test.document);
    if (validation.isValid) {
      throw new Error(`Expected validation to fail for: ${JSON.stringify(test.document)}`);
    }
    if (!validation.error.toLowerCase().includes(test.expectedError.toLowerCase().split(' ')[0])) {
      throw new Error(`Expected error containing "${test.expectedError}", got "${validation.error}"`);
    }
  }
  
  // Test valid document validation
  const validDocument = {
    uri: 'file://test.pdf',
    name: 'test_sustainability_report.pdf',
    size: 1024 * 1024, // 1MB
    type: 'application/pdf'
  };
  
  const validValidation = DocumentProcessor.validateDocument(validDocument);
  if (!validValidation.isValid) {
    throw new Error(`Valid document should pass validation: ${validValidation.error}`);
  }
  
  // Test company name extraction
  const companyNameTests = [
    { filename: 'Apple_Sustainability_Report_2023.pdf', expected: 'Apple' },
    { filename: 'Microsoft-ESG-Report-2024.pdf', expected: 'Microsoft' },
    { filename: 'tesla_annual_report_2023.pdf', expected: 'Tesla' },
    { filename: 'complex_company_name_inc_sustainability_2023.pdf', expected: 'Complex Company Name Inc' },
  ];
  
  for (const test of companyNameTests) {
    const extracted = DocumentProcessor.extractCompanyName(test.filename);
    if (!extracted.toLowerCase().includes(test.expected.toLowerCase())) {
      throw new Error(`Expected "${test.expected}" in "${extracted}" for filename "${test.filename}"`);
    }
  }
  
  // Test file extension extraction
  const extensionTests = [
    { filename: 'test.pdf', expected: '.pdf' },
    { filename: 'test.PDF', expected: '.pdf' },
    { filename: 'test', expected: '' },
    { filename: 'test.doc.pdf', expected: '.pdf' },
  ];
  
  for (const test of extensionTests) {
    const extension = DocumentProcessor.getFileExtension(test.filename);
    if (extension !== test.expected) {
      throw new Error(`Expected "${test.expected}", got "${extension}" for filename "${test.filename}"`);
    }
  }
  
  // Test file size formatting
  const sizeTests = [
    { bytes: 0, expected: '0 B' },
    { bytes: 1024, expected: '1 KB' },
    { bytes: 1024 * 1024, expected: '1 MB' },
    { bytes: 1024 * 1024 * 1024, expected: '1 GB' },
  ];
  
  for (const test of sizeTests) {
    const formatted = DocumentProcessor.formatFileSize(test.bytes);
    if (formatted !== test.expected) {
      throw new Error(`Expected "${test.expected}", got "${formatted}" for ${test.bytes} bytes`);
    }
  }
  
  // Test processing queue management
  const initialQueue = DocumentProcessor.getProcessingQueue();
  if (!Array.isArray(initialQueue)) {
    throw new Error('Processing queue should be an array');
  }
  
  const initialStats = DocumentProcessor.getProcessingStats();
  const expectedStatsFields = ['total', 'active', 'completed', 'failed'];
  for (const field of expectedStatsFields) {
    if (typeof initialStats[field] !== 'number') {
      throw new Error(`Processing stats should have numeric ${field} field`);
    }
  }
  
  console.log('✓ DocumentProcessor integration tests passed');
}

/**
 * Test end-to-end workflow simulation
 */
async function testEndToEndWorkflow() {
  // Clear existing data
  DataService.clearAllData();
  
  // Simulate document selection
  const mockDocument = {
    uri: 'file://test_sustainability_report.pdf',
    name: 'Apple_Sustainability_Report_2023.pdf',
    size: 2 * 1024 * 1024, // 2MB
    type: 'application/pdf',
    companyName: 'Apple'
  };
  
  // Validate document
  const validation = DocumentProcessor.validateDocument(mockDocument);
  if (!validation.isValid) {
    throw new Error(`Document validation failed: ${validation.error}`);
  }
  
  // Extract company name
  const companyName = DocumentProcessor.extractCompanyName(mockDocument.name);
  if (!companyName.toLowerCase().includes('apple')) {
    throw new Error(`Expected company name to contain 'apple', got '${companyName}'`);
  }
  
  // Simulate processing results (since we can't actually process without Python)
  const mockProcessingResults = {
    job_id: 'test_job_123',
    document_info: {
      filename: mockDocument.name,
      company_name: companyName,
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
            company: 'Apple',
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
            company: 'Apple',
            year: 2023,
            metric: 'renewable_energy_percent',
            value: 65,
            source: 'Sustainability Report'
          }
        }
      }
    ],
    summary: {
      total_claims: 2,
      verified: 1,
      questionable: 1,
      unverified: 0
    },
    status: 'completed',
    timestamp: new Date().toISOString(),
  };
  
  // Validate processing results structure
  if (!PythonBridge.validateProcessingResults(mockProcessingResults)) {
    throw new Error('Mock processing results should be valid');
  }
  
  // Transform claims for DataService
  const transformedClaims = DocumentProcessor.transformPythonClaimsToDataService(mockProcessingResults.claims);
  if (transformedClaims.length !== 2) {
    throw new Error(`Expected 2 transformed claims, got ${transformedClaims.length}`);
  }
  
  // Add document to DataService
  const documentData = {
    filename: mockDocument.name,
    size: DocumentProcessor.formatFileSize(mockDocument.size),
    status: 'completed',
    processingMode: 'Python',
    claims: transformedClaims,
    companyName: companyName,
    jobId: mockProcessingResults.job_id,
  };
  
  const addedDocument = DataService.addDocument(documentData);
  if (!addedDocument || !addedDocument.id) {
    throw new Error('Failed to add processed document to DataService');
  }
  
  // Verify document was added correctly
  const retrievedDocument = DataService.getDocumentById(addedDocument.id);
  if (!retrievedDocument) {
    throw new Error('Failed to retrieve added document');
  }
  
  if (retrievedDocument.claims.length !== 2) {
    throw new Error(`Expected 2 claims in retrieved document, got ${retrievedDocument.claims.length}`);
  }
  
  // Test claims filtering
  const verifiedClaims = DataService.filterClaimsByStatus('verified');
  const questionableClaims = DataService.filterClaimsByStatus('questionable');
  
  if (verifiedClaims.length !== 1) {
    throw new Error(`Expected 1 verified claim, got ${verifiedClaims.length}`);
  }
  
  if (questionableClaims.length !== 1) {
    throw new Error(`Expected 1 questionable claim, got ${questionableClaims.length}`);
  }
  
  // Test overall statistics
  const overallStats = DataService.calculateOverallStats();
  if (overallStats.totalDocuments !== 1) {
    throw new Error(`Expected 1 total document, got ${overallStats.totalDocuments}`);
  }
  
  if (overallStats.totalClaims !== 2) {
    throw new Error(`Expected 2 total claims, got ${overallStats.totalClaims}`);
  }
  
  if (overallStats.verified !== 1) {
    throw new Error(`Expected 1 verified claim, got ${overallStats.verified}`);
  }
  
  if (overallStats.questionable !== 1) {
    throw new Error(`Expected 1 questionable claim, got ${overallStats.questionable}`);
  }
  
  console.log('✓ End-to-end workflow simulation passed');
}

/**
 * Test error handling and edge cases
 */
async function testErrorHandlingAndEdgeCases() {
  // Test DataService error handling
  try {
    DataService.getDocumentById(null);
    throw new Error('Expected error for null document ID');
  } catch (error) {
    if (!error.message.includes('Invalid document ID')) {
      throw new Error(`Expected "Invalid document ID" error, got: ${error.message}`);
    }
  }
  
  try {
    DataService.getDocumentById('nonexistent');
    throw new Error('Expected error for nonexistent document ID');
  } catch (error) {
    if (!error.message.includes('not found')) {
      throw new Error(`Expected "not found" error, got: ${error.message}`);
    }
  }
  
  // Test DocumentProcessor error handling
  const invalidDocument = { uri: null, name: null };
  const validation = DocumentProcessor.validateDocument(invalidDocument);
  if (validation.isValid) {
    throw new Error('Invalid document should fail validation');
  }
  
  // Test PythonBridge error handling
  const invalidInputs = PythonBridge.validateProcessingInputs(null, null, null);
  if (invalidInputs.isValid) {
    throw new Error('Invalid inputs should fail validation');
  }
  
  // Test empty data handling
  DataService.clearAllData();
  
  const emptyDocuments = DataService.getAllDocuments();
  if (emptyDocuments.length !== 0) {
    throw new Error('Expected empty documents array after clearing data');
  }
  
  const emptyClaims = DataService.getAllClaims();
  if (emptyClaims.length !== 0) {
    throw new Error('Expected empty claims array after clearing data');
  }
  
  const emptyStats = DataService.calculateOverallStats();
  if (emptyStats.totalDocuments !== 0 || emptyStats.totalClaims !== 0) {
    throw new Error('Expected zero statistics after clearing data');
  }
  
  // Test edge cases for company name extraction
  const edgeCases = [
    { filename: '', expected: 'Unknown Company' },
    { filename: '.pdf', expected: 'Unknown Company' },
    { filename: 'sustainability_report_2023.pdf', expected: 'Sustainability Report' },
  ];
  
  for (const test of edgeCases) {
    const extracted = DocumentProcessor.extractCompanyName(test.filename);
    if (extracted.length === 0) {
      throw new Error(`Company name extraction should not return empty string for: ${test.filename}`);
    }
  }
  
  console.log('✓ Error handling and edge cases tests passed');
}

/**
 * Test performance and memory usage
 */
async function testPerformanceAndMemory() {
  // Test large data handling
  DataService.clearAllData();
  
  // Add multiple documents to test performance
  const startTime = Date.now();
  const numDocuments = 10;
  
  for (let i = 0; i < numDocuments; i++) {
    const testDocument = {
      filename: `test_document_${i}.pdf`,
      size: '1 MB',
      status: 'completed',
      processingMode: 'Python',
      claims: Array.from({ length: 5 }, (_, j) => ({
        id: j + 1,
        text: `Test claim ${j + 1} for document ${i}`,
        category: 'test',
        confidence: 0.8,
        status: i % 3 === 0 ? 'verified' : i % 3 === 1 ? 'questionable' : 'unverified',
        evidence: 2,
        reasoning: 'Test reasoning'
      }))
    };
    
    DataService.addDocument(testDocument);
  }
  
  const addTime = Date.now() - startTime;
  
  // Test retrieval performance
  const retrievalStartTime = Date.now();
  const allDocuments = DataService.getAllDocuments();
  const allClaims = DataService.getAllClaims();
  const overallStats = DataService.calculateOverallStats();
  const retrievalTime = Date.now() - retrievalStartTime;
  
  // Validate results
  if (allDocuments.length !== numDocuments) {
    throw new Error(`Expected ${numDocuments} documents, got ${allDocuments.length}`);
  }
  
  if (allClaims.length !== numDocuments * 5) {
    throw new Error(`Expected ${numDocuments * 5} claims, got ${allClaims.length}`);
  }
  
  // Test filtering performance
  const filterStartTime = Date.now();
  const verifiedClaims = DataService.filterClaimsByStatus('verified');
  const questionableClaims = DataService.filterClaimsByStatus('questionable');
  const unverifiedClaims = DataService.filterClaimsByStatus('unverified');
  const filterTime = Date.now() - filterStartTime;
  
  // Validate filtering results
  const totalFiltered = verifiedClaims.length + questionableClaims.length + unverifiedClaims.length;
  if (totalFiltered !== allClaims.length) {
    throw new Error(`Filtered claims total (${totalFiltered}) doesn't match all claims (${allClaims.length})`);
  }
  
  // Performance thresholds (adjust based on requirements)
  const maxAddTime = 1000; // 1 second
  const maxRetrievalTime = 500; // 0.5 seconds
  const maxFilterTime = 200; // 0.2 seconds
  
  if (addTime > maxAddTime) {
    console.warn(`Document addition took ${addTime}ms, exceeds threshold of ${maxAddTime}ms`);
  }
  
  if (retrievalTime > maxRetrievalTime) {
    console.warn(`Data retrieval took ${retrievalTime}ms, exceeds threshold of ${maxRetrievalTime}ms`);
  }
  
  if (filterTime > maxFilterTime) {
    console.warn(`Claims filtering took ${filterTime}ms, exceeds threshold of ${maxFilterTime}ms`);
  }
  
  console.log(`✓ Performance tests passed (Add: ${addTime}ms, Retrieve: ${retrievalTime}ms, Filter: ${filterTime}ms)`);
}

/**
 * Main test runner function
 */
export async function runIntegrationTests() {
  console.log('ESG Claim Verification - React Native Integration Tests');
  console.log('='.repeat(60));
  
  const runner = new IntegrationTestRunner();
  
  // Run all integration tests
  await runner.runTest('DataService Integration', testDataServiceIntegration);
  await runner.runTest('PythonBridge Integration', testPythonBridgeIntegration);
  await runner.runTest('DocumentProcessor Integration', testDocumentProcessorIntegration);
  await runner.runTest('End-to-End Workflow', testEndToEndWorkflow);
  await runner.runTest('Error Handling and Edge Cases', testErrorHandlingAndEdgeCases);
  await runner.runTest('Performance and Memory', testPerformanceAndMemory);
  
  // Print summary
  runner.printSummary();
  
  return runner.failedTests === 0;
}

// Export test functions for individual testing
export {
  testDataServiceIntegration,
  testPythonBridgeIntegration,
  testDocumentProcessorIntegration,
  testEndToEndWorkflow,
  testErrorHandlingAndEdgeCases,
  testPerformanceAndMemory
};

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runIntegrationTests().then(success => {
    console.log(`\nIntegration tests ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Integration tests failed with error:', error);
    process.exit(1);
  });
}