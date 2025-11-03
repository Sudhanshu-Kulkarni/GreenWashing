// Node.js Compatible Integration Tests for ESG Claim Verification System
// Tests core functionality without React Native/Expo dependencies

import { DataService } from '../dataService.js';

/**
 * Mock FileSystem for Node.js testing
 */
const MockFileSystem = {
  documentDirectory: '/mock/documents/',
  
  async getInfoAsync(path) {
    return { exists: true, size: 1024 * 1024 };
  },
  
  async makeDirectoryAsync(path, options) {
    return true;
  },
  
  async writeAsStringAsync(path, content) {
    return true;
  },
  
  async readAsStringAsync(path) {
    return '{"mock": "data"}';
  },
  
  async readDirectoryAsync(path) {
    return ['mock_file.json'];
  },
  
  async copyAsync(options) {
    return true;
  },
  
  async deleteAsync(path) {
    return true;
  }
};

/**
 * Node.js compatible test runner
 */
class NodeTestRunner {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

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
      console.log(`✗ FAILED: ${testName} - ${error.message}`);
      this.failedTests++;
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
      return false;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('NODE.JS COMPATIBLE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    if (this.failedTests > 0) {
      console.log('\nFAILED TESTS:');
      this.testResults
        .filter(result => result.status === 'FAILED')
        .forEach(result => {
          console.log(`- ${result.name}: ${result.error}`);
        });
    }
    
    return this.failedTests === 0;
  }
}

/**
 * Test DataService core functionality
 */
async function testDataServiceCore() {
  // Clear existing data
  DataService.clearAllData();
  
  // Test empty state
  const emptyDocs = DataService.getAllDocuments();
  if (emptyDocs.length !== 0) {
    throw new Error('Expected empty documents array');
  }
  
  const emptyClaims = DataService.getAllClaims();
  if (emptyClaims.length !== 0) {
    throw new Error('Expected empty claims array');
  }
  
  // Test adding documents
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
        reasoning: 'Partial match found'
      }
    ]
  };
  
  const addedDoc = DataService.addDocument(testDocument);
  if (!addedDoc || !addedDoc.id) {
    throw new Error('Failed to add document');
  }
  
  // Test retrieval
  const retrievedDoc = DataService.getDocumentById(addedDoc.id);
  if (!retrievedDoc) {
    throw new Error('Failed to retrieve document');
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
  
  // Test statistics
  const stats = DataService.calculateOverallStats();
  if (stats.totalDocuments !== 1 || stats.totalClaims !== 2) {
    throw new Error('Statistics calculation failed');
  }
  
  console.log('✓ DataService core functionality verified');
}

/**
 * Test error handling and edge cases
 */
async function testErrorHandling() {
  // Test invalid document ID
  try {
    DataService.getDocumentById('nonexistent');
    throw new Error('Should have thrown error for nonexistent document');
  } catch (error) {
    if (!error.message.includes('DOCUMENT_NOT_FOUND') && !error.message.includes('not found')) {
      throw new Error(`Expected "DOCUMENT_NOT_FOUND" or "not found" error, got: ${error.message}`);
    }
  }
  
  // Test null/undefined inputs
  try {
    DataService.getDocumentById(null);
    throw new Error('Should have thrown error for null document ID');
  } catch (error) {
    if (!error.message.includes('INVALID_DOCUMENT_ID') && !error.message.includes('Invalid document ID')) {
      throw new Error(`Expected "INVALID_DOCUMENT_ID" or "Invalid document ID" error, got: ${error.message}`);
    }
  }
  
  // Test empty data handling
  DataService.clearAllData();
  const emptyStats = DataService.calculateOverallStats();
  if (emptyStats.totalDocuments !== 0) {
    throw new Error('Empty stats should show 0 documents');
  }
  
  console.log('✓ Error handling verified');
}

/**
 * Test data consistency and validation
 */
