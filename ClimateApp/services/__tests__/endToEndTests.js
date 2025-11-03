// End-to-End Tests for Complete ESG Claim Verification Workflow
// Tests the complete processing workflow from PDF upload to claim verification

import { DataService } from '../dataService.js';
import { PythonBridge } from '../pythonBridge.js';
import { DocumentProcessor } from '../documentProcessor.js';

/**
 * End-to-End Test Suite for ESG Claim Verification
 */
class EndToEndTestSuite {
  constructor() {
    this.testResults = [];
    this.setupComplete = false;
  }

  /**
   * Setup test environment
   */
  async setup() {
    try {
      // Clear any existing data
      DataService.clearAllData();
      
      // Initialize shared directories
      await PythonBridge.initializeSharedDirectories();
      
      // Clear processing queue
      DocumentProcessor.clearCompletedJobs();
      
      this.setupComplete = true;
      console.log('✓ Test environment setup complete');
    } catch (error) {
      console.error('✗ Test environment setup failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    try {
      // Clear all test data
      DataService.clearAllData();
      DocumentProcessor.clearCompletedJobs();
      
      console.log('✓ Test environment cleanup complete');
    } catch (error) {
      console.warn('⚠ Test environment cleanup failed:', error);
    }
  }

  /**
   * Run a test scenario with setup and cleanup
   */
  async runTestScenario(scenarioName, testFunction) {
    console.log(`\n--- Running E2E Scenario: ${scenarioName} ---`);
    
    try {
      if (!this.setupComplete) {
        await this.setup();
      }
      
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      console.log(`✓ PASSED: ${scenarioName} (${duration}ms)`);
      this.testResults.push({ 
        name: scenarioName, 
        status: 'PASSED', 
        duration, 
        error: null 
      });
      
      return true;
    } catch (error) {
      console.log(`✗ FAILED: ${scenarioName} - ${error.message}`);
      this.testResults.push({ 
        name: scenarioName, 
        status: 'FAILED', 
        duration: 0, 
        error: error.message 
      });
      
      return false;
    }
  }

  /**
   * Print test results summary
   */
  printResults() {
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('END-TO-END TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Scenarios: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\nFAILED SCENARIOS:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(result => {
          console.log(`- ${result.name}: ${result.error}`);
        });
    }
    
    return failed === 0;
  }
}

/**
 * Test complete document processing workflow
 */
async function testCompleteDocumentProcessingWorkflow() {
  // Step 1: Simulate document selection
  const mockDocument = {
    uri: 'file://test_apple_sustainability_2023.pdf',
    name: 'Apple_Sustainability_Report_2023.pdf',
    size: 3 * 1024 * 1024, // 3MB
    type: 'application/pdf'
  };

  // Step 2: Validate document
  const validation = DocumentProcessor.validateDocument(mockDocument);
  if (!validation.isValid) {
    throw new Error(`Document validation failed: ${validation.error}`);
  }

  // Step 3: Extract company name
  const companyName = DocumentProcessor.extractCompanyName(mockDocument.name);
  if (!companyName || companyName === 'Unknown Company') {
    throw new Error(`Failed to extract company name from: ${mockDocument.name}`);
  }

  // Step 4: Simulate Python processing results
  const processingResults = {
    job_id: `e2e_test_${Date.now()}`,
    document_info: {
      filename: mockDocument.name,
      company_name: companyName,
      total_sentences: 156,
      processing_time: 22.3,
      processed_at: new Date().toISOString()
    },
    claims: [
      {
        id: 1,
        text: 'Apple reduced carbon emissions by 40% since 2015 across corporate operations.',
        confidence: 0.94,
        extracted_data: {
          metric: 'carbon_emissions_reduction',
          value: 40,
          unit: 'percent',
          year: 2015,
          percentage: true
        },
        verification_status: 'verified',
        verification_confidence: 0.88,
        match_details: {
          csv_match: true,
          tolerance_check: true,
          reasoning: 'Found matching emissions reduction data in ESG database',
          matched_data: {
            company: 'Apple',
            year: 2015,
            metric: 'emissions_reduction_percent',
            value: 38,
            source: 'CDP Climate Change'
          }
        }
      },
      {
        id: 2,
        text: 'We achieved 100% renewable energy for global corporate operations in 2018.',
        confidence: 0.91,
        extracted_data: {
          metric: 'renewable_energy',
          value: 100,
          unit: 'percent',
          year: 2018,
          percentage: true
        },
        verification_status: 'verified',
        verification_confidence: 0.92,
        match_details: {
          csv_match: true,
          tolerance_check: true,
          reasoning: 'Confirmed 100% renewable energy achievement in ESG database',
          matched_data: {
            company: 'Apple',
            year: 2018,
            metric: 'renewable_energy_percent',
            value: 100,
            source: 'Apple Environmental Report'
          }
        }
      },
      {
        id: 3,
        text: 'Water usage efficiency improved by 35% in manufacturing processes.',
        confidence: 0.87,
        extracted_data: {
          metric: 'water_efficiency',
          value: 35,
          unit: 'percent',
          year: null,
          percentage: true
        },
        verification_status: 'questionable',
        verification_confidence: 0.65,
        match_details: {
          csv_match: true,
          tolerance_check: false,
          reasoning: 'ESG database shows 28% water efficiency improvement, difference exceeds tolerance',
          matched_data: {
            company: 'Apple',
            year: 2023,
            metric: 'water_efficiency_percent',
            value: 28,
            source: 'Sustainability Report'
          }
        }
      },
      {
        id: 4,
        text: 'Achieved zero waste to landfill across all retail stores globally.',
        confidence: 0.82,
        extracted_data: {
          metric: 'waste_to_landfill',
          value: 0,
          unit: 'percent',
          year: null,
          percentage: false
        },
        verification_status: 'unverified',
        verification_confidence: 0.3,
        match_details: {
          csv_match: false,
          tolerance_check: false,
          reasoning: 'No matching waste data found in ESG database for Apple retail operations',
          matched_data: null
        }
      }
    ],
    summary: {
      total_claims: 4,
      verified: 2,
      questionable: 1,
      unverified: 1,
      verification_rate: 0.75,
      avg_classification_confidence: 0.885,
      avg_verification_confidence: 0.69
    },
    processing_status: {
      current_step: 'Complete',
      progress: 1.0,
      duration: 22.3,
      errors: [],
      warnings: []
    },
    model_info: {
      model_path: 'trained_llm_for_claim_classification/best_finetuned_model',
      csv_path: 'esg_lookup_2020_2025.csv',
      confidence_threshold: 0.7
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  // Step 5: Validate processing results
  if (!PythonBridge.validateProcessingResults(processingResults)) {
    throw new Error('Processing results validation failed');
  }

  // Step 6: Transform claims for DataService
  const transformedClaims = DocumentProcessor.transformPythonClaimsToDataService(processingResults.claims);
  if (transformedClaims.length !== 4) {
    throw new Error(`Expected 4 transformed claims, got ${transformedClaims.length}`);
  }

  // Step 7: Add document to DataService
  const documentData = {
    filename: mockDocument.name,
    size: DocumentProcessor.formatFileSize(mockDocument.size),
    status: 'completed',
    processingMode: 'Python',
    claims: transformedClaims,
    companyName: companyName,
    jobId: processingResults.job_id,
    processingTime: processingResults.document_info.processing_time,
    totalSentences: processingResults.document_info.total_sentences,
    summary: processingResults.summary
  };

  const addedDocument = DataService.addDocument(documentData);
  if (!addedDocument || !addedDocument.id) {
    throw new Error('Failed to add document to DataService');
  }

  // Step 8: Verify document retrieval
  const retrievedDocument = DataService.getDocumentById(addedDocument.id);
  if (!retrievedDocument) {
    throw new Error('Failed to retrieve added document');
  }

  // Step 9: Verify claims are accessible
  const documentClaims = DataService.getClaimsByDocumentId(addedDocument.id);
  if (documentClaims.length !== 4) {
    throw new Error(`Expected 4 claims for document, got ${documentClaims.length}`);
  }

  // Step 10: Test claims filtering
  const verifiedClaims = DataService.filterClaimsByStatus('verified');
  const questionableClaims = DataService.filterClaimsByStatus('questionable');
  const unverifiedClaims = DataService.filterClaimsByStatus('unverified');

  if (verifiedClaims.length !== 2) {
    throw new Error(`Expected 2 verified claims, got ${verifiedClaims.length}`);
  }

  if (questionableClaims.length !== 1) {
    throw new Error(`Expected 1 questionable claim, got ${questionableClaims.length}`);
  }

  if (unverifiedClaims.length !== 1) {
    throw new Error(`Expected 1 unverified claim, got ${unverifiedClaims.length}`);
  }

  // Step 11: Verify overall statistics
  const overallStats = DataService.calculateOverallStats();
  if (overallStats.totalDocuments !== 1) {
    throw new Error(`Expected 1 total document, got ${overallStats.totalDocuments}`);
  }

  if (overallStats.totalClaims !== 4) {
    throw new Error(`Expected 4 total claims, got ${overallStats.totalClaims}`);
  }

  if (overallStats.verified !== 2) {
    throw new Error(`Expected 2 verified claims, got ${overallStats.verified}`);
  }

  console.log('✓ Complete document processing workflow verified');
}

/**
 * Test multiple document processing scenario
 */
async function testMultipleDocumentProcessing() {
  const documents = [
    {
      name: 'Microsoft_ESG_Report_2023.pdf',
      companyName: 'Microsoft',
      claimsCount: 3,
      expectedVerified: 1,
      expectedQuestionable: 1,
      expectedUnverified: 1
    },
    {
      name: 'Tesla_Sustainability_Report_2023.pdf',
      companyName: 'Tesla',
      claimsCount: 5,
      expectedVerified: 2,
      expectedQuestionable: 2,
      expectedUnverified: 1
    },
    {
      name: 'Amazon_Climate_Pledge_2023.pdf',
      companyName: 'Amazon',
      claimsCount: 4,
      expectedVerified: 1,
      expectedQuestionable: 1,
      expectedUnverified: 2
    }
  ];

  let totalDocuments = 0;
  let totalClaims = 0;
  let totalVerified = 0;
  let totalQuestionable = 0;
  let totalUnverified = 0;

  for (const docInfo of documents) {
    // Generate mock claims for each document
    const claims = Array.from({ length: docInfo.claimsCount }, (_, i) => {
      let status;
      if (i < docInfo.expectedVerified) {
        status = 'verified';
      } else if (i < docInfo.expectedVerified + docInfo.expectedQuestionable) {
        status = 'questionable';
      } else {
        status = 'unverified';
      }

      return {
        id: i + 1,
        text: `${docInfo.companyName} claim ${i + 1} about sustainability metrics.`,
        category: 'sustainability',
        confidence: 0.8 + (Math.random() * 0.2),
        status: status,
        evidence: status === 'verified' ? 3 : status === 'questionable' ? 2 : 1,
        reasoning: `${status} claim based on ESG database matching`
      };
    });

    // Add document to DataService
    const documentData = {
      filename: docInfo.name,
      size: '2.5 MB',
      status: 'completed',
      processingMode: 'Python',
      claims: claims,
      companyName: docInfo.companyName,
      jobId: `multi_test_${Date.now()}_${totalDocuments}`
    };

    const addedDocument = DataService.addDocument(documentData);
    if (!addedDocument) {
      throw new Error(`Failed to add document: ${docInfo.name}`);
    }

    totalDocuments++;
    totalClaims += docInfo.claimsCount;
    totalVerified += docInfo.expectedVerified;
    totalQuestionable += docInfo.expectedQuestionable;
    totalUnverified += docInfo.expectedUnverified;
  }

  // Verify overall statistics
  const overallStats = DataService.calculateOverallStats();
  
  if (overallStats.totalDocuments !== totalDocuments) {
    throw new Error(`Expected ${totalDocuments} total documents, got ${overallStats.totalDocuments}`);
  }

  if (overallStats.totalClaims !== totalClaims) {
    throw new Error(`Expected ${totalClaims} total claims, got ${overallStats.totalClaims}`);
  }

  if (overallStats.verified !== totalVerified) {
    throw new Error(`Expected ${totalVerified} verified claims, got ${overallStats.verified}`);
  }

  if (overallStats.questionable !== totalQuestionable) {
    throw new Error(`Expected ${totalQuestionable} questionable claims, got ${overallStats.questionable}`);
  }

  if (overallStats.unverified !== totalUnverified) {
    throw new Error(`Expected ${totalUnverified} unverified claims, got ${overallStats.unverified}`);
  }

  // Test document search across multiple documents
  const searchResults = DataService.searchDocuments('Tesla');
  if (searchResults.length !== 1) {
    throw new Error(`Expected 1 Tesla document in search, got ${searchResults.length}`);
  }

  // Test claims filtering across all documents
  const allVerifiedClaims = DataService.filterClaimsByStatus('verified');
  if (allVerifiedClaims.length !== totalVerified) {
    throw new Error(`Expected ${totalVerified} verified claims across all documents, got ${allVerifiedClaims.length}`);
  }

  console.log(`✓ Multiple document processing verified (${totalDocuments} docs, ${totalClaims} claims)`);
}

/**
 * Test error recovery and resilience
 */
async function testErrorRecoveryAndResilience() {
  // Test 1: Invalid document handling
  const invalidDocument = {
    uri: null,
    name: 'invalid.txt',
    size: 0,
    type: 'text/plain'
  };

  const validation = DocumentProcessor.validateDocument(invalidDocument);
  if (validation.isValid) {
    throw new Error('Invalid document should fail validation');
  }

  // Test 2: Malformed processing results
  const malformedResults = {
    invalid: 'structure',
    missing: 'required_fields'
  };

  if (PythonBridge.validateProcessingResults(malformedResults)) {
    throw new Error('Malformed results should fail validation');
  }

  // Test 3: Document with no claims
  const documentWithNoClaims = {
    filename: 'empty_document.pdf',
    size: '1 MB',
    status: 'completed',
    processingMode: 'Python',
    claims: [],
    companyName: 'Empty Company',
    jobId: 'empty_test'
  };

  const emptyDocument = DataService.addDocument(documentWithNoClaims);
  if (!emptyDocument) {
    throw new Error('Should be able to add document with no claims');
  }

  const emptyClaims = DataService.getClaimsByDocumentId(emptyDocument.id);
  if (emptyClaims.length !== 0) {
    throw new Error(`Expected 0 claims for empty document, got ${emptyClaims.length}`);
  }

  // Test 4: Corrupted claim data handling
  const documentWithCorruptedClaims = {
    filename: 'corrupted_claims.pdf',
    size: '1 MB',
    status: 'completed',
    processingMode: 'Python',
    claims: [
      { id: 1, text: 'Valid claim', status: 'verified', confidence: 0.8 },
      { invalid: 'claim', missing: 'required_fields' },
      { id: 3, text: 'Another valid claim', status: 'questionable', confidence: 0.7 }
    ],
    companyName: 'Corrupted Company',
    jobId: 'corrupted_test'
  };

  const corruptedDocument = DataService.addDocument(documentWithCorruptedClaims);
  if (!corruptedDocument) {
    throw new Error('Should be able to add document with some corrupted claims');
  }

  // Should only get valid claims
  const validClaims = DataService.getClaimsByDocumentId(corruptedDocument.id);
  if (validClaims.length !== 2) {
    throw new Error(`Expected 2 valid claims after filtering corrupted data, got ${validClaims.length}`);
  }

  // Test 5: System recovery after errors
  try {
    DataService.getDocumentById('definitely_nonexistent_id');
    throw new Error('Should have thrown error for nonexistent document');
  } catch (error) {
    if (!error.message.includes('not found')) {
      throw new Error(`Expected "not found" error, got: ${error.message}`);
    }
  }

  // System should still be functional after error
  const allDocuments = DataService.getAllDocuments();
  if (allDocuments.length < 2) {
    throw new Error('System should still be functional after handling errors');
  }

  console.log('✓ Error recovery and resilience verified');
}

/**
 * Test data consistency and integrity
 */
async function testDataConsistencyAndIntegrity() {
  // Clear existing data
  DataService.clearAllData();

  // Add test document with known data
  const testDocument = {
    filename: 'consistency_test.pdf',
    size: '2 MB',
    status: 'completed',
    processingMode: 'Python',
    claims: [
      { id: 1, text: 'Verified claim', status: 'verified', confidence: 0.9 },
      { id: 2, text: 'Questionable claim', status: 'questionable', confidence: 0.7 },
      { id: 3, text: 'Unverified claim', status: 'unverified', confidence: 0.5 }
    ],
    companyName: 'Consistency Test Company',
    jobId: 'consistency_test'
  };

  const addedDocument = DataService.addDocument(testDocument);

  // Test 1: Document-level consistency
  const retrievedDocument = DataService.getDocumentById(addedDocument.id);
  if (retrievedDocument.claims.length !== 3) {
    throw new Error('Document claims count inconsistent');
  }

  // Test 2: Claims-level consistency
  const documentClaims = DataService.getClaimsByDocumentId(addedDocument.id);
  const allClaims = DataService.getAllClaims();

  if (documentClaims.length !== 3) {
    throw new Error('Document-specific claims count inconsistent');
  }

  if (allClaims.length !== 3) {
    throw new Error('All claims count inconsistent');
  }

  // Test 3: Status filtering consistency
  const verifiedClaims = DataService.filterClaimsByStatus('verified');
  const questionableClaims = DataService.filterClaimsByStatus('questionable');
  const unverifiedClaims = DataService.filterClaimsByStatus('unverified');
  const allFilteredClaims = DataService.filterClaimsByStatus('all');

  if (verifiedClaims.length !== 1) {
    throw new Error('Verified claims filtering inconsistent');
  }

  if (questionableClaims.length !== 1) {
    throw new Error('Questionable claims filtering inconsistent');
  }

  if (unverifiedClaims.length !== 1) {
    throw new Error('Unverified claims filtering inconsistent');
  }

  if (allFilteredClaims.length !== 3) {
    throw new Error('All claims filtering inconsistent');
  }

  // Test 4: Statistics consistency
  const overallStats = DataService.calculateOverallStats();
  const documentSummary = retrievedDocument.summary;

  if (overallStats.totalClaims !== documentSummary.totalClaims) {
    throw new Error('Overall stats and document summary inconsistent');
  }

  if (overallStats.verified !== documentSummary.verified) {
    throw new Error('Verified count inconsistent between overall stats and document summary');
  }

  // Test 5: Cross-reference integrity
  for (const claim of documentClaims) {
    if (claim.documentId !== addedDocument.id) {
      throw new Error('Claim document reference integrity violated');
    }

    if (claim.documentTitle !== addedDocument.title) {
      throw new Error('Claim document title reference integrity violated');
    }
  }

  console.log('✓ Data consistency and integrity verified');
}

/**
 * Test performance under load
 */
async function testPerformanceUnderLoad() {
  const startTime = Date.now();
  
  // Clear existing data
  DataService.clearAllData();

  // Generate load test data
  const numDocuments = 20;
  const claimsPerDocument = 10;
  const totalExpectedClaims = numDocuments * claimsPerDocument;

  console.log(`Generating load test with ${numDocuments} documents, ${claimsPerDocument} claims each...`);

  // Add documents in batch
  const addStartTime = Date.now();
  for (let i = 0; i < numDocuments; i++) {
    const claims = Array.from({ length: claimsPerDocument }, (_, j) => ({
      id: j + 1,
      text: `Load test claim ${j + 1} for document ${i + 1}`,
      category: 'load_test',
      confidence: 0.5 + (Math.random() * 0.5),
      status: ['verified', 'questionable', 'unverified'][j % 3],
      evidence: Math.floor(Math.random() * 4),
      reasoning: `Load test reasoning for claim ${j + 1}`
    }));

    const documentData = {
      filename: `load_test_document_${i + 1}.pdf`,
      size: `${Math.floor(Math.random() * 5) + 1} MB`,
      status: 'completed',
      processingMode: 'Python',
      claims: claims,
      companyName: `Load Test Company ${i + 1}`,
      jobId: `load_test_${i + 1}`
    };

    DataService.addDocument(documentData);
  }
  const addDuration = Date.now() - addStartTime;

  // Test retrieval performance
  const retrievalStartTime = Date.now();
  const allDocuments = DataService.getAllDocuments();
  const allClaims = DataService.getAllClaims();
  const overallStats = DataService.calculateOverallStats();
  const retrievalDuration = Date.now() - retrievalStartTime;

  // Test filtering performance
  const filterStartTime = Date.now();
  const verifiedClaims = DataService.filterClaimsByStatus('verified');
  const questionableClaims = DataService.filterClaimsByStatus('questionable');
  const unverifiedClaims = DataService.filterClaimsByStatus('unverified');
  const flaggedClaims = DataService.getFlaggedClaims();
  const filterDuration = Date.now() - filterStartTime;

  // Test search performance
  const searchStartTime = Date.now();
  const searchResults = DataService.searchDocuments('Load Test Company 1');
  const searchDuration = Date.now() - searchStartTime;

  const totalDuration = Date.now() - startTime;

  // Validate results
  if (allDocuments.length !== numDocuments) {
    throw new Error(`Expected ${numDocuments} documents, got ${allDocuments.length}`);
  }

  if (allClaims.length !== totalExpectedClaims) {
    throw new Error(`Expected ${totalExpectedClaims} claims, got ${allClaims.length}`);
  }

  if (overallStats.totalDocuments !== numDocuments) {
    throw new Error(`Stats show ${overallStats.totalDocuments} documents, expected ${numDocuments}`);
  }

  if (overallStats.totalClaims !== totalExpectedClaims) {
    throw new Error(`Stats show ${overallStats.totalClaims} claims, expected ${totalExpectedClaims}`);
  }

  // Performance thresholds (adjust based on requirements)
  const maxAddTime = 2000; // 2 seconds
  const maxRetrievalTime = 1000; // 1 second
  const maxFilterTime = 500; // 0.5 seconds
  const maxSearchTime = 200; // 0.2 seconds

  const performanceIssues = [];
  if (addDuration > maxAddTime) {
    performanceIssues.push(`Document addition took ${addDuration}ms (threshold: ${maxAddTime}ms)`);
  }
  if (retrievalDuration > maxRetrievalTime) {
    performanceIssues.push(`Data retrieval took ${retrievalDuration}ms (threshold: ${maxRetrievalTime}ms)`);
  }
  if (filterDuration > maxFilterTime) {
    performanceIssues.push(`Claims filtering took ${filterDuration}ms (threshold: ${maxFilterTime}ms)`);
  }
  if (searchDuration > maxSearchTime) {
    performanceIssues.push(`Document search took ${searchDuration}ms (threshold: ${maxSearchTime}ms)`);
  }

  if (performanceIssues.length > 0) {
    console.warn('Performance issues detected:');
    performanceIssues.forEach(issue => console.warn(`- ${issue}`));
  }

  console.log(`✓ Performance under load verified (Total: ${totalDuration}ms, Add: ${addDuration}ms, Retrieve: ${retrievalDuration}ms, Filter: ${filterDuration}ms, Search: ${searchDuration}ms)`);
}

/**
 * Main end-to-end test runner
 */
export async function runEndToEndTests() {
  console.log('ESG Claim Verification - End-to-End Tests');
  console.log('='.repeat(60));

  const testSuite = new EndToEndTestSuite();

  try {
    await testSuite.setup();

    // Run all end-to-end test scenarios
    await testSuite.runTestScenario('Complete Document Processing Workflow', testCompleteDocumentProcessingWorkflow);
    await testSuite.runTestScenario('Multiple Document Processing', testMultipleDocumentProcessing);
    await testSuite.runTestScenario('Error Recovery and Resilience', testErrorRecoveryAndResilience);
    await testSuite.runTestScenario('Data Consistency and Integrity', testDataConsistencyAndIntegrity);
    await testSuite.runTestScenario('Performance Under Load', testPerformanceUnderLoad);

    const success = testSuite.printResults();
    
    await testSuite.cleanup();
    
    return success;

  } catch (error) {
    console.error('End-to-end test suite failed:', error);
    await testSuite.cleanup();
    return false;
  }
}

// Export individual test functions
export {
  testCompleteDocumentProcessingWorkflow,
  testMultipleDocumentProcessing,
  testErrorRecoveryAndResilience,
  testDataConsistencyAndIntegrity,
  testPerformanceUnderLoad
};

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runEndToEndTests().then(success => {
    console.log(`\nEnd-to-end tests ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('End-to-end tests failed with error:', error);
    process.exit(1);
  });
}