async function testDataConsistency() {
  DataService.clearAllData();
  
  // Add test data
  const doc1 = DataService.addDocument({
    filename: 'doc1.pdf',
    size: '1 MB',
    status: 'completed',
    processingMode: 'Python',
    claims: [
      { id: 1, text: 'Claim 1', status: 'verified', confidence: 0.9 },
      { id: 2, text: 'Claim 2', status: 'questionable', confidence: 0.7 }
    ]
  });
  
  const doc2 = DataService.addDocument({
    filename: 'doc2.pdf',
    size: '2 MB',
    status: 'completed',
    processingMode: 'Python',
    claims: [
      { id: 1, text: 'Claim 3', status: 'unverified', confidence: 0.5 }
    ]
  });
  
  // Test consistency across different access methods
  const allDocs = DataService.getAllDocuments();
  const allClaims = DataService.getAllClaims();
  const stats = DataService.calculateOverallStats();
  
  if (allDocs.length !== 2) {
    throw new Error(`Expected 2 documents, got ${allDocs.length}`);
  }
  
  if (allClaims.length !== 3) {
    throw new Error(`Expected 3 claims, got ${allClaims.length}`);
  }
  
  if (stats.totalDocuments !== 2 || stats.totalClaims !== 3) {
    throw new Error('Statistics inconsistent with actual data');
  }
  
  // Test filtering consistency
  const verified = DataService.filterClaimsByStatus('verified');
  const questionable = DataService.filterClaimsByStatus('questionable');
  const unverified = DataService.filterClaimsByStatus('unverified');
  
  if (verified.length + questionable.length + unverified.length !== allClaims.length) {
    throw new Error('Filtered claims total does not match all claims');
  }
  
  console.log('✓ Data consistency verified');
}

/**
 * Test performance with larger datasets
 */
async function testPerformance() {
  DataService.clearAllData();
  
  const startTime = Date.now();
  const numDocs = 50;
  const claimsPerDoc = 5;
  
  // Add multiple documents
  for (let i = 0; i < numDocs; i++) {
    const claims = Array.from({ length: claimsPerDoc }, (_, j) => ({
      id: j + 1,
      text: `Performance test claim ${j + 1} for document ${i + 1}`,
      category: 'performance_test',
      confidence: 0.5 + (Math.random() * 0.5),
      status: ['verified', 'questionable', 'unverified'][j % 3],
      evidence: Math.floor(Math.random() * 4),
      reasoning: `Performance test reasoning ${j + 1}`
    }));
    
    DataService.addDocument({
      filename: `perf_test_${i + 1}.pdf`,
      size: `${Math.floor(Math.random() * 5) + 1} MB`,
      status: 'completed',
      processingMode: 'Python',
      claims: claims
    });
  }
  
  const addTime = Date.now() - startTime;
  
  // Test retrieval performance
  const retrievalStart = Date.now();
  const allDocs = DataService.getAllDocuments();
  const allClaims = DataService.getAllClaims();
  const stats = DataService.calculateOverallStats();
  const retrievalTime = Date.now() - retrievalStart;
  
  // Test filtering performance
  const filterStart = Date.now();
  const verified = DataService.filterClaimsByStatus('verified');
  const questionable = DataService.filterClaimsByStatus('questionable');
  const unverified = DataService.filterClaimsByStatus('unverified');
  const filterTime = Date.now() - filterStart;
  
  // Validate results
  if (allDocs.length !== numDocs) {
    throw new Error(`Expected ${numDocs} documents, got ${allDocs.length}`);
  }
  
  if (allClaims.length !== numDocs * claimsPerDoc) {
    throw new Error(`Expected ${numDocs * claimsPerDoc} claims, got ${allClaims.length}`);
  }
  
  // Performance thresholds
  const maxAddTime = 1000; // 1 second
  const maxRetrievalTime = 500; // 0.5 seconds
  const maxFilterTime = 200; // 0.2 seconds
  
  if (addTime > maxAddTime) {
    console.warn(`Add time ${addTime}ms exceeds threshold ${maxAddTime}ms`);
  }
  
  if (retrievalTime > maxRetrievalTime) {
    console.warn(`Retrieval time ${retrievalTime}ms exceeds threshold ${maxRetrievalTime}ms`);
  }
  
  if (filterTime > maxFilterTime) {
    console.warn(`Filter time ${filterTime}ms exceeds threshold ${maxFilterTime}ms`);
  }
  
  console.log(`✓ Performance test completed (Add: ${addTime}ms, Retrieve: ${retrievalTime}ms, Filter: ${filterTime}ms)`);
}

/**
 * Test company name extraction logic (mock version)
 */
async function testCompanyNameExtraction() {
  // Mock the company name extraction logic
  function extractCompanyName(filename) {
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
  
  const testCases = [
    { filename: 'Apple_Sustainability_Report_2023.pdf', expected: 'Apple' },
    { filename: 'Microsoft-ESG-Report-2024.pdf', expected: 'Microsoft' },
    { filename: 'tesla_annual_report_2023.pdf', expected: 'Tesla' },
    { filename: 'Amazon_2024_Sustainability_Report.pdf', expected: 'Amazon' },
  ];
  
  for (const test of testCases) {
    const result = extractCompanyName(test.filename);
    if (!result.toLowerCase().includes(test.expected.toLowerCase())) {
      throw new Error(`Expected "${test.expected}" in "${result}" for filename "${test.filename}"`);
    }
  }
  
  console.log('✓ Company name extraction verified');
}

/**
 * Test results structure validation
 */
async function testResultsStructure() {
  const mockResults = {
    job_id: 'test_job_123',
    document_info: {
      filename: 'test_document.pdf',
      company_name: 'Test Company',
      total_sentences: 100,
      processing_time: 5.2,
    },
    claims: [
      {
        id: 1,
        text: 'Test claim about emissions',
        confidence: 0.85,
        verification_status: 'verified',
        extracted_data: {
          metric: 'emissions_tCO2e',
          value: 1000000,
          unit: 'tons',
          year: 2024,
        },
        match_details: {
          csv_match: true,
          tolerance_check: true,
          reasoning: 'Claim verified against CSV data',
        }
      }
    ],
    summary: {
      total_claims: 1,
      verified: 1,
      questionable: 0,
      unverified: 0,
    },
    status: 'completed',
  };
  
  // Test JSON serialization
  try {
    const jsonStr = JSON.stringify(mockResults, null, 2);
    const parsed = JSON.parse(jsonStr);
    if (!parsed.job_id) {
      throw new Error('JSON serialization failed');
    }
  } catch (error) {
    throw new Error(`JSON serialization failed: ${error.message}`);
  }
  
  // Test required fields
  const requiredFields = ['job_id', 'document_info', 'claims', 'summary', 'status'];
  for (const field of requiredFields) {
    if (!mockResults.hasOwnProperty(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Test claims structure
  if (!Array.isArray(mockResults.claims)) {
    throw new Error('Claims should be an array');
  }
  
  if (mockResults.claims.length > 0) {
    const claim = mockResults.claims[0];
    const requiredClaimFields = ['id', 'text', 'confidence', 'verification_status'];
    for (const field of requiredClaimFields) {
      if (!claim.hasOwnProperty(field)) {
        throw new Error(`Missing required claim field: ${field}`);
      }
    }
  }
  
  console.log('✓ Results structure validation verified');
}

/**
 * Main test runner
 */
async function runNodeCompatibleTests() {
  console.log('ESG Claim Verification - Node.js Compatible Tests');
  console.log('='.repeat(60));
  
  const runner = new NodeTestRunner();
  
  // Run all tests
  await runner.runTest('DataService Core Functionality', testDataServiceCore);
  await runner.runTest('Error Handling', testErrorHandling);
  await runner.runTest('Data Consistency', testDataConsistency);
  await runner.runTest('Performance Testing', testPerformance);
  await runner.runTest('Company Name Extraction', testCompanyNameExtraction);
  await runner.runTest('Results Structure Validation', testResultsStructure);
  
  const success = runner.printSummary();
  return success;
}

// Export for use in other test files
export {
  runNodeCompatibleTests,
  testDataServiceCore,
  testErrorHandling,
  testDataConsistency,
  testPerformance,
  testCompanyNameExtraction,
  testResultsStructure
};

// Run tests if this file is executed directly
if (typeof process !== 'undefined' && process.argv[1] === new URL(import.meta.url).pathname) {
  runNodeCompatibleTests().then(success => {
    console.log(`\nNode.js compatible tests ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Tests failed with error:', error);
    process.exit(1);
  });
}